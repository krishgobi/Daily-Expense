"""
Simple Chat Endpoints - No RAG to avoid circular imports
"""

from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import json

router = APIRouter()

class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    response: str
    session_id: str
    context_used: bool = False
    context_count: int = 0
    relevant_context: List[Dict[str, Any]] = []

class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    session_id: str

class IndexDataResponse(BaseModel):
    expenses_indexed: int = 0
    transactions_indexed: int = 0
    total_indexed: int = 0

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_assistant(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Simple chat assistant without RAG"""
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Simple rule-based responses
        message = request.message.lower()
        
        if "hello" in message or "hi" in message:
            response = "Hello! I'm your expense assistant. I can help you with basic questions about your expenses and transactions. For now, I'm running in simple mode without advanced AI features."
        elif "expense" in message:
            response = "I can help you with expense-related questions! You can ask about your spending patterns, categories, or recent expenses. Note: Advanced AI features are temporarily disabled."
        elif "transaction" in message:
            response = "I can help you with transaction questions! You can ask about borrowed/lent money, pending transactions, or transaction history. Note: Advanced AI features are temporarily disabled."
        elif "help" in message:
            response = """I'm your expense assistant! Here's what I can help with:
• Basic expense and transaction questions
• General guidance on using the app
• Status of your financial tracking

Note: Advanced AI features and RAG (Retrieval-Augmented Generation) are temporarily disabled for technical reasons. The basic chat functionality is still available."""
        else:
            response = f"I received your message: '{request.message}'. I'm currently running in simple mode with limited functionality. For full AI-powered responses, the advanced features need to be re-enabled by the developer."
        
        return ChatMessageResponse(
            response=response,
            session_id=session_id,
            context_used=False,
            context_count=0,
            relevant_context=[]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get chat history (placeholder - not storing history in simple mode)"""
    try:
        return ChatHistoryResponse(
            messages=[],
            session_id=session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/index-data", response_model=IndexDataResponse)
async def index_user_data(
    current_user: User = Depends(get_current_user)
):
    """Index user data (placeholder - disabled in simple mode)"""
    try:
        return IndexDataResponse(
            expenses_indexed=0,
            transactions_indexed=0,
            total_indexed=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/history/{session_id}")
async def clear_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Clear chat history (placeholder - no history to clear in simple mode)"""
    try:
        return {"message": "Chat history cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
