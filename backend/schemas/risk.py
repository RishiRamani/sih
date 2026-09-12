from typing import Any

from pydantic import BaseModel, Field


class RiskAssessment(BaseModel):
    classical: dict[str, Any] = Field(default_factory=dict)
    quantum: dict[str, Any] = Field(default_factory=dict)
    mosca: dict[str, Any] = Field(default_factory=dict)
    risk: dict[str, Any] = Field(default_factory=dict)