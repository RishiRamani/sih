import hashlib

from ..schemas.finding import Finding


def finding_fingerprint(finding: Finding) -> str:
    """
    Generate a deterministic identity for the underlying cryptographic
    artefact.

    Detection method is intentionally excluded because multiple scanners
    may independently discover the same artefact.
    """

    parts = [
        finding.artifact_type,
        finding.primitive_type or "",
        finding.algorithm or "",
        finding.variant or "",
        str(finding.key_size or ""),
        finding.library or "",
        finding.library_version or "",
        finding.asset_path,
        str(finding.line_start or ""),
        str(finding.line_end or ""),
    ]

    raw = "|".join(parts)

    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _same_usage_region(a: Finding, b: Finding) -> bool:
    """
    Determine whether two findings likely describe the same crypto usage.

    This is intentionally conservative:
    - same file
    - same algorithm
    - same primitive type
    - line numbers within 5 lines
    """
    if a.asset_path != b.asset_path:
        return False

    if a.algorithm != b.algorithm:
        return False

    if a.primitive_type != b.primitive_type:
        return False

    if a.line_start is None or b.line_start is None:
        return False

    return abs(a.line_start - b.line_start) <= 5


def _merge_findings(existing: Finding, finding: Finding) -> None:
    """
    Merge a duplicate/overlapping detection into an existing finding.
    """

    # Keep the strongest detection attributes.
    if finding.confidence > existing.confidence:
        existing.confidence = finding.confidence
        existing.detection_method = finding.detection_method

        if finding.library:
            existing.library = finding.library

        if finding.library_version:
            existing.library_version = finding.library_version

        if finding.key_size is not None:
            existing.key_size = finding.key_size

        if finding.variant:
            existing.variant = finding.variant

    # Preserve the broadest observed source range.
    if finding.line_start is not None:
        if existing.line_start is None:
            existing.line_start = finding.line_start
        else:
            existing.line_start = min(existing.line_start, finding.line_start)

    if finding.line_end is not None:
        if existing.line_end is None:
            existing.line_end = finding.line_end
        else:
            existing.line_end = max(existing.line_end, finding.line_end)

    # Preserve all detection methods.
    methods = existing.metadata.setdefault(
        "detection_methods",
        [existing.detection_method],
    )

    incoming_methods = finding.metadata.get(
        "detection_methods",
        [finding.detection_method],
    )

    for method in incoming_methods:
        if method not in methods:
            methods.append(method)

    # ALWAYS merge distinct evidence, regardless of confidence.
    evidence_values: list[str] = []

    if existing.evidence:
        evidence_values.extend(
            value.strip()
            for value in existing.evidence.split("\n---\n")
            if value.strip()
        )

    if finding.evidence:
        incoming_evidence = finding.evidence.strip()
        if incoming_evidence and incoming_evidence not in evidence_values:
            evidence_values.append(incoming_evidence)

    existing.evidence = "\n---\n".join(evidence_values)

    # Merge metadata without destroying existing fields.
    for key, value in finding.metadata.items():
        if key == "detection_methods":
            continue

        if key not in existing.metadata:
            existing.metadata[key] = value

def deduplicate_findings(findings: list[Finding]) -> list[Finding]:
    """
    Remove duplicate findings while preserving discovery order.

    Exact duplicates are merged first using the deterministic fingerprint.
    Then nearby detections of the same crypto usage are collapsed.
    """

    unique: dict[str, Finding] = {}

    # Pass 1: exact fingerprint duplicates.
    for finding in findings:
        fingerprint = finding_fingerprint(finding)
        existing = unique.get(fingerprint)

        if existing is None:
            finding.metadata.setdefault(
                "detection_methods",
                [finding.detection_method],
            )
            unique[fingerprint] = finding
            continue

        _merge_findings(existing, finding)

    # Pass 2: nearby detections that likely refer to the same usage.
    collapsed: list[Finding] = []

    for finding in unique.values():
        existing = next(
            (
                candidate
                for candidate in collapsed
                if _same_usage_region(candidate, finding)
            ),
            None,
        )

        if existing is None:
            collapsed.append(finding)
        else:
            _merge_findings(existing, finding)

    return collapsed