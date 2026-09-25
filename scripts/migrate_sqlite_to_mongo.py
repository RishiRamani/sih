"""
One-shot migration: SQLite ecdat.db -> MongoDB scans collection.
Run from repo root:
    python scripts/migrate_sqlite_to_mongo.py
"""
import json
import sqlite3
from datetime import datetime
from pathlib import Path

from pymongo import MongoClient

SQLITE_PATH = Path("backend/data/ecdat.db")
MONGO_URI = "mongodb://localhost:27017"
MONGO_DB = "ecdat"

def main():
    if not SQLITE_PATH.exists():
        print(f"No SQLite DB at {SQLITE_PATH}; nothing to migrate.")
        return

    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT scan_id, target_path, status, result_json, created_at FROM scans"
    ).fetchall()
    conn.close()

    client = MongoClient(MONGO_URI)
    collection = client[MONGO_DB]["scans"]

    migrated = 0
    for row in rows:
        result_json = json.loads(row["result_json"])
        document = {
            "scan_id": row["scan_id"],
            "target_path": row["target_path"],
            "status": row["status"],
            "created_at": datetime.fromisoformat(row["created_at"]),
            "result_json": result_json,
        }
        collection.replace_one({"scan_id": row["scan_id"]}, document, upsert=True)
        migrated += 1

    client.close()
    print(f"Migrated {migrated} scan(s) from {SQLITE_PATH} to {MONGO_DB}.scans")

if __name__ == "__main__":
    main()