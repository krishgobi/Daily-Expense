"""
Email Notification Service
Sends notifications via SMTP for all users except the WhatsApp-designated user.
Mirrors every notification type in whatsapp_service.py.
"""

import logging
import smtplib
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _is_email_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD and settings.SMTP_FROM_EMAIL)


def send_email(to: str, subject: str, html_body: str, text_body: str) -> bool:
    """Send an email. Returns True on success."""
    if not _is_email_configured():
        logger.warning("SMTP not configured — skipping email notification")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"]      = to

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body,  "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _wrap_html(content: str) -> str:
    """Wrap content in a simple branded HTML shell."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:20px; }}
    .card {{ background:#fff; border-radius:12px; max-width:520px; margin:0 auto; padding:32px; box-shadow:0 2px 8px rgba(0,0,0,.08); }}
    .header {{ color:#2563eb; font-size:20px; font-weight:700; margin-bottom:4px; }}
    .sub {{ color:#6b7280; font-size:13px; margin-bottom:24px; }}
    .body {{ color:#111827; font-size:15px; line-height:1.6; }}
    .cta {{ display:inline-block; margin-top:24px; background:#2563eb; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; font-size:14px; }}
    .footer {{ color:#9ca3af; font-size:12px; margin-top:28px; text-align:center; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">Tracksy.AI</div>
    <div class="sub">Your personal finance tracker</div>
    <div class="body">{content}</div>
    <div class="footer">You're receiving this because you use Tracksy.AI.</div>
  </div>
</body>
</html>"""


# ─── Notification builders ────────────────────────────────────────────────────

def notify_you_must_return(
    to_email: str,
    person_name: str,
    amount: float,
    due_date: Optional[date],
    transaction_id: str,
    overdue_days: int = 0,
) -> bool:
    url = f"{settings.APP_URL}/transactions"

    if overdue_days > 0:
        subject = f"⚠️ Overdue: Return ₹{amount:,.0f} to {person_name}"
        content = (
            f"<b>Overdue Payment Reminder</b><br><br>"
            f"You borrowed <b>₹{amount:,.2f}</b> from <b>{person_name}</b>.<br>"
            f"This was due <b>{overdue_days} day{'s' if overdue_days > 1 else ''} ago</b>!<br><br>"
            f"Please return it as soon as possible."
        )
        text = f"Overdue: You borrowed ₹{amount:,.2f} from {person_name}. Due {overdue_days} day(s) ago. Visit: {url}"
    else:
        due_str = due_date.strftime("%d %b %Y") if due_date else "today"
        subject = f"🔔 Payment Due: ₹{amount:,.0f} to {person_name} on {due_str}"
        content = (
            f"<b>Payment Reminder</b><br><br>"
            f"You borrowed <b>₹{amount:,.2f}</b> from <b>{person_name}</b>.<br>"
            f"Due date: <b>{due_str}</b><br><br>"
            f"Don't forget to return it!"
        )
        text = f"Payment due: ₹{amount:,.2f} to {person_name} by {due_str}. Visit: {url}"

    content += f'<br><br><a class="cta" href="{url}">View Transaction</a>'
    return send_email(to_email, subject, _wrap_html(content), text)


def notify_they_must_return(
    to_email: str,
    person_name: str,
    amount: float,
    due_date: Optional[date],
    transaction_id: str,
    overdue_days: int = 0,
) -> bool:
    url = f"{settings.APP_URL}/transactions"

    if overdue_days > 0:
        subject = f"⚠️ Overdue: Collect ₹{amount:,.0f} from {person_name}"
        content = (
            f"<b>Collection Reminder</b><br><br>"
            f"<b>{person_name}</b> owes you <b>₹{amount:,.2f}</b>.<br>"
            f"This was due <b>{overdue_days} day{'s' if overdue_days > 1 else ''} ago</b>!<br><br>"
            f"Time to follow up and collect your money."
        )
        text = f"Overdue: {person_name} owes you ₹{amount:,.2f}. {overdue_days} day(s) overdue. Visit: {url}"
    else:
        due_str = due_date.strftime("%d %b %Y") if due_date else "today"
        subject = f"🔔 Collection Due: ₹{amount:,.0f} from {person_name} on {due_str}"
        content = (
            f"<b>Collection Reminder</b><br><br>"
            f"<b>{person_name}</b> owes you <b>₹{amount:,.2f}</b>.<br>"
            f"Expected return: <b>{due_str}</b><br><br>"
            f"Ask them to return it today!"
        )
        text = f"Collection due: {person_name} owes ₹{amount:,.2f} by {due_str}. Visit: {url}"

    content += f'<br><br><a class="cta" href="{url}">View Transaction</a>'
    return send_email(to_email, subject, _wrap_html(content), text)


def notify_daily_summary(
    to_email: str,
    due_today_count: int,
    overdue_count: int,
    total_pending: float,
) -> bool:
    if due_today_count == 0 and overdue_count == 0:
        return False

    url = f"{settings.APP_URL}/transactions"
    today_str = date.today().strftime("%d %b %Y")
    subject = f"📊 Daily Summary — {today_str}"

    rows = ""
    if due_today_count > 0:
        rows += f"<tr><td>📅 Due today</td><td><b>{due_today_count}</b> transaction(s)</td></tr>"
    if overdue_count > 0:
        rows += f"<tr><td>⚠️ Overdue</td><td><b>{overdue_count}</b> transaction(s)</td></tr>"
    rows += f"<tr><td>💰 Total pending</td><td><b>₹{total_pending:,.2f}</b></td></tr>"

    content = (
        f"<b>Daily Summary — {today_str}</b><br><br>"
        f"<table style='border-collapse:collapse;width:100%'>{rows}</table>"
        f'<br><a class="cta" href="{url}">Review Now</a>'
    )
    text = (
        f"Daily Summary {today_str}: "
        f"{due_today_count} due today, {overdue_count} overdue, "
        f"₹{total_pending:,.2f} total pending. Visit: {url}"
    )
    return send_email(to_email, subject, _wrap_html(content), text)


def notify_salary_day(to_email: str) -> bool:
    url = f"{settings.APP_URL}/dashboard"
    subject = "💰 Salary Day — Log Your Income on Tracksy.AI"
    content = (
        f"<b>Salary Reminder</b><br><br>"
        f"Hope you've received your monthly salary today! 🎉<br><br>"
        f"Don't forget to log your income so your savings calculation stays accurate."
        f'<br><br><a class="cta" href="{url}">Log Income Now</a>'
    )
    text = f"Salary reminder: Log your monthly income on Tracksy.AI. Visit: {url}"
    return send_email(to_email, subject, _wrap_html(content), text)
