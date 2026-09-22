# backend/persistence/database.py
from pymongo import MongoClient, DESCENDING
from pymongo.collection import Collection

from ..core.config import settings


_client: MongoClient | None = None


def get_client() -> MongoClient:
    """Return the process-wide MongoClient (lazy singleton)."""
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_collection() -> Collection:
    """Return the scans collection."""
    return get_client()[settings.MONGO_DB_NAME][settings.MONGO_COLLECTION]


def initialize_database() -> None:
    """
    Ensure the scans collection and required indexes exist.
    Called once on import (mirrors old sqlite behaviour).
    """
    collection = get_collection()

    # Unique scan_id (matches the old PRIMARY KEY semantics)
    collection.create_index("scan_id", unique=True)

    # Newest-first listing (matches old ORDER BY created_at DESC)
    collection.create_index([("created_at", DESCENDING)])

    # Status queries (used by future scan-list filters)
    collection.create_index([("status", 1), ("created_at", DESCENDING)])


initialize_database()