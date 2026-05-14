"""
API v1 Router
"""

from fastapi import APIRouter

from . import (
    auth, categories, expenses, transactions,
    analytics, reports, search, calendar,
    notifications, chat, settings,
)

router = APIRouter()

router.include_router(auth.router,          prefix="/auth",          tags=["auth"])
router.include_router(categories.router,    prefix="/categories",    tags=["categories"])
router.include_router(expenses.router,      prefix="/expenses",      tags=["expenses"])
router.include_router(transactions.router,  prefix="/transactions",  tags=["transactions"])
router.include_router(analytics.router,     prefix="/analytics",     tags=["analytics"])
router.include_router(reports.router,       prefix="/reports",       tags=["reports"])
router.include_router(search.router,        prefix="/search",        tags=["search"])
router.include_router(calendar.router,      prefix="/calendar",      tags=["calendar"])
router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
router.include_router(chat.router,          prefix="/chat",          tags=["chat"])
router.include_router(settings.router,      prefix="/settings",      tags=["settings"])


@router.get("/", tags=["health"])
async def api_root():
    return {"message": "Tracksy.AI API v1", "version": "1.0.0"}
