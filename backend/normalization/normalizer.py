from ..schemas.finding import Finding
from .deduplication import deduplicate_findings


def normalize_findings(findings: list[Finding]) -> list[Finding]:
    """
    Convert raw scanner output into a clean canonical set of findings.
    """

    normalized: list[Finding] = []

    for finding in findings:
        # Normalize strings.
        if finding.algorithm:
            finding.algorithm = finding.algorithm.strip()

        if finding.library:
            finding.library = finding.library.strip()

        if finding.asset_path:
            finding.asset_path = finding.asset_path.replace("\\", "/")

        normalized.append(finding)

    return deduplicate_findings(normalized)