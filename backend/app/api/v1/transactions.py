"""
Transaction Routes (Borrowed/Lent Money)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from app.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionCompleteRequest,
)
from app.services.transaction_service import TransactionService
from app.exceptions import AppException
from app.utils.file_upload import save_upload_file, delete_file
from app.models import TransactionMedia

router = APIRouter()


@router.post("", response_model=dict, tags=["transactions"])
async def create_transaction(
    transaction_data: TransactionCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new transaction (borrowed or lent)."""
    try:
        user_uuid = UUID(user_id)
        transaction = TransactionService.create_transaction(db, user_uuid, transaction_data)
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List transactions with filters."""
    try:
        user_uuid = UUID(user_id)
        transactions, total = TransactionService.list_transactions(
            db,
            user_uuid,
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


@router.get("/summary/pending-repayments", response_model=dict, tags=["transactions"])
async def get_pending_repayments_route(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all pending money I need to pay (BORROWED)."""
    try:
        user_uuid = UUID(user_id)
        transactions = TransactionService.get_pending_repayments(db, user_uuid)
        return {
            "status": "success",
            "data": [TransactionResponse.from_orm(t) for t in transactions],
            "message": "Pending repayments retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/pending-collections", response_model=dict, tags=["transactions"])
async def get_pending_collections_route(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all pending money I need to receive (LENT)."""
    try:
        user_uuid = UUID(user_id)
        transactions = TransactionService.get_pending_collections(db, user_uuid)
        return {
            "status": "success",
            "data": [TransactionResponse.from_orm(t) for t in transactions],
            "message": "Pending collections retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/overdue", response_model=dict, tags=["transactions"])
async def get_overdue_route(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all overdue transactions."""
    try:
        user_uuid = UUID(user_id)
        overdue_borrowed, overdue_lent = TransactionService.get_overdue_transactions(
            db, user_uuid
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
async def get_transactions_summary_route(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get summary of all transactions."""
    try:
        user_uuid = UUID(user_id)
        summary = TransactionService.get_transactions_summary(db, user_uuid)
        return {
            "status": "success",
            "data": summary,
            "message": "Transaction summary retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{transaction_id}", response_model=dict, tags=["transactions"])
async def get_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific transaction."""
    try:
        user_uuid = UUID(user_id)
        transaction = TransactionService.get_transaction(db, user_uuid, UUID(transaction_id))
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a transaction."""
    try:
        user_uuid = UUID(user_id)
        transaction = TransactionService.update_transaction(
            db, user_uuid, UUID(transaction_id), transaction_data
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Mark a transaction as completed."""
    try:
        user_uuid = UUID(user_id)
        transaction = TransactionService.complete_transaction(
            db,
            user_uuid,
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a transaction."""
    try:
        user_uuid = UUID(user_id)
        result = TransactionService.delete_transaction(db, user_uuid, UUID(transaction_id))
        return {
            "status": "success",
            "data": result,
            "message": "Transaction deleted successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{transaction_id}/upload-media", response_model=dict, tags=["transactions"])
async def upload_transaction_media(
    transaction_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Upload media file (image/PDF/document) for a transaction (borrowed/lent)."""
    try:
        user_uuid = UUID(user_id)
        transaction_uuid = UUID(transaction_id)
        
        # Verify transaction belongs to user
        transaction = TransactionService.get_transaction(db, user_uuid, transaction_uuid)
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Save file to Supabase Storage
        file_data = await save_upload_file(file, str(user_uuid), "transaction")
        
        # Create media record in database
        media = TransactionMedia(
            transaction_id=transaction_uuid,
            file_name=file_data["file_name"],
            file_path=file_data["file_path"],
            file_url=file_data.get("file_url"),  # Store Supabase public URL
            file_type=file_data["file_type"],
            file_size=file_data["file_size"],
        )
        db.add(media)
        db.commit()
        db.refresh(media)
        
        return {
            "status": "success",
            "data": {
                "id": str(media.id),
                "file_name": media.file_name,
                "file_type": media.file_type,
                "file_size": media.file_size,
                "file_url": media.file_url,
                "uploaded_at": media.uploaded_at.isoformat(),
            },
            "message": "Media uploaded successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.delete("/{transaction_id}/media/{media_id}", response_model=dict, tags=["transactions"])
async def delete_transaction_media(
    transaction_id: str,
    media_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete media file from a transaction."""
    try:
        user_uuid = UUID(user_id)
        transaction_uuid = UUID(transaction_id)
        media_uuid = UUID(media_id)
        
        # Verify transaction belongs to user
        transaction = TransactionService.get_transaction(db, user_uuid, transaction_uuid)
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Get media record
        media = db.query(TransactionMedia).filter(
            TransactionMedia.id == media_uuid,
            TransactionMedia.transaction_id == transaction_uuid
        ).first()
        
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        # Delete file from storage
        delete_file(media.file_path, "transaction-media")
        
        # Delete record from database
        db.delete(media)
        db.commit()
        
        return {
            "status": "success",
            "data": None,
            "message": "Media deleted successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
