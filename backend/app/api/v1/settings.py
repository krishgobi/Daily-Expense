"""
User Settings API
Salary date, WhatsApp number, initial balance, monthly income tracking
Balance = initial + all_income - all_expenses - lent_pending + borrowed_pending
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
    income: Optional[float] = None   # sets absolute value for the month


class IncomeAdjustBody(BaseModel):
    amount:    float                  # amount to add (+) or subtract (-)
    operation: str = "add"            # "add" | "subtract"
    note:      Optional[str] = None


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

def _fetch_balance_data(db, user_id: str, year: int, month: int) -> dict:
    """
    Core balance calculation:
      overall_balance = initial_balance
                        + SUM(all monthly incomes)
                        - SUM(all expenses)
                        - SUM(LENT pending)        ← gave money, not yet returned
                        + SUM(BORROWED pending)     ← received money, not yet paid back

    When a LENT is returned (COMPLETED) the amount cancels out of lent_pending
    and automatically adds back to balance.  Same logic for BORROWED paid back.
    """
    from_date = f"{year}-{month:02d}-01"
    last_day  = calendar.monthrange(year, month)[1]
    to_date   = f"{year}-{month:02d}-{last_day:02d}"

    # This month's logged income
    mi = db.execute(
        text("SELECT income FROM monthly_income WHERE user_id = :uid AND year = :y AND month = :m"),
        {"uid": user_id, "y": year, "m": month},
    ).fetchone()

    # This month's regular expenses
    me = db.execute(
        text("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses "
             "WHERE user_id = :uid AND date >= :f AND date <= :t"),
        {"uid": user_id, "f": from_date, "t": to_date},
    ).fetchone()

    # This month's LENT transactions (given out this month, still pending)
    lent_month = db.execute(
        text("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions "
             "WHERE user_id = :uid AND transaction_type = 'LENT' AND status = 'PENDING' "
             "AND given_date >= :f AND given_date <= :t"),
        {"uid": user_id, "f": from_date, "t": to_date},
    ).fetchone()

    # This month's LENT returned (completed this month — money came back)
    lent_returned_month = db.execute(
        text("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions "
             "WHERE user_id = :uid AND transaction_type = 'LENT' AND status = 'COMPLETED' "
             "AND actual_return_date >= :f AND actual_return_date <= :t"),
        {"uid": user_id, "f": from_date, "t": to_date},
    ).fetchone()

    # All-time income
    all_income = db.execute(
        text("SELECT COALESCE(SUM(income), 0) AS total FROM monthly_income WHERE user_id = :uid"),
        {"uid": user_id},
    ).fetchone()

    # All-time expenses
    all_exp = db.execute(
        text("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = :uid"),
        {"uid": user_id},
    ).fetchone()

    # All LENT PENDING (money still out)
    lent_pending = db.execute(
        text("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions "
             "WHERE user_id = :uid AND transaction_type = 'LENT' AND status = 'PENDING'"),
        {"uid": user_id},
    ).fetchone()

    # All BORROWED PENDING (money in hand, not yet paid back)
    borrowed_pending = db.execute(
        text("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions "
             "WHERE user_id = :uid AND transaction_type = 'BORROWED' AND status = 'PENDING'"),
        {"uid": user_id},
    ).fetchone()

    # Initial balance
    us = db.execute(
        text("SELECT initial_balance FROM user_settings WHERE user_id = :uid"),
        {"uid": user_id},
    ).fetchone()

    initial_bal         = float(us.initial_balance) if us and us.initial_balance is not None else 0.0
    month_income        = float(mi.income)          if mi  else 0.0
    month_exp           = float(me.total)
    lent_out_month      = float(lent_month.total)
    lent_returned       = float(lent_returned_month.total)
    lp                  = float(lent_pending.total)
    bp                  = float(borrowed_pending.total)

    # Monthly totals
    month_expenses = month_exp + lent_out_month   # regular expenses + money lent this month
    month_income_adj = month_income + lent_returned  # income + money returned to you this month
    month_savings  = month_income_adj - month_expenses

    overall_expenses = float(all_exp.total) + lp  # expenses + outstanding lent money
    overall_balance  = initial_bal + float(all_income.total) - float(all_exp.total) - lp + bp

    return {
        "year":              year,
        "month":             month,
        "month_income":      month_income,        # raw logged salary
        "month_expenses":    month_expenses,       # expenses + lent given this month
        "month_lent_out":    lent_out_month,       # just the lent part of expenses
        "month_lent_returned": lent_returned,      # money received back this month
        "month_savings":     month_savings,
        "overall_expenses":  overall_expenses,
        "lent_pending":      lp,
        "borrowed_pending":  bp,
        "initial_balance":   initial_bal,
        "overall_balance":   overall_balance,
    }


@router.get("/income", tags=["settings"])
async def get_income(user_id: str = Depends(get_current_user_id)):
    now = datetime.now()
    db = _db()
    try:
        return _fetch_balance_data(db, user_id, now.year, now.month)
    finally:
        db.close()


@router.put("/income", tags=["settings"])
async def set_monthly_income(
    body: MonthlyIncomeBody,
    user_id: str = Depends(get_current_user_id),
):
    """Set (overwrite) this month's income."""
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


@router.post("/income/adjust", tags=["settings"])
async def adjust_monthly_income(
    body: IncomeAdjustBody,
    user_id: str = Depends(get_current_user_id),
):
    """Add or subtract an amount from this month's income (calculator-style)."""
    if body.operation not in ("add", "subtract"):
        raise HTTPException(status_code=400, detail="operation must be 'add' or 'subtract'")
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")

    now = datetime.now()
    year, month = now.year, now.month
    delta = body.amount if body.operation == "add" else -body.amount

    db = _db()
    try:
        db.execute(
            text("""
                INSERT INTO monthly_income (user_id, year, month, income, updated_at)
                VALUES (:uid, :y, :m, GREATEST(0, :delta), NOW())
                ON CONFLICT (user_id, year, month) DO UPDATE SET
                    income     = GREATEST(0, monthly_income.income + :delta),
                    updated_at = NOW()
            """),
            {"uid": user_id, "y": year, "m": month, "delta": delta},
        )
        db.commit()
        row = db.execute(
            text("SELECT income FROM monthly_income WHERE user_id = :uid AND year = :y AND month = :m"),
            {"uid": user_id, "y": year, "m": month},
        ).fetchone()
        return {"status": "adjusted", "income": float(row.income) if row else 0.0}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
