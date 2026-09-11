from backend.cbom.generator import generate_cbom
from backend.schemas.finding import Finding
from backend.cbom.serializer import serialize_cbom
from backend.cbom.serializer import serialize_cbom
from backend.cbom.validator import validate_cbom_json

def test_findings_for_same_component_are_aggregated() -> None:
    findings = [
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSASSA-PKCS1",
            key_size=2048,
            asset_path="src/auth.py",
            line_start=42,
            detection_method="ast",
            confidence=0.95,
            evidence="RSA_sign(...)",
        ),
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSASSA-PKCS1",
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
        == "RSASSA-PKCS1"
    )

    assert (
        component.crypto_properties.algorithm_properties.parameter_set_identifier
        == "2048"
    )
    
    source_findings = [
        prop
        for prop in component.properties
        if prop.name == "ecdat:sourceFinding"
    ]

    assert len(source_findings) == 2


def test_serialize_cbom() -> None:
    findings = [
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSASSA-PKCS1",
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
    assert '"algorithmFamily": "RSASSA-PKCS1"' in serialized
    assert '"parameterSetIdentifier": "2048"' in serialized

def test_cbom_is_cyclonedx_1_7_valid() -> None:
    findings = [
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSASSA-PKCS1",
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

    errors = validate_cbom_json(serialized)

    assert errors == [], "\n".join(errors)