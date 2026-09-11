from ..schemas.finding import Finding
from pathlib import PurePosixPath


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

def library_fingerprint(
    library: str,
    version: str | None = None,
) -> str:
    """
    Generate a stable BOM reference for a library.
    """

    version_part = version or "unknown"

    return f"library|{library}|{version_part}"

def application_fingerprint(finding: Finding) -> str:
    """
    Generate a stable BOM reference for the application/component
    that owns the finding.
    """

    if finding.component_id:
        return f"application|{finding.component_id}"

    path = PurePosixPath(finding.asset_path)

    if not path.parts:
        return "application|unknown"

    return f"application|{path.parts[0]}"