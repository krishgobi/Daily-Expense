"""
Notification Scheduler
Uses APScheduler to run reminders automatically at 9 AM IST:
  - Daily summary of due/overdue transactions
  - Individual reminders per transaction
  - Salary day income-logging reminder

Routing:
  gobibhuvi1415@gmail.com  → WhatsApp (Twilio)
  everyone else            → Email (SMTP)
"""

import logging
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import text

from app.config import settings
from app.database.connection import SessionLocal
from app.models import Transaction
import app.services.whatsapp_service as wa
import app.services.email_service as em

logger = logging.getLogger(__name__)

# APScheduler and pytz are optional — app starts fine without them
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    import pytz
    _APSCHEDULER_AVAILABLE = True
except ImportError:
    _APSCHEDULER_AVAILABLE = False
    logger.warning("apscheduler not installed — scheduled notifications disabled")

# ─── Scheduler instance (module-level singleton) ─────────────────────────────
_scheduler: Optional[object] = None


# ─── Routing helper ───────────────────────────────────────────────────────────

def _is_whatsapp_user(email: str) -> bool:
    return email.lower() == settings.WHATSAPP_USER_EMAIL.lower()


def _get_user_info(db, user_id: str):
    """Return (email, whatsapp_number) for a user_id."""
    row = db.execute(
        text(
            "SELECT u.email, us.whatsapp_number "
            "FROM users u "
            "LEFT JOIN user_settings us ON us.user_id = u.id "
            "WHERE u.id = :uid"
        ),
        {"uid": user_id},
    ).fetchone()
    if not row:
        return None, None
    return row.email, row.whatsapp_number


# ─── Job functions ────────────────────────────────────────────────────────────

def run_daily_reminders():
    """
    Runs every morning. Groups PENDING transactions by user, then:
    - WhatsApp user  → send via Twilio WhatsApp
    - Everyone else  → send via email
    """
    logger.info("Running daily reminders…")
    db = SessionLocal()
    try:
        today    = date.today()
        tomorrow = today + timedelta(days=1)

        pending = (
            db.query(Transaction)
            .filter(
                Transaction.status == "PENDING",
                Transaction.expected_return_date.isnot(None),
            )
            .all()
        )

        # Group by user_id so each user gets one summary + individual reminders
        from collections import defaultdict
        by_user: dict = defaultdict(list)
        for t in pending:
            by_user[str(t.user_id)].append(t)

        for user_id, txns in by_user.items():
            email, whatsapp_number = _get_user_info(db, user_id)
            if not email:
                continue

            use_wa = _is_whatsapp_user(email)

            due_today    = [t for t in txns if t.expected_return_date == today]
            due_tomorrow = [t for t in txns if t.expected_return_date == tomorrow]
            overdue      = [t for t in txns if t.expected_return_date < today]
            total_pend   = float(sum(t.amount for t in txns))

            # ── Daily summary ──────────────────────────────────────────────
            if use_wa:
                wa.notify_daily_summary(
                    due_today_count=len(due_today) + len(due_tomorrow),
                    overdue_count=len(overdue),
                    total_pending=total_pend,
                    to=whatsapp_number,
                )
            else:
                em.notify_daily_summary(
                    to_email=email,
                    due_today_count=len(due_today) + len(due_tomorrow),
                    overdue_count=len(overdue),
                    total_pending=total_pend,
                )

            # ── Individual reminders ───────────────────────────────────────
            for t in overdue:
                days = (today - t.expected_return_date).days
                if t.transaction_type == "BORROWED":
                    if use_wa:
                        wa.notify_you_must_return(t.person_name, float(t.amount), t.expected_return_date, str(t.id), overdue_days=days, to=whatsapp_number)
                    else:
                        em.notify_you_must_return(email, t.person_name, float(t.amount), t.expected_return_date, str(t.id), overdue_days=days)
                else:
                    if use_wa:
                        wa.notify_they_must_return(t.person_name, float(t.amount), t.expected_return_date, str(t.id), overdue_days=days, to=whatsapp_number)
                    else:
                        em.notify_they_must_return(email, t.person_name, float(t.amount), t.expected_return_date, str(t.id), overdue_days=days)

            for t in [*due_today, *due_tomorrow]:
                if t.transaction_type == "BORROWED":
                    if use_wa:
                        wa.notify_you_must_return(t.person_name, float(t.amount), t.expected_return_date, str(t.id), to=whatsapp_number)
                    else:
                        em.notify_you_must_return(email, t.person_name, float(t.amount), t.expected_return_date, str(t.id))
                else:
                    if use_wa:
                        wa.notify_they_must_return(t.person_name, float(t.amount), t.expected_return_date, str(t.id), to=whatsapp_number)
                    else:
                        em.notify_they_must_return(email, t.person_name, float(t.amount), t.expected_return_date, str(t.id))

        logger.info("Daily reminders dispatched")

    except Exception as e:
        logger.error(f"Error in daily reminders job: {e}")
    finally:
        db.close()


def run_salary_reminders():
    """
    Runs every morning. Finds users whose salary_day matches today
    and sends a reminder to log their income.
    """
    logger.info("Checking salary day reminders…")
    db = SessionLocal()
    try:
        today = date.today()
        rows = db.execute(
            text(
                "SELECT us.user_id, us.whatsapp_number, u.email "
                "FROM user_settings us "
                "JOIN users u ON u.id = us.user_id "
                "WHERE us.salary_day = :day"
            ),
            {"day": today.day},
        ).fetchall()

        for row in rows:
            if _is_whatsapp_user(row.email):
                wa.notify_salary_day(to=row.whatsapp_number)
            else:
                em.notify_salary_day(to_email=row.email)
            logger.info(f"Salary reminder sent to {row.email}")

    except Exception as e:
        logger.error(f"Error in salary reminders job: {e}")
    finally:
        db.close()


# ─── Scheduler lifecycle ──────────────────────────────────────────────────────

def start_scheduler():
    """Start the APScheduler background scheduler."""
    global _scheduler
    if not _APSCHEDULER_AVAILABLE:
        logger.warning("apscheduler not installed — scheduler not started")
        return

    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone=pytz.timezone("Asia/Kolkata"))
    _scheduler.add_job(
        run_daily_reminders,
        trigger=CronTrigger(hour=9, minute=0),
        id="daily_reminders",
        name="Daily Reminders",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    _scheduler.add_job(
        run_salary_reminders,
        trigger=CronTrigger(hour=9, minute=0),
        id="salary_reminders",
        name="Salary Day Reminders",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    _scheduler.start()
    logger.info("✅ Notification scheduler started (daily at 9:00 AM IST)")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    global _scheduler
    if _scheduler and _APSCHEDULER_AVAILABLE and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Notification scheduler stopped")
