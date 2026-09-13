from ..schemas.finding import Finding
from ..schemas.intelligence import IntelligenceAssessment
from ..schemas.recommendation import RecommendationAssessment
from ..schemas.risk import RiskAssessment

from .classical_risk import assess_classical_risk
from .mosca import assess_mosca
from .quantum_risk import assess_quantum_risk
from .recommendations import generate_recommendation
from .risk_score import compute_risk


def _recommendation_primitive(finding: Finding) -> str | None:
    """Map scanner primitive terminology to crypto_kb recommendation keys."""

    # HMAC is emitted by the current source scanner as primitive_type="hash",
    # but the KB correctly models HMAC as a MAC.
    if finding.algorithm in {"HMAC", "Poly1305"}:
        return "MAC"

    mapping = {
        "signature": "DIGITAL_SIGNATURE",
        "hash": "HASH",
        "symmetric": "SYMMETRIC_ENCRYPTION",
        "key_exchange": "KEY_ESTABLISHMENT",
        "key_agreement": "KEY_ESTABLISHMENT",
    }

    return mapping.get(finding.primitive_type)


def assess_finding(
    finding: Finding,
    finding_index: int,
    business_criticality: str | None = None,
    data_lifetime_years: float | None = None,
    migration_time_years: float | None = None,
    crqc_arrival_years: float | None = None,
) -> IntelligenceAssessment:
    mode = finding.metadata.get("mode")

    classical = assess_classical_risk(
        algorithm_name=finding.algorithm,
        key_size=finding.key_size,
        mode=mode,
    )

    quantum = assess_quantum_risk(
        algorithm_name=finding.algorithm,
        primitive_type=finding.primitive_type,
        key_size=finding.key_size,
    )

    mosca_kwargs = {
        "data_lifetime_years": data_lifetime_years,
        "migration_time_years": migration_time_years,
        "quantum_status": quantum.get("quantum_status", "UNKNOWN"),
    }

    if crqc_arrival_years is not None:
        mosca_kwargs["crqc_arrival_years"] = crqc_arrival_years

    mosca = assess_mosca(**mosca_kwargs)

    risk = compute_risk(
        classical=classical,
        quantum=quantum,
        mosca=mosca,
        business_criticality=business_criticality,
        detection_confidence=finding.confidence,
    )

    recommendation = generate_recommendation(
        algorithm_name=finding.algorithm,
        primitive_type=_recommendation_primitive(finding),
        quantum_status=quantum.get("quantum_status", "UNKNOWN"),
        classical_status=classical.get("classical_status", "UNKNOWN"),
        severity=risk.get("severity", "INFORMATIONAL"),
    )

    return IntelligenceAssessment(
        finding_index=finding_index,
        algorithm=finding.algorithm,
        primitive_type=finding.primitive_type,
        risk_assessment=RiskAssessment(
            classical=classical,
            quantum=quantum,
            mosca=mosca,
            risk=risk,
        ),
        recommendation=RecommendationAssessment(
            direction=recommendation.get("direction", "MANUAL_REVIEW"),
            candidate_algorithms=recommendation.get(
                "candidate_algorithms", []
            ),
            hybrid_path=recommendation.get("hybrid_path"),
            migration_priority=recommendation.get(
                "migration_priority",
                "NONE",
            ),
            reason=recommendation.get("reason", ""),
            rationale=recommendation.get("rationale", ""),
            effort=recommendation.get("effort", "UNKNOWN"),
            trade_offs=recommendation.get("trade_offs", ""),
        ),
    )


def assess_findings(
    findings: list[Finding],
    business_criticality: str | None = None,
    data_lifetime_years: float | None = None,
    migration_time_years: float | None = None,
    crqc_arrival_years: float | None = None,
) -> list[IntelligenceAssessment]:
    return [
        assess_finding(
            finding=finding,
            finding_index=index,
            business_criticality=business_criticality,
            data_lifetime_years=data_lifetime_years,
            migration_time_years=migration_time_years,
            crqc_arrival_years=crqc_arrival_years,
        )
        for index, finding in enumerate(findings)
    ]