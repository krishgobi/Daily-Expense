"""
API v1 Router
Main entry point for all API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models import User
from app.config import settings
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import httpx

# Import route modules
from . import auth, categories, expenses, transactions, analytics, reports, search, calendar, notifications

router = APIRouter()

# Include route modules
router.include_router(auth.router,          prefix="/auth",          tags=["auth"])
router.include_router(categories.router,    prefix="/categories",    tags=["categories"])
router.include_router(expenses.router,      prefix="/expenses",      tags=["expenses"])
router.include_router(transactions.router,  prefix="/transactions",  tags=["transactions"])
router.include_router(analytics.router,     prefix="/analytics",     tags=["analytics"])
router.include_router(reports.router,       prefix="/reports",       tags=["reports"])
router.include_router(search.router,        prefix="/search",        tags=["search"])
router.include_router(calendar.router,      prefix="/calendar",      tags=["calendar"])
router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

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

async def get_gemini_response(message: str) -> str:
    """Get response from Gemini API"""
    try:
        # Check if Gemini API key is available
        gemini_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not gemini_key or gemini_key == "":
            return "Gemini API key not configured. Please add the API key to use enhanced AI features."
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={gemini_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"""You are an expense tracking assistant. Help users with questions about their expenses, transactions, and financial management. 
                    
                    User message: {message}
                    
                    Provide helpful, concise responses about expense tracking, budgeting, and financial management. If the question is about specific data they haven't provided, give general guidance."""
                }]
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                if data.get('candidates') and data['candidates'][0].get('content'):
                    return data['candidates'][0]['content']['parts'][0]['text']
                else:
                    return "I'm having trouble generating a response. Please try again."
            else:
                return "AI service temporarily unavailable. Using basic responses."
                
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "AI service temporarily unavailable. Using basic responses."

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_assistant(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Enhanced chat assistant with Gemini API"""
    try:
        session_id = request.session_id or str(uuid.uuid4())
        message = request.message
        
        # Try to get AI response from Gemini
        ai_response = await get_gemini_response(message)
        
        # Fallback to rule-based responses if AI fails
        if "API key not configured" in ai_response or "temporarily unavailable" in ai_response:
            message_lower = message.lower()
            if "hello" in message_lower or "hi" in message_lower:
                ai_response = "Hello! I'm your expense assistant. I can help you with basic questions about your expenses and transactions."
            elif "expense" in message_lower:
                ai_response = "I can help you with expense-related questions! You can ask about your spending patterns, categories, or recent expenses."
            elif "transaction" in message_lower:
                ai_response = "I can help you with transaction questions! You can ask about borrowed/lent money, pending transactions, or transaction history."
            elif "help" in message_lower:
                ai_response = """I'm your expense assistant! Here's what I can help with:
• Basic expense and transaction questions
• General guidance on using the app
• Status of your financial tracking"""
            else:
                ai_response = f"I received your message: '{message}'. I'm here to help with your expense tracking needs!"
        
        return ChatMessageResponse(
            response=ai_response,
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
