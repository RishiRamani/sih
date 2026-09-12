from pydantic import BaseModel, Field


class RecommendationAssessment(BaseModel):
    direction: str = "MANUAL_REVIEW"
    candidate_algorithms: list[str] = Field(default_factory=list)
    hybrid_path: str | None = None
    migration_priority: str = "NONE"
    rationale: str = ""