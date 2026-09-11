from uuid import uuid4

from ..normalization.deduplication import finding_fingerprint
from ..schemas.cbom import (
    AlgorithmProperties,
    CBOM,
    CBOMComponent,
    CBOMProperty,
    CryptoProperties,
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
                    "cryptoProperties": CryptoProperties(
                        asset_type="algorithm",
                        algorithm_properties=_algorithm_properties(
                            finding
                        ),
                    ),
                    "properties": [
                        CBOMProperty(
                            name="ecdat:assetPath",
                            value=finding.asset_path,
                        ),
                        CBOMProperty(
                            name="ecdat:detectionMethod",
                            value=finding.detection_method,
                        ),
                        CBOMProperty(
                            name="ecdat:confidence",
                            value=str(finding.confidence),
                        ),
                        CBOMProperty(
                            name="ecdat:sourceFinding",
                            value=finding_id,
                        ),
                    ],
                }
            )

            continue

        component = components_by_id[component_id]

        source_finding_exists = any(
            prop.name == "ecdat:sourceFinding"
            and prop.value == finding_id
            for prop in component.properties
        )

        if not source_finding_exists:
            component.properties.append(
                CBOMProperty(
                    name="ecdat:sourceFinding",
                    value=finding_id,
                )
            )

        asset_path_exists = any(
            prop.name == "ecdat:assetPath"
            and prop.value == finding.asset_path
            for prop in component.properties
        )

        if not asset_path_exists:
            component.properties.append(
                CBOMProperty(
                    name="ecdat:assetPath",
                    value=finding.asset_path,
                )
            )

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