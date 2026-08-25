import logging
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.obligation import Obligation

logger = logging.getLogger(__name__)

DEMO_OBLIGATIONS = [
    {
        "title": "MacBook Air M3",
        "description": "Standard one-year Apple warranty covering manufacturing defects.",
        "category": "warranty",
        "provider": "Apple",
        "purchase_date": date(2025, 9, 12),
        "expiry_date": date(2026, 9, 12),
        "amount": Decimal("89999.00"),
        "currency": "INR",
        "notes": "[Demo] Invoice stored in Google Drive. AppleCare+ available for extension.",
    },
    {
        "title": "Samsung 653L Refrigerator",
        "description": "Three-year comprehensive warranty on Samsung side-by-side refrigerator.",
        "category": "warranty",
        "provider": "Samsung",
        "purchase_date": date(2024, 11, 2),
        "expiry_date": date(2027, 11, 2),
        "amount": Decimal("52000.00"),
        "currency": "INR",
        "notes": "[Demo] Purchased from Reliance Digital. Extended warranty card in drawer.",
    },
    {
        "title": "Logitech MX Keys S",
        "description": "Two-year warranty on wireless keyboard.",
        "category": "warranty",
        "provider": "Logitech",
        "purchase_date": date(2025, 3, 10),
        "expiry_date": date(2027, 3, 10),
        "amount": Decimal("8499.00"),
        "currency": "INR",
        "notes": "[Demo] Amazon order #402-1234567-8901234.",
    },
    {
        "title": "Dell Inspiron 15",
        "description": "Two-year standard warranty. Extended warranty purchased separately.",
        "category": "warranty",
        "provider": "Dell",
        "purchase_date": date(2024, 9, 18),
        "expiry_date": date(2026, 9, 18),
        "amount": Decimal("65000.00"),
        "currency": "INR",
        "notes": "[Demo] Service tag: ABC1234. Dell Premium Support included.",
    },
    {
        "title": "Dyson V12 Vacuum",
        "description": "Two-year manufacturer warranty on cordless vacuum cleaner.",
        "category": "warranty",
        "provider": "Dyson",
        "purchase_date": date(2025, 1, 15),
        "expiry_date": date(2027, 1, 15),
        "amount": Decimal("42900.00"),
        "currency": "INR",
        "notes": "[Demo] Registered on Dyson website. Serial number in warranty card.",
    },
    {
        "title": "Car Insurance — Honda City",
        "description": "Comprehensive motor insurance policy with zero depreciation.",
        "category": "insurance",
        "provider": "HDFC Ergo",
        "purchase_date": date(2025, 6, 1),
        "expiry_date": date(2026, 5, 31),
        "amount": Decimal("18500.00"),
        "currency": "INR",
        "notes": "[Demo] Policy number: HE/2025/12345678. NCB: 50%.",
    },
]


def seed_demo_data(db: Session) -> None:
    """Seed the database with demo obligations if the table is empty."""
    count = db.query(Obligation).count()
    if count > 0:
        logger.info(f"Database already has {count} obligations. Skipping seed.")
        return

    logger.info("Seeding database with demo obligations...")
    for data in DEMO_OBLIGATIONS:
        obligation = Obligation(**data)
        db.add(obligation)

    db.commit()
    logger.info(f"Seeded {len(DEMO_OBLIGATIONS)} demo obligations.")
