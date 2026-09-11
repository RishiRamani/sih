from ..schemas.finding import Finding


def component_fingerprint(finding: Finding) -> str:
    """
    Generate a stable ID for a logical cryptographic component.
    """

    parts = [
        finding.artifact_type,
        finding.primitive_type or "",
        finding.algorithm or "",
        finding.variant or "",
        str(finding.key_size or ""),
        finding.library or "",
        finding.library_version or "",
    ]

    return "|".join(parts)