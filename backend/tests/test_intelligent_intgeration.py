from backend.intelligence.evaluator import assess_finding
from backend.schemas.finding import Finding


def test_rsa_signature_gets_quantum_risk_and_recommendation() -> None:
    finding = Finding(
        artifact_type="source",
        algorithm="RSA",
        primitive_type="signature",
        key_size=2048,
        asset_path="src/auth.py",
        detection_method="TEST",
        confidence=1.0,
    )

    result = assess_finding(finding, finding_index=0)

    assert result.finding_index == 0
    assert result.risk_assessment.quantum["quantum_status"] == "BROKEN"
    assert result.recommendation.direction == "SIGNATURE"
    assert "ML-DSA-65" in result.recommendation.candidate_algorithms


def test_aes_256_gcm_gets_quantum_resilient_assessment() -> None:
    finding = Finding(
        artifact_type="source",
        algorithm="AES",
        primitive_type="symmetric",
        key_size=256,
        asset_path="src/crypto.py",
        detection_method="TEST",
        confidence=1.0,
        metadata={"mode": "GCM"},
    )

    result = assess_finding(finding, finding_index=0)

    assert result.risk_assessment.quantum["quantum_status"] == "RESILIENT"
    assert result.risk_assessment.mosca["mosca_status"] == "NOT_APPLICABLE"


def test_ambiguous_rsa_usage_requires_manual_review() -> None:
    finding = Finding(
        artifact_type="source",
        algorithm="RSA",
        primitive_type="asymmetric",
        key_size=2048,
        asset_path="src/crypto.py",
        detection_method="TEST",
        confidence=1.0,
    )

    result = assess_finding(finding, finding_index=0)

    assert result.recommendation.direction == "MANUAL_REVIEW"


def test_unknown_algorithm_remains_unknown() -> None:
    finding = Finding(
        artifact_type="source",
        algorithm="SomeFutureCrypto",
        primitive_type="signature",
        asset_path="src/future.py",
        detection_method="TEST",
        confidence=1.0,
    )

    result = assess_finding(finding, finding_index=0)

    assert (
        result.risk_assessment.classical["classical_status"]
        == "UNKNOWN"
    )
    assert (
        result.risk_assessment.quantum["quantum_status"]
        == "UNKNOWN"
    )