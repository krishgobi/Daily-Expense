"""
Chat Service v2
Orchestrates: Supabase persistence + Groq AI responses.
Clean separation — no DB logic here, no AI logic in supabase_service.
"""

import logging
from typing import Dict, Any, List, Optional
from app.services import supabase_service as db
from app.services import groq_service as ai

logger = logging.getLogger(__name__)


async def create_conversation(user_id: str, first_message: str) -> Dict[str, Any]:
    """Create a new conversation. Title = first 40 chars of first message."""
    title = first_message[:40].strip() + ("…" if len(first_message) > 40 else "")
    return db.create_conversation(user_id, title)


async def get_conversations(user_id: str) -> List[Dict[str, Any]]:
    return db.get_conversations(user_id)


async def get_messages(
    conversation_id: str,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    # Verify ownership
    conv = db.get_conversation(conversation_id, user_id)
    if not conv:
        raise ValueError("Conversation not found")
    return db.get_messages(conversation_id, limit, offset)


async def delete_conversation(conversation_id: str, user_id: str) -> None:
    db.delete_conversation(conversation_id, user_id)


async def send_message(
    user_id: str,
    conversation_id: Optional[str],
    user_message: str,
) -> Dict[str, Any]:
    """
    Full chat flow:
    1. Create conversation if needed
    2. Save user message
    3. Fetch recent history for context
    4. Fetch user's expense data for context
    5. Call Gemini
    6. Save assistant response
    7. Return response + conversation_id
    """
    # 1. Create conversation if not provided
    is_new = False
    if not conversation_id:
        conv = db.create_conversation(user_id, user_message[:40].strip())
        conversation_id = conv["id"]
        is_new = True
    else:
        # Verify ownership
        conv = db.get_conversation(conversation_id, user_id)
        if not conv:
            raise ValueError("Conversation not found")

    # 2. Save user message
    db.save_message(conversation_id, "user", user_message)

    # 3. Fetch recent history (last 20 messages, excluding the one we just saved)
    history = db.get_recent_messages_for_context(conversation_id, limit=20)
    # Remove the last entry (the user message we just saved — already in history)
    if history and history[-1]["role"] == "user" and history[-1]["content"] == user_message:
        history = history[:-1]

    # 4. Fetch expense context
    context_text = db.get_user_expense_context(user_id)

    # 5. Call Gemini
    ai_response = await ai.generate_response(
        history=history,
        user_message=user_message,
        context_text=context_text,
    )

    # 6. Save assistant response
    saved = db.save_message(conversation_id, "assistant", ai_response)

    # 7. Update conversation title on first message
    if is_new:
        pass  # Title already set from first message

    return {
        "conversation_id": conversation_id,
        "response":        ai_response,
        "message_id":      saved.get("id"),
        "is_new_conversation": is_new,
    }
