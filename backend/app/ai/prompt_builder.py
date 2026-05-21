"""
Minimal prompt builder — squeezes context into as few tokens as possible.
AI only gets the aggregated SQL result, not raw rows.
"""
from typing import Optional, Any

SYSTEM = (
    "You are Tracksy, a personal finance assistant. "
    "Reply in 1-3 short sentences. Use ₹ for amounts. "
    "Be direct and conversational. Never invent numbers."
)


def build(
    user_message: str,
    data: Optional[dict | list],
    intent: str,
    history: list[dict],
) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": SYSTEM}]

    # Append up to 5 history messages (already trimmed by caller)
    for h in history[-5:]:
        messages.append({"role": h["role"], "content": h["content"]})

    # Compact data context
    ctx = _format(data, intent) if (data and intent not in ('greeting', 'general')) else ""
    user_turn = f"[Data] {ctx}\n[Question] {user_message}" if ctx else user_message
    messages.append({"role": "user", "content": user_turn})
    return messages


def _fmt(n: float) -> str:
    return f"₹{n:,.0f}"


def _format(data: Any, intent: str) -> str:
    try:
        if intent in ('monthly_spend', 'today_spend', 'weekly_spend'):
            period_label = {"today": "today", "this_week": "this week",
                            "last_month": "last month"}.get(data.get("period", ""), "this month")
            return f"{_fmt(data['total'])} spent {period_label} across {data['count']} transactions"

        if intent == 'category_spend':
            return (f"{_fmt(data['total'])} spent on {data.get('category','this category')} "
                    f"({data['count']} transactions)")

        if intent == 'top_expenses':
            rows = data.get('expenses', [])
            if not rows:
                return "No expenses found"
            lines = [f"• {e['purpose']} {_fmt(e['amount'])} on {e['date']}" for e in rows]
            return "Top expenses:\n" + "\n".join(lines)

        if intent == 'recent_expenses':
            rows = data.get('expenses', [])
            if not rows:
                return "No recent expenses"
            lines = [f"• {e['purpose']} {_fmt(e['amount'])} ({e['date']})" for e in rows]
            return "Recent:\n" + "\n".join(lines)

        if intent == 'balance':
            return (f"Balance {_fmt(data['balance'])} | "
                    f"Income {_fmt(data['total_income'])} | "
                    f"Expenses {_fmt(data['total_expenses'])} | "
                    f"Lent out {_fmt(data['lent_pending'])} | "
                    f"Borrowed {_fmt(data['borrowed_pending'])}")

        if intent == 'lent':
            rows = data.get('transactions', [])
            if not rows:
                return "No pending lent money"
            lines = [f"• {t['person']} owes {_fmt(t['amount'])}" +
                     (f" (due {t['due']})" if t.get('due') else "") for t in rows]
            return "Pending lent:\n" + "\n".join(lines)

        if intent == 'borrowed':
            rows = data.get('transactions', [])
            if not rows:
                return "No pending borrowed money"
            lines = [f"• You owe {t['person']} {_fmt(t['amount'])}" for t in rows]
            return "You owe:\n" + "\n".join(lines)

        if intent == 'income':
            return f"This month income: {_fmt(data.get('income', 0))}"

        if intent == 'comparison':
            direction = "more" if data['difference'] > 0 else "less"
            return (f"This month {_fmt(data['this_month'])} vs last month {_fmt(data['last_month'])} "
                    f"({abs(data['change_pct'])}% {direction})")

        if intent == 'savings':
            return (f"Income {_fmt(data['income'])} | "
                    f"Expenses {_fmt(data['expenses'])} | "
                    f"Savings {_fmt(data['savings'])}")

    except Exception:
        pass
    return str(data)
