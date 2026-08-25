import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://lifeadmin:lifeadmin@localhost:5432/lifeadmin"
)

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
