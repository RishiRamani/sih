from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..persistence.crud import get_scan, update_scan
from ..schemas.intelligence import IntelligenceAssessment


router = APIRouter(
    prefix="/scans",
    tags=["Recommendations"],
)


class RecommendationStatusPatch(BaseModel):
    status: str


@router.get(
    "/{scan_id}/recommendations",
    response_model=list[IntelligenceAssessment],
)
def get_recommendations(scan_id: str) -> list[IntelligenceAssessment]:
    """
    Return migration recommendations for a stored scan.
    """

    result = get_scan(scan_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scan not found: {scan_id}",
        )

    return result.intelligence


@router.patch("/{scan_id}/recommendations/{finding_index}", response_model=IntelligenceAssessment)
def update_recommendation_status(scan_id: str, finding_index: int, patch: RecommendationStatusPatch) -> IntelligenceAssessment:
    result = get_scan(scan_id)
    if result is None or finding_index < 0 or finding_index >= len(result.intelligence):
        raise HTTPException(status_code=404, detail="Recommendation not found")
    result.intelligence[finding_index].metadata["status"] = patch.status
    update_scan(result)
    return result.intelligence[finding_index]