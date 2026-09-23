# backend/tests/conftest.py
import os

import pytest
from fastapi.testclient import TestClient


TEST_DB_NAME = "ecdat_test"


@pytest.fixture(scope="function")
def mongo_test_db(monkeypatch):
    """
    Point settings at a throwaway database for the duration of the test,
    reset the lazy Mongo client, and drop the test DB afterward.
    """
    from backend.core import config

    monkeypatch.setattr(config.settings, "MONGO_DB_NAME", TEST_DB_NAME)

    # Reset the lazy client so a new one binds to the test DB name
    from backend.persistence import database as db_module
    db_module._client = None

    db_module.initialize_database()

    yield db_module.get_client()[TEST_DB_NAME]

    db_module.get_client().drop_database(TEST_DB_NAME)
    db_module._client = None


@pytest.fixture(scope="function")
def api_client(mongo_test_db):
    """
    A FastAPI TestClient bound to the test Mongo DB.
    Because main.py imports the routers (which import persistence) at
    import time, we must import it *after* the fixture has reset the client.
    """
    # Reset the lazy client once more, because `backend.main` will
    # import and call initialize_database() at import time.
    from backend.persistence import database as db_module
    db_module._client = None
    db_module.initialize_database()

    from backend.main import app

    with TestClient(app) as client:
        yield client

    db_module._client = None