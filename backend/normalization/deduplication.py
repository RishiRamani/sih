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


def deduplicate_findings(findings: list[Finding]) -> list[Finding]:
    """
    Remove duplicate findings while preserving discovery order.

    Multiple scanners may discover the same artefact. Their evidence,
    detection methods, and metadata are merged into one canonical finding.
    """

    unique: dict[str, Finding] = {}

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

        # Keep strongest confidence.
        if finding.confidence > existing.confidence:
            existing.confidence = finding.confidence

        # Preserve all detection methods.
        methods = existing.metadata.setdefault(
            "detection_methods",
            [existing.detection_method],
        )

        if finding.detection_method not in methods:
            methods.append(finding.detection_method)

        # Merge evidence.
        evidence_values = []

        if existing.evidence:
            evidence_values.append(existing.evidence)

        if finding.evidence and finding.evidence not in evidence_values:
            evidence_values.append(finding.evidence)

        existing.evidence = "\n---\n".join(evidence_values)

        # Merge metadata without destroying existing fields.
        existing.metadata.update(
            {
                key: value
                for key, value in finding.metadata.items()
                if key != "detection_methods"
            }
        )

    return list(unique.values())