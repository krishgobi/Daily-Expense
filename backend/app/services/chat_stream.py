"""
Streaming chat orchestrator — SQL-first, AI-for-formatting only.

Flow per request (all parallel where possible):
  1. Detect intent  (< 1 ms, no network)
  2. Ensure conversation (1 DB write)
  3. Save user message  (fire-and-forget, async)
  4. SQL query + history fetch  (parallel)
  5. Build minimal prompt
  6. Stream from Groq → Gemini fallback
  7. Save AI response after stream (background)
"""
import asyncio
import json
import logging
from typing import AsyncGenerator, Optional

from app.ai       import intent as intent_module
from app.ai       import groq_provider, gemini_provider, prompt_builder
from app.repositories import finance_repo
from app.services import supabase_service as db

logger = logging.getLogger(__name__)


# ── SQL dispatch (runs in thread pool via asyncio.to_thread) ──────────────────

def _query(intent: intent_module.Intent, user_id: str):
    name, period = intent.name, intent.period
    try:
        if name in ('monthly_spend', 'today_spend', 'weekly_spend'):
            return finance_repo.get_spend_summary(user_id, period)
        if name == 'category_spend' and intent.category:
            return finance_repo.get_category_spend(user_id, intent.category, period)
        if name == 'top_expenses':
            return {"expenses": finance_repo.get_top_expenses(user_id, 5, period)}
        if name == 'recent_expenses':
            return {"expenses": finance_repo.get_recent_expenses(user_id, 5)}
        if name == 'balance':
            return finance_repo.get_balance(user_id)
        if name == 'lent':
            return {"transactions": finance_repo.get_lent(user_id)}
        if name == 'borrowed':
            return {"transactions": finance_repo.get_borrowed(user_id)}
        if name == 'income':
            return finance_repo.get_income(user_id)
        if name == 'comparison':
            return finance_repo.get_comparison(user_id)
        if name == 'savings':
            return finance_repo.get_savings(user_id)
    except Exception as exc:
        logger.warning("SQL failed for intent=%s: %s", name, exc)
    return None


# ── Main streaming generator ──────────────────────────────────────────────────

async def stream_chat(
    user_id:         str,
    message:         str,
    conversation_id: Optional[str],
) -> AsyncGenerator[str, None]:

    # 1. Intent detection — instant
    intent = intent_module.detect_intent(message)

    # 2. Ensure conversation
    is_new = False
    if not conversation_id:
        conv = db.create_conversation(user_id, message[:50].strip())
        conversation_id = conv["id"]
        is_new = True
    else:
        conv = db.get_conversation(conversation_id, user_id)
        if not conv:
            # Conversation deleted or not owned — start fresh
            conv = db.create_conversation(user_id, message[:50].strip())
            conversation_id = conv["id"]
            is_new = True

    # 3. Save user message — background (don't block streaming)
    asyncio.create_task(asyncio.to_thread(db.save_message, conversation_id, "user", message))

    # 4. Parallel: SQL query + last-5 history
    sql_task     = asyncio.to_thread(_query, intent, user_id)
    history_task = asyncio.to_thread(db.get_recent_messages_for_context, conversation_id, 5)
    results      = await asyncio.gather(sql_task, history_task, return_exceptions=True)

    data    = results[0] if not isinstance(results[0], Exception) else None
    history = results[1] if not isinstance(results[1], Exception) else []

    # Drop last entry if it's the user message we just saved
    if history and history[-1]["role"] == "user":
        history = history[:-1]

    # 5. Build minimal prompt
    messages = prompt_builder.build(message, data, intent.name, history)

    # 6. Stream header
    yield json.dumps({"type": "start", "conversation_id": conversation_id, "is_new": is_new}) + "\n"

    # 7. Stream tokens — Groq first, Gemini fallback
    full: list[str] = []
    groq_ok = True

    try:
        async for token in groq_provider.stream(messages):
            full.append(token)
            yield json.dumps({"type": "token", "content": token}) + "\n"
    except Exception:
        groq_ok = False

    if not groq_ok:
        full = []
        try:
            async for token in gemini_provider.stream(messages):
                full.append(token)
                yield json.dumps({"type": "token", "content": token}) + "\n"
        except Exception:
            err = "I'm temporarily unavailable. Please try again in a moment."
            full = [err]
            yield json.dumps({"type": "token", "content": err}) + "\n"

    # 8. Save AI response — background
    if full:
        asyncio.create_task(
            asyncio.to_thread(db.save_message, conversation_id, "assistant", "".join(full))
        )

    yield json.dumps({"type": "done"}) + "\n"
