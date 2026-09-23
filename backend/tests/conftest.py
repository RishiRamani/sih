# Append to backend/tests/conftest.py

import os
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient


TEST_MONGO_URI = os.getenv("TEST_MONGO_URI", "mongodb://localhost:27017")
TEST_DB_NAME = "ecdat_test"


@pytest.fixture(scope="function")
def mongo_test_db(monkeypatch):
    """
    Point settings at a throwaway database for the duration of the test.
    Drops it afterward.
    """
    from backend.core import config

    monkeypatch.setattr(config.settings, "MONGO_DB_NAME", TEST_DB_NAME)

    # Force the lazy client to reconnect with the test DB name
    from backend.persistence import database
    database._client = None

    database.initialize_database()

    yield database.get_client()[TEST_DB_NAME]

    database.get_client().drop_database(TEST_DB_NAME)
    database._client = None


@pytest.fixture(scope="function")
def api_client(mongo_test_db):
    """
    A FastAPI TestClient bound to the test Mongo DB.
    """
    from backend.main import app
    with TestClient(app) as client:
        yield client