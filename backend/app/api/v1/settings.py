"""
User Settings API
Salary date, WhatsApp number, monthly income/savings
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy import text

from app.dependencies import get_current_user_id
from app.database.connection import SessionLocal

router = APIRouter()


def _db():
    return SessionLocal()


class UserSettingsBody(BaseModel):
    salary_day: Optional[int] = None       # 1–31, day of month salary arrives
    whatsapp_number: Optional[str] = None  # e.g. "+919876543210"


class MonthlyIncomeBody(BaseModel):
    income: float
    savings: Optional[float] = None  # None = auto-calculate (income - expenses)


# ── User settings (salary day + phone) ───────────────────────────────────────

@router.get("/", tags=["settings"])
async def get_settings(user_id: str = Depends(get_current_user_id)):
    db = _db()
    try:
        row = db.execute(
            text("SELECT salary_day, whatsapp_number FROM user_settings WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        return {
            "salary_day":      row.salary_day if row else None,
            "whatsapp_number": row.whatsapp_number if row else None,
        }
    finally:
        db.close()


@router.put("/", tags=["settings"])
async def update_settings(
    body: UserSettingsBody,
    user_id: str = Depends(get_current_user_id),
):
    if body.salary_day is not None and not (1 <= body.salary_day <= 31):
        raise HTTPException(status_code=400, detail="salary_day must be 1–31")

    db = _db()
    try:
        db.execute(
            text("""
                INSERT INTO user_settings (user_id, salary_day, whatsapp_number, updated_at)
                VALUES (:uid, :day, :num, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    salary_day       = EXCLUDED.salary_day,
                    whatsapp_number  = EXCLUDED.whatsapp_number,
                    updated_at       = NOW()
            """),
            {"uid": user_id, "day": body.salary_day, "num": body.whatsapp_number},
        )
        db.commit()
        return {"status": "updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ── Monthly income / savings ──────────────────────────────────────────────────

@router.get("/income", tags=["settings"])
async def get_monthly_income(user_id: str = Depends(get_current_user_id)):
    now = datetime.now()
    year, month = now.year, now.month
    db = _db()
    try:
        row = db.execute(
            text(
                "SELECT income, savings FROM monthly_income "
                "WHERE user_id = :uid AND year = :y AND month = :m"
            ),
            {"uid": user_id, "y": year, "m": month},
        ).fetchone()

        # Current month expenses from DB
        from_date = f"{year}-{month:02d}-01"
        import calendar
        last_day = calendar.monthrange(year, month)[1]
        to_date = f"{year}-{month:02d}-{last_day:02d}"
        exp = db.execute(
            text(
                "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses "
                "WHERE user_id = :uid AND date >= :f AND date <= :t"
            ),
            {"uid": user_id, "f": from_date, "t": to_date},
        ).fetchone()

        income   = float(row.income)  if row else 0.0
        expenses = float(exp.total)   if exp  else 0.0
        savings  = (
            float(row.savings)
            if row and row.savings is not None
            else max(0.0, income - expenses)
        )

        return {
            "year": year, "month": month,
            "income":   income,
            "expenses": expenses,
            "savings":  savings,
        }
    finally:
        db.close()


@router.put("/income", tags=["settings"])
async def update_monthly_income(
    body: MonthlyIncomeBody,
    user_id: str = Depends(get_current_user_id),
):
    now = datetime.now()
    year, month = now.year, now.month
    db = _db()
    try:
        db.execute(
            text("""
                INSERT INTO monthly_income (user_id, year, month, income, savings, updated_at)
                VALUES (:uid, :y, :m, :income, :savings, NOW())
                ON CONFLICT (user_id, year, month) DO UPDATE SET
                    income     = EXCLUDED.income,
                    savings    = EXCLUDED.savings,
                    updated_at = NOW()
            """),
            {"uid": user_id, "y": year, "m": month,
             "income": body.income, "savings": body.savings},
        )
        db.commit()
        return {"status": "updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
