# backend/schemas/comparison.py
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ComparisonRecord(BaseModel):
    comparison_id: str
    owner_id: str
    old_scan_id: str
    old_scan_name: str
    old_grade: str
    new_scan_id: str
    new_scan_name: str
    new_grade: str
    verdict: Literal["improved", "regressed", "unchanged"]
    removed_count: int
    added_count: int
    created_at: datetime


class ComparisonCreate(BaseModel):
    old_scan_id: str
    old_scan_name: str
    old_grade: str
    new_scan_id: str
    new_scan_name: str
    new_grade: str
    verdict: Literal["improved", "regressed", "unchanged"]
    removed_count: int
    added_count: int