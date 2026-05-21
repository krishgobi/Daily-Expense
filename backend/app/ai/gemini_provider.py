"""
Gemini Flash fallback provider — used only when Groq fails.
Streams via REST SSE to avoid SDK dependency.
"""
import json
import logging
from typing import AsyncGenerator
import httpx
from app.config import settings

logger = logging.getLogger(__name__)
_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent"


async def stream(messages: list[dict]) -> AsyncGenerator[str, None]:
    if not settings.GEMINI_API_KEY:
        yield "AI service is not configured."
        return

    # Convert OpenAI messages → Gemini format
    system_text = ""
    contents = []
    for m in messages:
        if m["role"] == "system":
            system_text = m["content"]
            continue
        role = "user" if m["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})

    payload: dict = {
        "contents": contents,
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 180},
    }
    if system_text:
        payload["systemInstruction"] = {"parts": [{"text": system_text}]}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            async with client.stream(
                "POST",
                f"{_URL}?key={settings.GEMINI_API_KEY}&alt=sse",
                json=payload,
            ) as response:
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    raw = line[6:].strip()
                    if not raw or raw == "[DONE]":
                        continue
                    try:
                        data = json.loads(raw)
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        if text:
                            yield text
                    except (KeyError, IndexError, json.JSONDecodeError):
                        continue
    except Exception as e:
        logger.error("Gemini error: %s", e)
        yield "AI service is temporarily unavailable. Please try again."
