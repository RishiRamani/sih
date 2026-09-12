import sqlite3
from pathlib import Path


DB_PATH = Path("backend/data/ecdat.db")


def get_connection() -> sqlite3.Connection:
    """
    Create a SQLite connection for the ECDAT database.
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    return connection


def initialize_database() -> None:
    """
    Create the persistence schema if it does not already exist.
    """
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS scans (
                scan_id TEXT PRIMARY KEY,
                target_path TEXT NOT NULL,
                status TEXT NOT NULL,
                result_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        connection.commit()


initialize_database()