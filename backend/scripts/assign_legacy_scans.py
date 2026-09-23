"""
Assign all scans with no owner_id to a single seed user.
Run once from repo root after enabling auth:
    python -m backend.scripts.assign_legacy_scans
"""
from datetime import datetime

from backend.auth.passwords import hash_password
from backend.persistence.database import get_collection, get_users_collection
from backend.persistence.repositories import user_repository


SEED_EMAIL = "demo@ecdat.local"
SEED_PASSWORD = "demopass123"


def main():
    users = get_users_collection()
    existing = user_repository.get_by_email(SEED_EMAIL)

    if existing is None:
        existing = user_repository.create(
            email=SEED_EMAIL,
            password_hash=hash_password(SEED_PASSWORD),
        )
        print(f"Created seed user: {SEED_EMAIL} / {SEED_PASSWORD}")
    else:
        print(f"Seed user already exists: {SEED_EMAIL}")

    scans = get_collection()
    result = scans.update_many(
        {"owner_id": {"$exists": False}},
        {"$set": {"owner_id": existing["user_id"]}},
    )
    print(f"Assigned {result.modified_count} orphan scan(s) to {SEED_EMAIL}")


if __name__ == "__main__":
    main()