"""
Supabase Service
All direct Supabase DB operations for the chat system.
Uses the service key so RLS doesn't block backend writes.
"""

import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client


# ─── Conversations ────────────────────────────────────────────────────────────

def create_conversation(user_id: str, title: str = "New Chat") -> Dict[str, Any]:
    sb = get_supabase()
    result = sb.table("conversations").insert({
        "user_id": user_id,
        "title":   title,
    }).execute()
    return result.data[0] if result.data else {}


def get_conversations(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    sb = get_supabase()
    result = (
        sb.table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def get_conversation(conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    sb = get_supabase()
    result = (
        sb.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return result.data


def update_conversation_title(conversation_id: str, title: str) -> None:
    sb = get_supabase()
    sb.table("conversations").update({"title": title}).eq("id", conversation_id).execute()


def delete_conversation(conversation_id: str, user_id: str) -> None:
    sb = get_supabase()
    # Messages cascade-delete via FK
    sb.table("conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()


# ─── Messages ─────────────────────────────────────────────────────────────────

def save_message(conversation_id: str, role: str, content: str) -> Dict[str, Any]:
    sb = get_supabase()
    result = sb.table("messages").insert({
        "conversation_id": conversation_id,
        "role":            role,
        "content":         content,
    }).execute()
    return result.data[0] if result.data else {}


def get_messages(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    sb = get_supabase()
    result = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


def get_recent_messages_for_context(
    conversation_id: str,
    limit: int = 20,
) -> List[Dict[str, str]]:
    """Return last N messages as simple {role, content} dicts for Gemini."""
    sb = get_supabase()
    result = (
        sb.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    # Reverse so oldest first
    msgs = list(reversed(result.data or []))
    return [{"role": m["role"], "content": m["content"]} for m in msgs]


def count_messages(conversation_id: str) -> int:
    sb = get_supabase()
    result = (
        sb.table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    return result.count or 0


# ─── User expense context (for Gemini context injection) ─────────────────────

def get_user_expense_context(user_id: str, limit: int = 10) -> str:
    """
    Fetch recent expenses + pending transactions and format as
    a short text block to inject into the Gemini prompt.
    """
    sb = get_supabase()
    lines = []

    try:
        exp = (
            sb.table("expenses")
            .select("purpose, amount, type, date, location")
            .eq("user_id", user_id)
            .order("date", desc=True)
            .limit(limit)
            .execute()
        )
        if exp.data:
            lines.append("Recent expenses:")
            for e in exp.data:
                lines.append(
                    f"  • {e['date']} — {e['purpose']} ₹{e['amount']} ({e['type']})"
                    + (f" at {e['location']}" if e.get("location") else "")
                )
    except Exception as ex:
        logger.warning(f"Could not fetch expenses for context: {ex}")

    try:
        tx = (
            sb.table("transactions")
            .select("transaction_type, person_name, amount, status, expected_return_date")
            .eq("user_id", user_id)
            .eq("status", "PENDING")
            .order("given_date", desc=True)
            .limit(5)
            .execute()
        )
        if tx.data:
            lines.append("\nPending transactions:")
            for t in tx.data:
                direction = "from" if t["transaction_type"] == "BORROWED" else "to"
                lines.append(
                    f"  • {t['transaction_type']} ₹{t['amount']} {direction} {t['person_name']}"
                    + (f" (due {t['expected_return_date']})" if t.get("expected_return_date") else "")
                )
    except Exception as ex:
        logger.warning(f"Could not fetch transactions for context: {ex}")

    return "\n".join(lines)
