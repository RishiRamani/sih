from pathlib import Path

from ..schemas.finding import Finding
from .deduplication import deduplicate_findings, finding_fingerprint


def normalize_findings(findings: list[Finding]) -> list[Finding]:
    """
    Convert raw scanner output into a clean canonical set of findings.
    """

    normalized: list[Finding] = []

    for finding in findings:
        if finding.algorithm:
            finding.algorithm = finding.algorithm.strip()

        if finding.library:
            finding.library = finding.library.strip()

        if finding.asset_path:
            finding.asset_path = finding.asset_path.replace("\\", "/")

        finding.component_id = derive_component_id(finding)

        normalized.append(finding)

    normalized = deduplicate_findings(normalized)

    return normalized


def derive_component_id(finding: Finding) -> str:
    """
    Derive a stable component identity from the asset path.

    For the initial implementation, the top-level asset directory
    is treated as the application/component boundary.
    """

    path = Path(finding.asset_path)

    parts = path.parts

    if len(parts) <= 1:
        return parts[0] if parts else "unknown"

    return parts[0]