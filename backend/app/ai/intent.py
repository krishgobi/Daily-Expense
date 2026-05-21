"""
Keyword-based intent detection — zero latency, no AI call needed.
"""
import re
from dataclasses import dataclass
from typing import Optional

@dataclass
class Intent:
    name:     str            # e.g. 'monthly_spend'
    category: Optional[str]  # populated for 'category_spend'
    period:   str            # 'current_month' | 'today' | 'this_week' | 'last_month' | 'all_time'

# Ordered by priority — first match wins
_PATTERNS: list[tuple[str, list[str]]] = [
    ('balance',        [r'balance', r'overall\s+balance', r'net\s+amount', r'how much.*left', r'current\s+balance']),
    ('comparison',     [r'compare', r'\bvs\b', r'versus', r'last month', r'previous month', r'difference.*month']),
    ('savings',        [r'saving', r'saved', r'how much.*save', r'save.*how much']),
    ('income',         [r'income', r'salary', r'earning']),
    ('lent',           [r'\blent\b', r'\blend\b', r'owe me', r'money.*back', r'who.*owes', r'pending.*return']),
    ('borrowed',       [r'\bborrow', r'i\s+owe', r'\bdebt\b']),
    ('top_expenses',   [r'biggest', r'largest', r'most expensive', r'highest', r'top expense', r'where.*most', r'most.*spend']),
    ('monthly_spend',  [r'this month', r'monthly', r'spend.*month', r'month.*spend', r'how much.*month', r'monthly expense']),
    ('today_spend',    [r'\btoday\b', r"today's", r'this day']),
    ('weekly_spend',   [r'this week', r'\bweekly\b', r'\bweek\b']),
    ('recent_expenses',[r'recent', r'latest', r'last \d+', r'last few', r'show.*expense', r'list.*expense', r'my expense']),
    ('category_spend', [r'how much.*(?:on|for|in)\s+\w+', r'spend.*on\s+\w+']),
]

_CATEGORY_MAP: dict[str, list[str]] = {
    'food':          ['food', 'restaurant', 'lunch', 'dinner', 'breakfast', 'eat', 'meal', 'snack', 'cafe', 'swiggy', 'zomato'],
    'transport':     ['transport', 'travel', 'uber', 'ola', 'auto', 'taxi', 'bus', 'train', 'metro', 'petrol', 'fuel'],
    'shopping':      ['shopping', 'clothes', 'dress', 'fashion', 'amazon', 'flipkart', 'purchase'],
    'entertainment': ['entertainment', 'movie', 'netflix', 'spotify', 'game', 'fun', 'party', 'concert'],
    'medical':       ['medical', 'health', 'medicine', 'doctor', 'hospital', 'pharmacy', 'clinic'],
    'grocery':       ['grocery', 'groceries', 'vegetables', 'fruits', 'supermarket', 'bigbasket'],
    'rent':          ['rent', 'house', 'apartment', 'flat', 'lease'],
    'utilities':     ['electricity', 'water', 'gas', 'bill', 'utilities', 'internet', 'wifi', 'broadband'],
    'education':     ['education', 'course', 'tuition', 'school', 'college', 'book'],
}

_GREETINGS = frozenset([
    'hi', 'hello', 'hey', 'hii', 'sup', 'yo', 'ok', 'okay', 'good morning',
    'good evening', 'good afternoon', 'good night', 'how are you', 'how r u',
    "what's up", 'whats up', 'who are you', 'what are you', 'what can you do',
    'thanks', 'thank you', 'ty', 'bye', 'goodbye', 'help', 'help me',
])


def detect_intent(message: str) -> Intent:
    lower = message.lower().strip().rstrip('!?.')

    if lower in _GREETINGS:
        return Intent(name='greeting', category=None, period='current_month')

    # Detect time period
    period = 'current_month'
    if re.search(r'last month|previous month', lower):
        period = 'last_month'
    elif re.search(r'\btoday\b', lower):
        period = 'today'
    elif re.search(r'this week|weekly', lower):
        period = 'this_week'
    elif re.search(r'all time|ever|total|overall', lower):
        period = 'all_time'

    # Detect category
    category: Optional[str] = None
    for cat, keywords in _CATEGORY_MAP.items():
        if any(kw in lower for kw in keywords):
            category = cat
            break

    # Match intent
    for intent_name, patterns in _PATTERNS:
        for pat in patterns:
            if re.search(pat, lower):
                if intent_name == 'category_spend' and not category:
                    continue
                return Intent(name=intent_name, category=category, period=period)

    return Intent(name='general', category=category, period=period)
