"""
Intent-driven SQL repository — one targeted query per intent.
Never fetches full tables. AI gets only aggregated results.
"""
from sqlalchemy import text
from app.database.connection import SessionLocal


def _db():
    return SessionLocal()


def get_period_clause(period: str) -> str:
    if period == 'today':
        return "AND date = CURRENT_DATE"
    if period == 'this_week':
        return "AND date >= DATE_TRUNC('week', CURRENT_DATE)"
    if period == 'last_month':
        return ("AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') "
                "AND date < DATE_TRUNC('month', CURRENT_DATE)")
    if period == 'all_time':
        return ""
    # default: current_month
    return "AND date >= DATE_TRUNC('month', CURRENT_DATE) AND date <= CURRENT_DATE"


def get_spend_summary(user_id: str, period: str = 'current_month') -> dict:
    db = _db()
    try:
        clause = get_period_clause(period)
        row = db.execute(
            text(f"SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count "
                 f"FROM expenses WHERE user_id=:uid {clause}"),
            {"uid": user_id},
        ).fetchone()
        return {"total": float(row.total), "count": int(row.count), "period": period}
    finally:
        db.close()


def get_category_spend(user_id: str, category: str, period: str = 'current_month') -> dict:
    db = _db()
    try:
        clause = get_period_clause(period)
        row = db.execute(
            text(f"SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count "
                 f"FROM expenses WHERE user_id=:uid AND LOWER(purpose) ILIKE :cat {clause}"),
            {"uid": user_id, "cat": f"%{category}%"},
        ).fetchone()
        return {"total": float(row.total), "count": int(row.count), "category": category, "period": period}
    finally:
        db.close()


def get_top_expenses(user_id: str, limit: int = 5, period: str = 'current_month') -> list:
    db = _db()
    try:
        clause = get_period_clause(period)
        rows = db.execute(
            text(f"SELECT purpose, amount, date FROM expenses "
                 f"WHERE user_id=:uid {clause} ORDER BY amount DESC LIMIT :lim"),
            {"uid": user_id, "lim": limit},
        ).fetchall()
        return [{"purpose": r.purpose, "amount": float(r.amount), "date": str(r.date)} for r in rows]
    finally:
        db.close()


def get_recent_expenses(user_id: str, limit: int = 5) -> list:
    db = _db()
    try:
        rows = db.execute(
            text("SELECT purpose, amount, date, type FROM expenses "
                 "WHERE user_id=:uid ORDER BY date DESC, created_at DESC LIMIT :lim"),
            {"uid": user_id, "lim": limit},
        ).fetchall()
        return [{"purpose": r.purpose, "amount": float(r.amount), "date": str(r.date), "type": r.type} for r in rows]
    finally:
        db.close()


def get_balance(user_id: str) -> dict:
    db = _db()
    try:
        # Single query gets everything needed
        row = db.execute(text("""
            SELECT
              COALESCE((SELECT initial_balance FROM user_settings WHERE user_id=:uid), 0) AS initial_bal,
              COALESCE((SELECT SUM(income) FROM monthly_income WHERE user_id=:uid), 0) AS all_income,
              COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id=:uid), 0) AS all_exp,
              COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id=:uid AND transaction_type='LENT' AND status='PENDING'), 0) AS lent,
              COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id=:uid AND transaction_type='BORROWED' AND status='PENDING'), 0) AS borrowed
        """), {"uid": user_id}).fetchone()

        bal = float(row.initial_bal) + float(row.all_income) - float(row.all_exp) - float(row.lent) + float(row.borrowed)
        return {
            "balance":          round(bal, 2),
            "total_income":     float(row.all_income),
            "total_expenses":   float(row.all_exp),
            "lent_pending":     float(row.lent),
            "borrowed_pending": float(row.borrowed),
        }
    finally:
        db.close()


def get_lent(user_id: str) -> list:
    db = _db()
    try:
        rows = db.execute(
            text("SELECT person_name, amount, expected_return_date FROM transactions "
                 "WHERE user_id=:uid AND transaction_type='LENT' AND status='PENDING' "
                 "ORDER BY given_date DESC LIMIT 10"),
            {"uid": user_id},
        ).fetchall()
        return [{"person": r.person_name, "amount": float(r.amount),
                 "due": str(r.expected_return_date) if r.expected_return_date else None} for r in rows]
    finally:
        db.close()


def get_borrowed(user_id: str) -> list:
    db = _db()
    try:
        rows = db.execute(
            text("SELECT person_name, amount, expected_return_date FROM transactions "
                 "WHERE user_id=:uid AND transaction_type='BORROWED' AND status='PENDING' "
                 "ORDER BY given_date DESC LIMIT 10"),
            {"uid": user_id},
        ).fetchall()
        return [{"person": r.person_name, "amount": float(r.amount),
                 "due": str(r.expected_return_date) if r.expected_return_date else None} for r in rows]
    finally:
        db.close()


def get_income(user_id: str) -> dict:
    db = _db()
    try:
        row = db.execute(
            text("SELECT COALESCE(income, 0) AS income FROM monthly_income "
                 "WHERE user_id=:uid AND year=EXTRACT(YEAR FROM CURRENT_DATE)::int "
                 "AND month=EXTRACT(MONTH FROM CURRENT_DATE)::int"),
            {"uid": user_id},
        ).fetchone()
        return {"income": float(row.income) if row else 0.0}
    finally:
        db.close()


def get_comparison(user_id: str) -> dict:
    db = _db()
    try:
        row = db.execute(text("""
            SELECT
              COALESCE(SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN amount END), 0)   AS this_month,
              COALESCE(SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                                 AND date <  DATE_TRUNC('month', CURRENT_DATE) THEN amount END), 0)   AS last_month
            FROM expenses WHERE user_id=:uid
            AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        """), {"uid": user_id}).fetchone()

        this_m = float(row.this_month)
        last_m = float(row.last_month)
        diff   = this_m - last_m
        pct    = round((diff / last_m * 100) if last_m > 0 else 0, 1)
        return {"this_month": this_m, "last_month": last_m, "difference": diff, "change_pct": pct}
    finally:
        db.close()


def get_savings(user_id: str) -> dict:
    db = _db()
    try:
        inc_row = db.execute(
            text("SELECT COALESCE(income,0) AS income FROM monthly_income "
                 "WHERE user_id=:uid AND year=EXTRACT(YEAR FROM CURRENT_DATE)::int "
                 "AND month=EXTRACT(MONTH FROM CURRENT_DATE)::int"),
            {"uid": user_id},
        ).fetchone()
        exp_row = db.execute(
            text("SELECT COALESCE(SUM(amount),0) AS total FROM expenses "
                 "WHERE user_id=:uid AND date >= DATE_TRUNC('month', CURRENT_DATE)"),
            {"uid": user_id},
        ).fetchone()
        income   = float(inc_row.income) if inc_row else 0.0
        expenses = float(exp_row.total)
        return {"income": income, "expenses": expenses, "savings": round(income - expenses, 2)}
    finally:
        db.close()
