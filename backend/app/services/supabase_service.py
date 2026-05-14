"""
Chat DB Service — SQLAlchemy implementation.
Replaces the former Supabase-client implementation so the chat feature
works without a valid SUPABASE_SERVICE_KEY.
"""

import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import text
from app.database.connection import SessionLocal

logger = logging.getLogger(__name__)


def _session():
    """Return a plain SQLAlchemy session (caller must close it)."""
    return SessionLocal()


# ─── Conversations ────────────────────────────────────────────────────────────

def create_conversation(user_id: str, title: str = "New Chat") -> Dict[str, Any]:
    db = _session()
    try:
        conv_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        db.execute(
            text("INSERT INTO conversations (id, user_id, title, created_at) VALUES (:id, :uid, :title, :now)"),
            {"id": conv_id, "uid": user_id, "title": title[:255], "now": now},
        )
        db.commit()
        return {"id": conv_id, "user_id": user_id, "title": title, "created_at": now}
    except Exception as exc:
        db.rollback()
        logger.error("create_conversation error: %s", exc)
        raise
    finally:
        db.close()


def get_conversations(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    db = _session()
    try:
        rows = db.execute(
            text(
                "SELECT id, user_id, title, created_at FROM conversations "
                "WHERE user_id = :uid ORDER BY created_at DESC LIMIT :lim"
            ),
            {"uid": user_id, "lim": limit},
        ).fetchall()
        return [
            {"id": str(r.id), "user_id": str(r.user_id), "title": r.title,
             "created_at": r.created_at.isoformat() if r.created_at else ""}
            for r in rows
        ]
    finally:
        db.close()


def get_conversation(conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    db = _session()
    try:
        row = db.execute(
            text(
                "SELECT id, user_id, title, created_at FROM conversations "
                "WHERE id = :cid AND user_id = :uid"
            ),
            {"cid": conversation_id, "uid": user_id},
        ).fetchone()
        if not row:
            return None
        return {"id": str(row.id), "user_id": str(row.user_id), "title": row.title,
                "created_at": row.created_at.isoformat() if row.created_at else ""}
    finally:
        db.close()


def delete_conversation(conversation_id: str, user_id: str) -> None:
    db = _session()
    try:
        db.execute(
            text("DELETE FROM conversations WHERE id = :cid AND user_id = :uid"),
            {"cid": conversation_id, "uid": user_id},
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("delete_conversation error: %s", exc)
        raise
    finally:
        db.close()


# ─── Messages ─────────────────────────────────────────────────────────────────

def save_message(conversation_id: str, role: str, content: str) -> Dict[str, Any]:
    db = _session()
    try:
        msg_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        db.execute(
            text(
                "INSERT INTO messages (id, conversation_id, role, content, created_at) "
                "VALUES (:id, :cid, :role, :content, :now)"
            ),
            {"id": msg_id, "cid": conversation_id, "role": role, "content": content, "now": now},
        )
        db.commit()
        return {"id": msg_id, "conversation_id": conversation_id, "role": role,
                "content": content, "created_at": now}
    except Exception as exc:
        db.rollback()
        logger.error("save_message error: %s", exc)
        raise
    finally:
        db.close()


def get_messages(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    db = _session()
    try:
        rows = db.execute(
            text(
                "SELECT id, conversation_id, role, content, created_at FROM messages "
                "WHERE conversation_id = :cid ORDER BY created_at ASC "
                "LIMIT :lim OFFSET :off"
            ),
            {"cid": conversation_id, "lim": limit, "off": offset},
        ).fetchall()
        return [
            {"id": str(r.id), "conversation_id": str(r.conversation_id),
             "role": r.role, "content": r.content,
             "created_at": r.created_at.isoformat() if r.created_at else ""}
            for r in rows
        ]
    finally:
        db.close()


def get_recent_messages_for_context(
    conversation_id: str,
    limit: int = 20,
) -> List[Dict[str, str]]:
    """Return last N messages as {role, content} for Gemini context."""
    db = _session()
    try:
        rows = db.execute(
            text(
                "SELECT role, content FROM messages "
                "WHERE conversation_id = :cid "
                "ORDER BY created_at DESC LIMIT :lim"
            ),
            {"cid": conversation_id, "lim": limit},
        ).fetchall()
        # Reverse so oldest-first
        return [{"role": r.role, "content": r.content} for r in reversed(rows)]
    finally:
        db.close()


# ─── Expense context for Gemini ───────────────────────────────────────────────

def get_user_expense_context(user_id: str, limit: int = 10) -> str:
    """
    Fetch recent expenses + pending transactions directly from the DB
    and format as a short text block for Gemini.
    """
    db = _session()
    lines: List[str] = []

    try:
        expenses = db.execute(
            text(
                "SELECT purpose, amount, type, date, location FROM expenses "
                "WHERE user_id = :uid ORDER BY date DESC LIMIT :lim"
            ),
            {"uid": user_id, "lim": limit},
        ).fetchall()
        if expenses:
            lines.append("Recent expenses:")
            for e in expenses:
                loc = f" at {e.location}" if e.location else ""
                lines.append(f"  • {e.date} — {e.purpose} ₹{e.amount} ({e.type}){loc}")
    except Exception as ex:
        logger.warning("Could not fetch expenses for context: %s", ex)

    try:
        txns = db.execute(
            text(
                "SELECT transaction_type, person_name, amount, status, expected_return_date "
                "FROM transactions WHERE user_id = :uid AND status = 'PENDING' "
                "ORDER BY given_date DESC LIMIT 5"
            ),
            {"uid": user_id},
        ).fetchall()
        if txns:
            lines.append("\nPending transactions:")
            for t in txns:
                direction = "from" if t.transaction_type == "BORROWED" else "to"
                due = f" (due {t.expected_return_date})" if t.expected_return_date else ""
                lines.append(
                    f"  • {t.transaction_type} ₹{t.amount} {direction} {t.person_name}{due}"
                )
    except Exception as ex:
        logger.warning("Could not fetch transactions for context: %s", ex)

    db.close()
    return "\n".join(lines)
