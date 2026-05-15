"""
WhatsApp Notification Service
Sends reminders via Twilio WhatsApp for:
  - Transactions where YOU need to return money (BORROWED, due today/overdue)
  - Transactions where THEY need to return money to you (LENT, due today/overdue)
"""

import logging
from datetime import date, timedelta
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Twilio is optional — if not installed the app still starts but WhatsApp is disabled
try:
    from twilio.rest import Client as TwilioClient
    from twilio.base.exceptions import TwilioRestException
    _TWILIO_AVAILABLE = True
except ImportError:
    TwilioClient = None  # type: ignore[assignment,misc]
    TwilioRestException = Exception  # type: ignore[assignment,misc]
    _TWILIO_AVAILABLE = False
    logger.warning("twilio package not installed — WhatsApp notifications disabled")


def _get_client():
    """Return a Twilio client, or None if unavailable."""
    if not _TWILIO_AVAILABLE:
        return None
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured — skipping WhatsApp notification")
        return None
    return TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def send_whatsapp(body: str, to: Optional[str] = None) -> bool:
    """Send a plain-text WhatsApp message. Returns True on success.

    `to` overrides the default TWILIO_WHATSAPP_TO env var — used for per-user numbers.
    """
    client = _get_client()
    if not client:
        return False
    recipient = to or settings.TWILIO_WHATSAPP_TO
    if not recipient:
        logger.warning("No WhatsApp recipient configured — skipping notification")
        return False
    # Twilio WhatsApp numbers must be prefixed with whatsapp:
    if not recipient.startswith("whatsapp:"):
        recipient = f"whatsapp:{recipient}"
    try:
        msg = client.messages.create(
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=recipient,
            body=body,
        )
        logger.info(f"WhatsApp sent: {msg.sid}")
        return True
    except TwilioRestException as e:
        logger.error(f"Twilio error: {e}")
        return False


# ─── Notification builders ────────────────────────────────────────────────────

def notify_you_must_return(
    person_name: str,
    amount: float,
    due_date: Optional[date],
    transaction_id: str,
    overdue_days: int = 0,
    to: Optional[str] = None,
) -> bool:
    """
    Remind the user that THEY need to return money to someone.
    Triggered for BORROWED transactions.
    """
    url = f"{settings.APP_URL}/transactions"

    if overdue_days > 0:
        body = (
            f"⚠️ *Overdue Reminder — Tracksy.AI*\n\n"
            f"You borrowed *₹{amount:,.2f}* from *{person_name}*.\n"
            f"This was due {overdue_days} day{'s' if overdue_days > 1 else ''} ago!\n\n"
            f"Please return it as soon as possible.\n\n"
            f"📲 View transaction: {url}"
        )
    else:
        due_str = due_date.strftime("%d %b %Y") if due_date else "today"
        body = (
            f"🔔 *Payment Reminder — Tracksy.AI*\n\n"
            f"You borrowed *₹{amount:,.2f}* from *{person_name}*.\n"
            f"Due date: *{due_str}*\n\n"
            f"Don't forget to return it!\n\n"
            f"📲 View transaction: {url}"
        )
    return send_whatsapp(body, to=to)


def notify_they_must_return(
    person_name: str,
    amount: float,
    due_date: Optional[date],
    transaction_id: str,
    overdue_days: int = 0,
    to: Optional[str] = None,
) -> bool:
    """
    Remind the user to collect money from someone.
    Triggered for LENT transactions.
    """
    url = f"{settings.APP_URL}/transactions"

    if overdue_days > 0:
        body = (
            f"⚠️ *Collection Reminder — Tracksy.AI*\n\n"
            f"*{person_name}* owes you *₹{amount:,.2f}*.\n"
            f"This was due {overdue_days} day{'s' if overdue_days > 1 else ''} ago!\n\n"
            f"Time to follow up and collect your money.\n\n"
            f"📲 View transaction: {url}"
        )
    else:
        due_str = due_date.strftime("%d %b %Y") if due_date else "today"
        body = (
            f"🔔 *Collection Reminder — Tracksy.AI*\n\n"
            f"*{person_name}* owes you *₹{amount:,.2f}*.\n"
            f"Expected return: *{due_str}*\n\n"
            f"Ask them to return it today!\n\n"
            f"📲 View transaction: {url}"
        )
    return send_whatsapp(body, to=to)


def notify_daily_summary(
    due_today_count: int,
    overdue_count: int,
    total_pending: float,
    to: Optional[str] = None,
) -> bool:
    """Send a daily morning summary of pending transactions."""
    if due_today_count == 0 and overdue_count == 0:
        return False  # Nothing to report

    url = f"{settings.APP_URL}/transactions"
    today_str = date.today().strftime("%d %b %Y")

    body = (
        f"📊 *Daily Summary — Tracksy.AI*\n"
        f"_{today_str}_\n\n"
    )
    if due_today_count > 0:
        body += f"📅 *{due_today_count}* transaction(s) due today\n"
    if overdue_count > 0:
        body += f"⚠️ *{overdue_count}* overdue transaction(s)\n"

    body += f"\n💰 Total pending: *₹{total_pending:,.2f}*\n\n"
    body += f"📲 Review now: {url}"

    return send_whatsapp(body, to=to)


def notify_salary_day(to: Optional[str] = None) -> bool:
    """Salary day reminder — sent to the WhatsApp user."""
    url = f"{settings.APP_URL}/dashboard"
    body = (
        f"💰 *Salary Reminder — Tracksy.AI*\n\n"
        f"Hope you've received your monthly salary today! 🎉\n\n"
        f"Don't forget to log your income so your savings calculation stays accurate.\n\n"
        f"📲 Log your income now: {url}"
    )
    return send_whatsapp(body, to=to)
