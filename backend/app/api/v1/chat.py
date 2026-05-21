"""
Chat API Routes v2
WhatsApp-style persistent chat with Groq AI.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.dependencies import get_current_user_id
from app.services import chat_service_v2 as chat
from app.services import chat_stream

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    message:         str
    conversation_id: Optional[str] = None


class SendMessageResponse(BaseModel):
    conversation_id:      str
    response:             str
    message_id:           Optional[str] = None
    is_new_conversation:  bool = False


class ConversationOut(BaseModel):
    id:         str
    title:      str
    created_at: str


class MessageOut(BaseModel):
    id:         str
    role:       str   # "user" | "assistant"
    content:    str
    created_at: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/stream", tags=["chat"])
async def stream_message(
    req: SendMessageRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Stream AI response token-by-token (ChatGPT-style typing effect)."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def generate():
        async for chunk in chat_stream.stream_chat(user_id, req.message.strip(), req.conversation_id):
            yield f"data: {chunk}\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.post("/send", response_model=SendMessageResponse, tags=["chat"])
async def send_message(
    req: SendMessageRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Send a message and get an AI response. Creates a new conversation if none provided."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        result = await chat.send_message(
            user_id=user_id,
            conversation_id=req.conversation_id,
            user_message=req.message.strip(),
        )
        return SendMessageResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", tags=["chat"])
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
):
    """Get all conversations for the current user, newest first."""
    try:
        convs = await chat.get_conversations(user_id)
        return {"conversations": convs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations", tags=["chat"])
async def create_conversation(
    user_id: str = Depends(get_current_user_id),
):
    """Create a blank new conversation."""
    from app.services.supabase_service import create_conversation as db_create
    try:
        conv = db_create(user_id, "New Chat")
        return conv
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/messages", tags=["chat"])
async def get_messages(
    conversation_id: str,
    limit:  int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
):
    """Get paginated messages for a conversation."""
    try:
        msgs = await chat.get_messages(conversation_id, user_id, limit, offset)
        return {"messages": msgs, "conversation_id": conversation_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}", tags=["chat"])
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a conversation and all its messages."""
    try:
        await chat.delete_conversation(conversation_id, user_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
