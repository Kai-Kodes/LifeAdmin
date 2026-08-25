import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.attachments import router as attachments_router
from app.api.dashboard import router as dashboard_router
from app.api.obligations import router as obligations_router
from app.database.base import Base
from app.database.connection import SessionLocal, engine
from app.database.seed import seed_demo_data
from app.models.attachment import Attachment  # noqa: F401 — ensure table creation

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables and seed data on startup."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # Seed demo data if enabled
    if os.getenv("SEED_DATA", "true").lower() == "true":
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()

    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="LifeAdmin API",
    description="Personal life-administration platform — track warranties, renewals, and obligations.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(obligations_router)
app.include_router(dashboard_router)
app.include_router(attachments_router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "lifeadmin"}
