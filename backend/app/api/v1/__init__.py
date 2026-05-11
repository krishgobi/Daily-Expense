"""
API v1 Router
Main entry point for all API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models import User
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid

# Import route modules
from . import auth, categories, expenses, transactions, analytics, reports, search, calendar

router = APIRouter()

# Include route modules
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(categories.router, prefix="/categories", tags=["categories"])
router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(reports.router, prefix="/reports", tags=["reports"])
router.include_router(search.router, prefix="/search", tags=["search"])
router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])

# Chat endpoints (simple version to avoid circular imports)
class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    response: str
    session_id: str
    context_used: bool = False
    context_count: int = 0
    relevant_context: List[Dict[str, Any]] = []

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_assistant(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Simple chat assistant without RAG"""
    try:
        session_id = request.session_id or str(uuid.uuid4())
        message = request.message.lower()
        
        if "hello" in message or "hi" in message:
            response = "Hello! I'm your expense assistant. I can help you with basic questions about your expenses and transactions."
        elif "expense" in message:
            response = "I can help you with expense-related questions! You can ask about your spending patterns, categories, or recent expenses."
        elif "transaction" in message:
            response = "I can help you with transaction questions! You can ask about borrowed/lent money, pending transactions, or transaction history."
        elif "help" in message:
            response = """I'm your expense assistant! Here's what I can help with:
• Basic expense and transaction questions
• General guidance on using the app
• Status of your financial tracking"""
        else:
            response = f"I received your message: '{request.message}'. I'm here to help with your expense tracking needs!"
        
        return ChatMessageResponse(
            response=response,
            session_id=session_id,
            context_used=False,
            context_count=0,
            relevant_context=[]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history/{session_id}")
async def get_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get chat history (placeholder)"""
    try:
        return {"messages": [], "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/index-data")
async def index_user_data(
    current_user: User = Depends(get_current_user)
):
    """Index user data (placeholder)"""
    try:
        return {"expenses_indexed": 0, "transactions_indexed": 0, "total_indexed": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/history/{session_id}")
async def clear_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Clear chat history (placeholder)"""
    try:
        return {"message": "Chat history cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", tags=["health"])
async def api_root():
    """API v1 root endpoint."""
    return {"message": "API v1 is running", "version": "1.0.0"}
