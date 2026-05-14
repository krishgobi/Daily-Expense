"""
Groq AI Service
Handles all communication with Groq API using the OpenAI-compatible SDK.
Async-safe, lightweight, clean prompt construction.
"""

import logging
from typing import List, Dict

from openai import AsyncOpenAI, APIStatusError, APITimeoutError, RateLimitError

from app.config import settings

logger = logging.getLogger(__name__)

MODEL_PRIMARY = "llama-3.3-70b-versatile"
MODEL_FALLBACK = "llama3-70b-8192"

SYSTEM_PROMPT = """You are Tracksy AI, a smart personal finance assistant built into an expense tracker app.

You help users understand their spending, track borrowed/lent money, and manage their finances.

Guidelines:
- Be concise, friendly, and helpful
- Use ₹ for Indian Rupee amounts
- When you have expense/transaction context, reference it specifically
- Supabase is the source of truth — never invent or fabricate financial records
- If asked about data you don't have, say so clearly
- Keep responses under 150 words unless detail is needed
- Format lists with bullet points for readability
- Prioritize accuracy over creativity with financial data
"""


def _build_messages(
    history: List[Dict[str, str]],
    user_message: str,
    context_text: str,
) -> List[Dict]:
    """Build the messages array for Groq chat completion."""
    messages: List[Dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    recent = history[-20:] if len(history) > 20 else history
    for msg in recent:
        role = "user" if msg["role"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})

    if context_text:
        user_turn = (
            f"[My financial data]\n{context_text}\n\n"
            f"[My question]\n{user_message}"
        )
    else:
        user_turn = user_message

    messages.append({"role": "user", "content": user_turn})
    return messages


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        timeout=30.0,
    )


async def _call_model(client: AsyncOpenAI, messages: List[Dict], model: str) -> str:
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.2,
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()


async def generate_response(
    history: List[Dict[str, str]],
    user_message: str,
    context_text: str = "",
) -> str:
    """
    Call Groq and return the assistant text.
    Tries primary model first, falls back to MODEL_FALLBACK on 404.
    Returns a graceful string on all API failures — never raises.
    """
    if not settings.GROQ_API_KEY:
        return "Groq API key is not configured. Please add GROQ_API_KEY to the backend .env file."

    client = _get_client()
    messages = _build_messages(history, user_message, context_text)

    for model in (MODEL_PRIMARY, MODEL_FALLBACK):
        try:
            return await _call_model(client, messages, model)
        except RateLimitError as e:
            logger.error("Groq rate limit hit: %s", e)
            return "I'm receiving too many requests right now. Please try again in a moment."
        except APITimeoutError:
            logger.error("Groq request timed out")
            return "The AI service timed out. Please try again."
        except APIStatusError as e:
            if e.status_code == 404:
                logger.warning("Model %s not found, trying fallback", model)
                continue
            logger.error("Groq API error %d: %s", e.status_code, e.message)
            return "AI service returned an error. Please try again shortly."
        except Exception as e:
            logger.error("Groq unexpected error: %s", e)
            return "AI service is temporarily unavailable."

    return "AI service is temporarily unavailable. Please try again later."
