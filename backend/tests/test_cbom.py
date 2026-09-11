from backend.cbom.generator import generate_cbom
from backend.schemas.finding import Finding
from backend.cbom.serializer import serialize_cbom
from backend.cbom.serializer import serialize_cbom
from backend.cbom.validator import validate_cbom_json
from backend.cbom.identifiers import component_fingerprint

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

    crypto_components = [
        component
        for component in cbom.components
        if component.type == "cryptographic-asset"
    ]

    assert len(crypto_components) == 1

    component = crypto_components[0]

    application_components = [
        component
        for component in cbom.components
        if component.type == "application"
    ]

    assert len(application_components) == 1

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

def test_application_depends_on_library() -> None:
    findings = [
        Finding(
            artifact_type="dependency",
            library="OpenSSL",
            library_version="3.2",
            asset_path="payment-service/requirements.txt",
            detection_method="dependency",
            confidence=0.95,
        ),
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSASSA-PKCS1",
            key_size=2048,
            library="OpenSSL",
            library_version="3.2",
            asset_path="payment-service/src/auth.py",
            line_start=42,
            detection_method="ast",
            confidence=0.95,
            evidence="RSA_sign(...)",
        ),
    ]

    cbom = generate_cbom(findings)

    application_ref = "application|payment-service"
    library_ref = "library|OpenSSL|3.2"
    crypto_ref = component_fingerprint(findings[1])

    application_dependency = next(
        dependency
        for dependency in cbom.dependencies
        if dependency.ref == application_ref
    )

    library_dependency = next(
        dependency
        for dependency in cbom.dependencies
        if dependency.ref == library_ref
    )

    assert library_ref in application_dependency.depends_on
    assert crypto_ref in library_dependency.provides

def test_serialized_cbom_contains_dependency_graph() -> None:
    findings = [
        Finding(
            artifact_type="dependency",
            library="OpenSSL",
            library_version="3.2",
            asset_path="payment-service/requirements.txt",
            detection_method="dependency",
            confidence=0.95,
        ),
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSASSA-PKCS1",
            key_size=2048,
            library="OpenSSL",
            library_version="3.2",
            asset_path="payment-service/src/auth.py",
            line_start=42,
            detection_method="ast",
            confidence=0.95,
            evidence="RSA_sign(...)",
        ),
    ]

    cbom = generate_cbom(findings)
    serialized = serialize_cbom(cbom)

    assert '"dependsOn"' in serialized
    assert '"provides"' in serialized
    assert '"application|payment-service"' in serialized
    assert '"library|OpenSSL|3.2"' in serialized

    crypto_ref = component_fingerprint(findings[1])
    assert f'"{crypto_ref}"' in serialized