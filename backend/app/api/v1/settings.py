"""
User Settings API
Salary date, WhatsApp number, initial balance, monthly income tracking
"""

import calendar
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.database.connection import SessionLocal
from app.dependencies import get_current_user_id

router = APIRouter()


def _db():
    return SessionLocal()


class UserSettingsBody(BaseModel):
    salary_day:      Optional[int]   = None
    whatsapp_number: Optional[str]   = None
    initial_balance: Optional[float] = None


class MonthlyIncomeBody(BaseModel):
    income: Optional[float] = None   # this month's salary


# ── User settings ─────────────────────────────────────────────────────────────

@router.get("/", tags=["settings"])
async def get_settings(user_id: str = Depends(get_current_user_id)):
    db = _db()
    try:
        row = db.execute(
            text("SELECT salary_day, whatsapp_number, initial_balance FROM user_settings WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        return {
            "salary_day":      row.salary_day      if row else None,
            "whatsapp_number": row.whatsapp_number if row else None,
            "initial_balance": float(row.initial_balance) if row and row.initial_balance is not None else 0.0,
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
                INSERT INTO user_settings (user_id, salary_day, whatsapp_number, initial_balance, updated_at)
                VALUES (:uid, :day, :num, :bal, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    salary_day       = EXCLUDED.salary_day,
                    whatsapp_number  = EXCLUDED.whatsapp_number,
                    initial_balance  = EXCLUDED.initial_balance,
                    updated_at       = NOW()
            """),
            {"uid": user_id, "day": body.salary_day, "num": body.whatsapp_number,
             "bal": body.initial_balance or 0.0},
        )
        db.commit()
        return {"status": "updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ── Income & balance ──────────────────────────────────────────────────────────

@router.get("/income", tags=["settings"])
async def get_income(user_id: str = Depends(get_current_user_id)):
    now   = datetime.now()
    year, month = now.year, now.month
    db = _db()
    try:
        # This month's logged income
        mi = db.execute(
            text("SELECT income FROM monthly_income WHERE user_id = :uid AND year = :y AND month = :m"),
            {"uid": user_id, "y": year, "m": month},
        ).fetchone()

        # This month's expenses
        from_date = f"{year}-{month:02d}-01"
        last_day  = calendar.monthrange(year, month)[1]
        to_date   = f"{year}-{month:02d}-{last_day:02d}"
        me = db.execute(
            text("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses "
                 "WHERE user_id = :uid AND date >= :f AND date <= :t"),
            {"uid": user_id, "f": from_date, "t": to_date},
        ).fetchone()

        # All-time income total
        all_income = db.execute(
            text("SELECT COALESCE(SUM(income), 0) AS total FROM monthly_income WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()

        # All-time expenses total
        all_exp = db.execute(
            text("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()

        # Initial balance
        us = db.execute(
            text("SELECT initial_balance FROM user_settings WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()

        month_income   = float(mi.income)       if mi  else 0.0
        month_expenses = float(me.total)         if me  else 0.0
        month_savings  = month_income - month_expenses
        initial_bal    = float(us.initial_balance) if us and us.initial_balance is not None else 0.0
        overall_bal    = initial_bal + float(all_income.total) - float(all_exp.total)

        return {
            "year":            year,
            "month":           month,
            "month_income":    month_income,
            "month_expenses":  month_expenses,
            "month_savings":   month_savings,
            "initial_balance": initial_bal,
            "overall_balance": overall_bal,
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
                INSERT INTO monthly_income (user_id, year, month, income, updated_at)
                VALUES (:uid, :y, :m, :income, NOW())
                ON CONFLICT (user_id, year, month) DO UPDATE SET
                    income     = EXCLUDED.income,
                    updated_at = NOW()
            """),
            {"uid": user_id, "y": year, "m": month, "income": body.income or 0.0},
        )
        db.commit()
        return {"status": "updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
