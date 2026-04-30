"""
Transaction Routes (Borrowed/Lent Money)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date

from app.database.connection import get_db
from app.dependencies import get_current_user
from app.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionCompleteRequest,
)
from app.services.transaction_service import TransactionService
from app.exceptions import AppException
from app.models import User

router = APIRouter()


@router.post("", response_model=dict, tags=["transactions"])
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new transaction (borrowed or lent)."""
    try:
        transaction = TransactionService.create_transaction(db, current_user.id, transaction_data)
        return {
            "status": "success",
            "data": TransactionResponse.from_orm(transaction),
            "message": "Transaction created successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict, tags=["transactions"])
async def list_transactions(
    transaction_type: str = Query(None),
    status: str = Query(None),
    person_name: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List transactions with filters."""
    try:
        transactions, total = TransactionService.list_transactions(
            db,
            current_user.id,
            transaction_type,
            status,
            person_name,
            limit,
            offset,
        )
        return {
            "status": "success",
            "data": [TransactionResponse.from_orm(t) for t in transactions],
            "meta": {
                "total": total,
                "limit": limit,
                "offset": offset,
            },
            "message": "Transactions retrieved successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{transaction_id}", response_model=dict, tags=["transactions"])
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific transaction."""
    try:
        transaction = TransactionService.get_transaction(db, current_user.id, UUID(transaction_id))
        return {
            "status": "success",
            "data": TransactionResponse.from_orm(transaction),
            "message": "Transaction retrieved successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{transaction_id}", response_model=dict, tags=["transactions"])
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a transaction."""
    try:
        transaction = TransactionService.update_transaction(
            db, current_user.id, UUID(transaction_id), transaction_data
        )
        return {
            "status": "success",
            "data": TransactionResponse.from_orm(transaction),
            "message": "Transaction updated successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{transaction_id}/complete", response_model=dict, tags=["transactions"])
async def complete_transaction(
    transaction_id: str,
    request_data: TransactionCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a transaction as completed."""
    try:
        transaction = TransactionService.complete_transaction(
            db,
            current_user.id,
            UUID(transaction_id),
            request_data.actual_return_date,
        )
        return {
            "status": "success",
            "data": TransactionResponse.from_orm(transaction),
            "message": "Transaction completed successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{transaction_id}", response_model=dict, tags=["transactions"])
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a transaction."""
    try:
        result = TransactionService.delete_transaction(db, current_user.id, UUID(transaction_id))
        return {
            "status": "success",
            "data": result,
            "message": "Transaction deleted successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/pending-repayments", response_model=dict, tags=["transactions"])
async def get_pending_repayments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all pending money I need to pay (BORROWED)."""
    try:
        transactions = TransactionService.get_pending_repayments(db, current_user.id)
        return {
            "status": "success",
            "data": [TransactionResponse.from_orm(t) for t in transactions],
            "message": "Pending repayments retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/pending-collections", response_model=dict, tags=["transactions"])
async def get_pending_collections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all pending money I need to receive (LENT)."""
    try:
        transactions = TransactionService.get_pending_collections(db, current_user.id)
        return {
            "status": "success",
            "data": [TransactionResponse.from_orm(t) for t in transactions],
            "message": "Pending collections retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/overdue", response_model=dict, tags=["transactions"])
async def get_overdue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all overdue transactions."""
    try:
        overdue_borrowed, overdue_lent = TransactionService.get_overdue_transactions(
            db, current_user.id
        )
        return {
            "status": "success",
            "data": {
                "overdue_borrowed": [TransactionResponse.from_orm(t) for t in overdue_borrowed],
                "overdue_lent": [TransactionResponse.from_orm(t) for t in overdue_lent],
            },
            "message": "Overdue transactions retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/overview", response_model=dict, tags=["transactions"])
async def get_transactions_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get summary of all transactions."""
    try:
        summary = TransactionService.get_transactions_summary(db, current_user.id)
        return {
            "status": "success",
            "data": summary,
            "message": "Transaction summary retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
