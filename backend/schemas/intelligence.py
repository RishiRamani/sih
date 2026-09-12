from typing import Any

from pydantic import BaseModel, Field

from .recommendation import RecommendationAssessment
from .risk import RiskAssessment


class IntelligenceAssessment(BaseModel):
    finding_index: int
    algorithm: str | None = None
    primitive_type: str | None = None

    risk_assessment: RiskAssessment = Field(
        default_factory=RiskAssessment
    )

    recommendation: RecommendationAssessment = Field(
        default_factory=RecommendationAssessment
    )

    metadata: dict[str, Any] = Field(default_factory=dict)