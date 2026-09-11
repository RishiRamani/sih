from backend.cbom.generator import generate_cbom
from backend.schemas.finding import Finding
from backend.cbom.serializer import serialize_cbom

def test_findings_for_same_component_are_aggregated() -> None:
    findings = [
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSA",
            key_size=2048,
            asset_path="src/auth.py",
            line_start=42,
            detection_method="ast",
            confidence=0.95,
            evidence="RSA_sign(...)",
        ),
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSA",
            key_size=2048,
            asset_path="src/payment.py",
            line_start=91,
            detection_method="api",
            confidence=0.90,
            evidence="RSA_private_encrypt(...)",
        ),
    ]

    cbom = generate_cbom(findings)

    assert len(cbom.components) == 1

    component = cbom.components[0]


    assert (
        component.crypto_properties.algorithm_properties.algorithm_family
        == "RSA"
    )

    assert (
        component.crypto_properties.algorithm_properties.parameter_set_identifier
        == "2048"
    )
    
    assert len(component.properties["ecdAT:sourceFindings"]) == 2


def test_serialize_cbom() -> None:
    findings = [
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSA",
            key_size=2048,
            asset_path="src/auth.py",
            line_start=42,
            detection_method="ast",
            confidence=0.95,
            evidence="RSA_sign(...)",
        )
    ]

    cbom = generate_cbom(findings)

    serialized = serialize_cbom(cbom)

    assert '"bomFormat": "CycloneDX"' in serialized
    assert '"specVersion": "1.7"' in serialized
    assert '"type": "cryptographic-asset"' in serialized
    assert '"assetType": "algorithm"' in serialized
    assert '"algorithmFamily": "RSA"' in serialized
    assert '"parameterSetIdentifier": "2048"' in serialized