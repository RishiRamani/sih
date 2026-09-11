from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Finding(BaseModel):
    """
    Canonical finding contract shared by every scanner.

    Scanner-specific code should produce this shape.
    Downstream components should work from this normalized representation.
    """

    model_config = ConfigDict(extra="allow")

    artifact_type: str

    algorithm: str | None = None
    primitive_type: str | None = None
    variant: str | None = None

    key_size: int | None = None

    library: str | None = None
    library_version: str | None = None

    asset_path: str

    line_start: int | None = None
    line_end: int | None = None

    detection_method: str
    confidence: float = Field(ge=0.0, le=1.0)

    evidence: str | None = None

    metadata: dict[str, Any] = Field(default_factory=dict)