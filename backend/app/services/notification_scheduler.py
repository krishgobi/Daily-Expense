"""
Notification Scheduler
Uses APScheduler to run WhatsApp reminders automatically:
  - Every morning at 9 AM: daily summary
  - Every morning at 9 AM: individual reminders for due/overdue transactions
"""

import logging
from datetime import date, timedelta
from typing import Optional

from app.config import settings
from app.database.connection import SessionLocal
from app.models import Transaction
from app.services.whatsapp_service import (
    notify_you_must_return,
    notify_they_must_return,
    notify_daily_summary,
    send_whatsapp,
)

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


# ─── Job functions ────────────────────────────────────────────────────────────

def run_daily_reminders():
    """
    Runs every morning. Checks all PENDING transactions and sends:
    1. A daily summary (due today + overdue count)
    2. Individual reminders for each due/overdue transaction
    """
    logger.info("Running daily WhatsApp reminders…")
    db = SessionLocal()
    try:
        today = date.today()
        tomorrow = today + timedelta(days=1)

        # Fetch all pending transactions with a due date
        pending = (
            db.query(Transaction)
            .filter(
                Transaction.status == "PENDING",
                Transaction.expected_return_date.isnot(None),
            )
            .all()
        )

        due_today   = [t for t in pending if t.expected_return_date == today]
        due_tomorrow = [t for t in pending if t.expected_return_date == tomorrow]
        overdue     = [t for t in pending if t.expected_return_date < today]

        # ── Daily summary ──────────────────────────────────────────────────
        total_pending = sum(t.amount for t in pending)
        notify_daily_summary(
            due_today_count=len(due_today) + len(due_tomorrow),
            overdue_count=len(overdue),
            total_pending=float(total_pending),
        )

        # ── Individual reminders for overdue ──────────────────────────────
        for t in overdue:
            overdue_days = (today - t.expected_return_date).days
            if t.transaction_type == "BORROWED":
                notify_you_must_return(
                    person_name=t.person_name,
                    amount=float(t.amount),
                    due_date=t.expected_return_date,
                    transaction_id=str(t.id),
                    overdue_days=overdue_days,
                )
            else:  # LENT
                notify_they_must_return(
                    person_name=t.person_name,
                    amount=float(t.amount),
                    due_date=t.expected_return_date,
                    transaction_id=str(t.id),
                    overdue_days=overdue_days,
                )

        # ── Individual reminders for due today ────────────────────────────
        for t in due_today:
            if t.transaction_type == "BORROWED":
                notify_you_must_return(
                    person_name=t.person_name,
                    amount=float(t.amount),
                    due_date=t.expected_return_date,
                    transaction_id=str(t.id),
                )
            else:
                notify_they_must_return(
                    person_name=t.person_name,
                    amount=float(t.amount),
                    due_date=t.expected_return_date,
                    transaction_id=str(t.id),
                )

        # ── Reminders for due tomorrow (heads-up) ─────────────────────────
        for t in due_tomorrow:
            if t.transaction_type == "BORROWED":
                notify_you_must_return(
                    person_name=t.person_name,
                    amount=float(t.amount),
                    due_date=t.expected_return_date,
                    transaction_id=str(t.id),
                )
            else:
                notify_they_must_return(
                    person_name=t.person_name,
                    amount=float(t.amount),
                    due_date=t.expected_return_date,
                    transaction_id=str(t.id),
                )

        logger.info(
            f"Reminders sent — overdue: {len(overdue)}, "
            f"due today: {len(due_today)}, due tomorrow: {len(due_tomorrow)}"
        )

    except Exception as e:
        logger.error(f"Error in daily reminders job: {e}")
    finally:
        db.close()


def run_salary_reminders():
    """
    Runs every morning. Finds users whose salary_day matches today's date
    and sends them a WhatsApp reminder to log their income.
    """
    logger.info("Checking salary day reminders…")
    db = SessionLocal()
    try:
        today = date.today()
        from sqlalchemy import text
        rows = db.execute(
            text(
                "SELECT user_id, whatsapp_number, salary_day "
                "FROM user_settings "
                "WHERE salary_day = :day AND whatsapp_number IS NOT NULL"
            ),
            {"day": today.day},
        ).fetchall()

        for row in rows:
            url = f"{settings.APP_URL}/dashboard"
            body = (
                f"💰 *Salary Reminder — Tracksy.AI*\n\n"
                f"Hope you've received your monthly salary today! 🎉\n\n"
                f"Don't forget to log your income so your savings calculation stays accurate.\n\n"
                f"📲 Log your income now: {url}"
            )
            send_whatsapp(body, to=row.whatsapp_number)
            logger.info(f"Salary reminder sent to user {row.user_id}")

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
        name="Daily WhatsApp Reminders",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    _scheduler.add_job(
        run_salary_reminders,
        trigger=CronTrigger(hour=9, minute=0),
        id="salary_reminders",
        name="Salary Day WhatsApp Reminders",
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
