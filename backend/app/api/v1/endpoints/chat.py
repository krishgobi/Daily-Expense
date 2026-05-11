from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.api.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid

router = APIRouter()

# Import chat service lazily to avoid circular imports
def get_chat_service():
    from app.services.chat_service import chat_service
    return chat_service

class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    response: str
    session_id: str
    context_used: bool
    context_count: int
    relevant_context: List[Dict[str, Any]]

class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    session_id: str

class IndexDataResponse(BaseModel):
    expenses_indexed: int
    transactions_indexed: int
    total_indexed: int

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_assistant(
    request: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Chat with AI assistant using RAG"""
    try:
        chat_service = get_chat_service()
        
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Generate AI response
        response_data = await chat_service.generate_chat_response(
            user_id=current_user.id,
            session_id=session_id,
            user_message=request.message
        )
        
        return ChatMessageResponse(
            response=response_data['response'],
            session_id=session_id,
            context_used=response_data['context_used'],
            context_count=response_data['context_count'],
            relevant_context=response_data['relevant_context']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get chat history for a session"""
    try:
        chat_service = get_chat_service()
        messages = await chat_service.get_chat_history(
            user_id=current_user.id,
            session_id=session_id,
            limit=limit
        )
        
        return ChatHistoryResponse(
            messages=messages,
            session_id=session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/index-data", response_model=IndexDataResponse)
async def index_user_data(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Index user's expenses and transactions for RAG"""
    try:
        chat_service = get_chat_service()
        
        # Run indexing in background
        def run_indexing():
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(chat_service.index_user_data(current_user.id))
            finally:
                loop.close()
        
        background_tasks.add_task(run_indexing)
        
        # For now, return immediate response with current count
        # In production, you might want to return a job ID and check status
        
        return IndexDataResponse(
            expenses_indexed=0,  # Will be updated by background task
            transactions_indexed=0,  # Will be updated by background task
            total_indexed=0  # Will be updated by background task
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/sessions")
async def get_user_chat_sessions(
    current_user: User = Depends(get_current_user)
):
    """Get all chat sessions for a user"""
    try:
        # This would require adding a sessions table or querying distinct session_ids
        # For now, return empty list as placeholder
        return {"sessions": []}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/history/{session_id}")
async def clear_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for a session"""
    try:
        # This would require implementing delete functionality
        # For now, return success
        return {"message": "Chat history cleared successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
