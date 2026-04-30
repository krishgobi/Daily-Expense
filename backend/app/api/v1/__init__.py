"""
API v1 Router
Main entry point for all API routes
"""

from fastapi import APIRouter

# Import route modules
from . import auth, categories, expenses, transactions, analytics, reports

router = APIRouter()

# Include route modules
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(categories.router, prefix="/categories", tags=["categories"])
router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(reports.router, prefix="/reports", tags=["reports"])


@router.get("/", tags=["health"])
async def api_root():
    """API v1 root endpoint."""
    return {"message": "API v1 is running", "version": "1.0.0"}
