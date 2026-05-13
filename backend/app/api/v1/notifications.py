"""
Notifications API
Endpoints to manage and manually trigger WhatsApp reminders.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date

from app.dependencies import get_current_user_id
from app.services.whatsapp_service import (
    notify_you_must_return,
    notify_they_must_return,
    notify_daily_summary,
)
from app.services.notification_scheduler import run_daily_reminders

router = APIRouter()


class ManualReminderRequest(BaseModel):
    transaction_type: str          # "BORROWED" or "LENT"
    person_name: str
    amount: float
    due_date: Optional[str] = None  # "YYYY-MM-DD"
    transaction_id: str


@router.post("/send-reminder", tags=["notifications"])
async def send_manual_reminder(
    req: ManualReminderRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Manually send a WhatsApp reminder for a specific transaction."""
    due = date.fromisoformat(req.due_date) if req.due_date else None
    today = date.today()
    overdue_days = max(0, (today - due).days) if due and due < today else 0

    if req.transaction_type == "BORROWED":
        ok = notify_you_must_return(
            person_name=req.person_name,
            amount=req.amount,
            due_date=due,
            transaction_id=req.transaction_id,
            overdue_days=overdue_days,
        )
    else:
        ok = notify_they_must_return(
            person_name=req.person_name,
            amount=req.amount,
            due_date=due,
            transaction_id=req.transaction_id,
            overdue_days=overdue_days,
        )

    if not ok:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")

    return {"status": "sent", "to": req.person_name}


@router.post("/run-daily-check", tags=["notifications"])
async def trigger_daily_check(
    user_id: str = Depends(get_current_user_id),
):
    """Manually trigger the daily reminder check (useful for testing)."""
    try:
        run_daily_reminders()
        return {"status": "ok", "message": "Daily reminders triggered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
