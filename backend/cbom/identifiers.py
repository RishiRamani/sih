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

def cbom_component_type(finding: Finding) -> str:
    """
    Map an ECDAT finding to its CycloneDX component type.
    """

    if finding.artifact_type == "dependency":
        return "library"

    return "cryptographic-asset"


def crypto_asset_type(finding: Finding) -> str | None:
    """
    Map an ECDAT crypto finding to a CycloneDX crypto asset type.
    """

    mapping = {
        "crypto_algorithm": "algorithm",
        "certificate": "certificate",
        "protocol": "protocol",
        "crypto_material": "related-crypto-material",
    }

    return mapping.get(finding.artifact_type)