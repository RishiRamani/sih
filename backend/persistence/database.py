# backend/persistence/database.py
from pymongo import MongoClient, DESCENDING
from pymongo.collection import Collection

from ..core.config import settings


_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_collection() -> Collection:
    """Scans collection."""
    return get_client()[settings.MONGO_DB_NAME][settings.MONGO_COLLECTION]


def get_users_collection() -> Collection:
    """Users collection."""
    return get_client()[settings.MONGO_DB_NAME][settings.MONGO_USERS_COLLECTION]

def get_comparisons_collection() -> Collection:
    """Comparisons collection."""
    return get_client()[settings.MONGO_DB_NAME]["comparisons"]

def initialize_database() -> None:
    scans = get_collection()
    users = get_users_collection()
    comparisons = get_comparisons_collection()

    # ---- scans ----
    scans.create_index("scan_id", unique=True)
    scans.create_index([("created_at", DESCENDING)])
    scans.create_index([("status", 1), ("created_at", DESCENDING)])
    scans.create_index([("owner_id", 1), ("created_at", DESCENDING)])

    # ---- users ----
    users.create_index("user_id", unique=True)
    users.create_index("email_lower", unique=True)

    # ---- comparisons ----
    comparisons.create_index("comparison_id", unique=True)
    comparisons.create_index([("owner_id", 1), ("created_at", DESCENDING)])
    comparisons.create_index([("owner_id", 1), ("old_scan_id", 1), ("new_scan_id", 1)], unique=True)

# initialize_database()