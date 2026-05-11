"""
FastAPI Application Entry Point
Tracksy.AI
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import Settings
from app.api.v1 import router as api_v1_router
from app.utils.schema_sync import run_schema_sync

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    print("🚀 Starting Tracksy.AI API...")
    try:
        run_schema_sync()
        print("✅ Database schema synced")
    except Exception as exc:
        print(f"⚠️ Database schema sync skipped: {exc}")
    yield
    # Shutdown
    print("🛑 Shutting down API...")


app = FastAPI(
    title=settings.API_TITLE,
    description="Tracksy.AI API",
    version=settings.API_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check Endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "Tracksy.AI API",
        "version": settings.API_VERSION,
    }


# Include API routes
app.include_router(api_v1_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Tracksy.AI API",
        "docs": "/api/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )
