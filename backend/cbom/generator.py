from uuid import uuid4

from ..normalization.deduplication import finding_fingerprint
from ..schemas.cbom import (
    AlgorithmProperties,
    CBOM,
    CBOMComponent,
)
from ..schemas.finding import Finding
from .identifiers import component_fingerprint


def generate_cbom(findings: list[Finding]) -> CBOM:
    """
    Convert normalized ECDAT findings into a CycloneDX 1.7 CBOM.
    """

    components_by_id: dict[str, CBOMComponent] = {}

    for finding in findings:
        component_id = component_fingerprint(finding)
        finding_id = finding_fingerprint(finding)

        if component_id not in components_by_id:
            components_by_id[component_id] = CBOMComponent(
                **{
                    "bom-ref": component_id,
                    "name": (
                        finding.algorithm
                        or finding.library
                        or finding.artifact_type
                    ),
                    "cryptoProperties": {
                        "asset_type": "algorithm",
                        "algorithm_properties": _algorithm_properties(
                            finding
                        ),
                    },
                    "properties": {
                        "ecdAT:assetPath": finding.asset_path,
                        "ecdAT:detectionMethod": finding.detection_method,
                        "ecdAT:confidence": finding.confidence,
                        "ecdAT:sourceFindings": [finding_id],
                    },
                }
            )

            continue

        component = components_by_id[component_id]

        # Keep all source findings.
        existing_source = component.properties.get(
            "ecdAT:sourceFindings",
            [],
        )

        if finding_id not in existing_source:
            existing_source.append(finding_id)

        component.properties["ecdAT:sourceFindings"] = existing_source

    return CBOM(
        serialNumber=f"urn:uuid:{uuid4()}",
        components=list(components_by_id.values()),
        dependencies=[],
    )


def _algorithm_properties(
    finding: Finding,
) -> AlgorithmProperties:
    """
    Map ECDAT's normalized finding into CycloneDX
    algorithm properties.
    """

    return AlgorithmProperties(
        primitive=finding.primitive_type,
        algorithm_family=finding.algorithm,
        parameter_set_identifier=(
            str(finding.key_size)
            if finding.key_size is not None
            else finding.variant
        ),
    )