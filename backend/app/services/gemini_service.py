"""
Gemini AI Service
Handles all communication with Google Gemini API.
Async-safe, lightweight, clean prompt construction.
"""

import logging
from typing import List, Dict
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

SYSTEM_PROMPT = """You are Tracksy AI, a smart personal finance assistant built into an expense tracker app.

You help users understand their spending, track borrowed/lent money, and manage their finances.

Guidelines:
- Be concise, friendly, and helpful
- Use ₹ for Indian Rupee amounts
- When you have expense/transaction context, reference it specifically
- If asked about data you don't have, say so clearly
- Keep responses under 200 words unless detail is needed
- Format lists with bullet points for readability
"""


def _build_contents(
    history: List[Dict[str, str]],
    user_message: str,
    context_text: str,
) -> List[Dict]:
    """
    Build the Gemini `contents` array.
    Injects expense context into the first user turn.
    Sends only the last 20 messages to keep tokens low.
    """
    contents = []

    # Trim history to last 20 messages
    recent = history[-20:] if len(history) > 20 else history

    for msg in recent:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    # Build the current user turn with optional context
    if context_text:
        user_turn = (
            f"[Relevant financial context from my records]\n{context_text}\n\n"
            f"[My question]\n{user_message}"
        )
    else:
        user_turn = user_message

    contents.append({"role": "user", "parts": [{"text": user_turn}]})
    return contents


async def generate_response(
    history: List[Dict[str, str]],
    user_message: str,
    context_text: str = "",
) -> str:
    """
    Call Gemini and return the assistant text.
    Raises on hard failures; returns fallback string on soft failures.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return "Gemini API key is not configured. Please add it to the backend .env file."

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": _build_contents(history, user_message, context_text),
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512,
            "topP": 0.9,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GEMINI_URL}?key={api_key}",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
            return "I couldn't generate a response. Please try again."
    except httpx.HTTPStatusError as e:
        logger.error(f"Gemini HTTP error {e.response.status_code}: {e.response.text}")
        return "AI service returned an error. Please try again shortly."
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        return "AI service is temporarily unavailable."
