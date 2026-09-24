# backend/api/comparisons.py
from fastapi import APIRouter, Depends, HTTPException

from ..auth.dependencies import get_current_user
from ..persistence.crud import (
    delete_comparison,
    list_comparisons,
    list_comparisons_for_scan,
    upsert_comparison,
)
from ..schemas.comparison import ComparisonCreate, ComparisonRecord


router = APIRouter(prefix="/comparisons", tags=["Comparisons"])


@router.get("", response_model=list[ComparisonRecord])
def get_comparisons(current_user: dict = Depends(get_current_user)):
    return list_comparisons(current_user["user_id"])


@router.get("/for-scan/{scan_id}", response_model=list[ComparisonRecord])
def get_comparisons_for_scan(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    return list_comparisons_for_scan(current_user["user_id"], scan_id)


@router.post("", response_model=ComparisonRecord)
def create_or_update_comparison(
    payload: ComparisonCreate,
    current_user: dict = Depends(get_current_user),
):
    return upsert_comparison(current_user["user_id"], payload.model_dump())


@router.delete("/{comparison_id}")
def delete_comparison_endpoint(
    comparison_id: str,
    current_user: dict = Depends(get_current_user),
):
    deleted = delete_comparison(current_user["user_id"], comparison_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comparison not found")
    return {"comparison_id": comparison_id, "status": "deleted"}