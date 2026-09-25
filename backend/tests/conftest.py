# backend/tests/conftest.py
import os

import pytest
from fastapi.testclient import TestClient


TEST_MONGO_URI = os.getenv("TEST_MONGO_URI", "mongodb://localhost:27017")
TEST_DB_NAME = "ecdat_test"


def _assert_not_production(uri: str) -> None:
    """
    Refuse to run tests against a real MongoDB Atlas or remote cluster.
    Protects against accidentally wiping production data.
    """
    lowered = uri.lower()
    if "mongodb+srv://" in lowered or "mongodb.net" in lowered:
        raise RuntimeError(
            f"Refusing to run tests against a production-looking Mongo URI: {uri}\n"
            "Set TEST_MONGO_URI to a local MongoDB (e.g. mongodb://localhost:27017)."
        )


@pytest.fixture(scope="function", autouse=True)
def _force_test_mongo_uri(monkeypatch):
    """
    Force settings.MONGO_URI to the local test URI for the entire session,
    before any backend module imports the client.
    """
    _assert_not_production(TEST_MONGO_URI)

    from backend.core import config
    monkeypatch.setattr(config.settings, "MONGO_URI", TEST_MONGO_URI)
    monkeypatch.setattr(config.settings, "MONGO_DB_NAME", TEST_DB_NAME)

    yield


@pytest.fixture(scope="function")
def mongo_test_db(monkeypatch):
    from backend.core import config

    monkeypatch.setattr(config.settings, "MONGO_URI", TEST_MONGO_URI)
    monkeypatch.setattr(config.settings, "MONGO_DB_NAME", TEST_DB_NAME)

    from backend.persistence import database as db_module
    db_module._client = None

    db_module.initialize_database()

    yield db_module.get_client()[TEST_DB_NAME]

    db_module.get_client().drop_database(TEST_DB_NAME)
    db_module._client = None


@pytest.fixture(scope="function")
def api_client(mongo_test_db):
    from backend.persistence import database as db_module
    db_module._client = None
    db_module.initialize_database()

    from backend.main import app

    with TestClient(app) as client:
        yield client

    db_module._client = None