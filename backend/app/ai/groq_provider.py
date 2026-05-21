"""
Groq streaming provider — primary AI.
Yields tokens as they arrive from the API.
"""
import logging
from typing import AsyncGenerator
from openai import AsyncOpenAI, APIStatusError, APITimeoutError, RateLimitError
from app.config import settings

logger = logging.getLogger(__name__)
MODEL = "llama-3.1-8b-instant"


def _client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        timeout=12.0,
    )


async def stream(messages: list[dict]) -> AsyncGenerator[str, None]:
    """Yield text tokens from Groq. Raises on hard API failures so caller can fall back."""
    client = _client()
    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.1,
            max_tokens=180,
            stream=True,
        )
        async for chunk in resp:
            token = chunk.choices[0].delta.content
            if token:
                yield token
    except RateLimitError:
        yield "I'm getting too many requests right now — please try again in a moment."
    except APITimeoutError:
        yield "The AI timed out. Please try again."
    except APIStatusError as e:
        logger.error("Groq API %d: %s", e.status_code, e.message)
        raise
    except Exception as e:
        logger.error("Groq error: %s", e)
        raise
