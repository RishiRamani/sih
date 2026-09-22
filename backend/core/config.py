# backend/core/config.py
import os


class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "ecdat")
    MONGO_COLLECTION: str = "scans"


settings = Settings()