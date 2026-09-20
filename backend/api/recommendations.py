from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..persistence.crud import get_scan, update_scan
from ..schemas.intelligence import IntelligenceAssessment


SEVERITY_ORDER = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
    "INFORMATIONAL": 4,
}

router = APIRouter(
    prefix="/scans",
    tags=["Recommendations"],
)


class RecommendationStatusPatch(BaseModel):
    status: str


def get_recommendation_severity(rec) -> str:
    return rec.risk_assessment.risk.get("severity", "INFORMATIONAL")

@router.get(
    "/{scan_id}/recommendations",
    response_model=list[IntelligenceAssessment],
)
def get_recommendations(scan_id: str) -> list[IntelligenceAssessment]:
    result = get_scan(scan_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scan not found: {scan_id}",
        )

    recommendations = list(result.intelligence)

    recommendations.sort(
        key=lambda rec: SEVERITY_ORDER.get(
            get_recommendation_severity(rec),
            99,
        )
    )

    return recommendations

@router.patch("/{scan_id}/recommendations/{finding_index}", response_model=IntelligenceAssessment)
def update_recommendation_status(scan_id: str, finding_index: int, patch: RecommendationStatusPatch) -> IntelligenceAssessment:
    result = get_scan(scan_id)
    if result is None or finding_index < 0 or finding_index >= len(result.intelligence):
        raise HTTPException(status_code=404, detail="Recommendation not found")
    result.intelligence[finding_index].metadata["status"] = patch.status
    update_scan(result)
    return result.intelligence[finding_index]