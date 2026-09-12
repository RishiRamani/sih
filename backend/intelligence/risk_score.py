"""
Combines classical risk, quantum risk, Mosca assessment, and business context
into a single severity score and category.

Deterministic. Documented weights. No randomness.
"""

from typing import Any

# Weights — documented so the risk formula is explainable.
WEIGHTS = {
    "classical": 0.35, # Broken today is bad today.
    "quantum": 0.30, # The tool's primary purpose.
    "mosca": 0.20, # If the sum exceeds the horizon, you're already late.
    "criticality": 0.15, # User context.
}

# Mapping from business criticality to a 0..100 score.
CRITICALITY_SCORES = {
    "CRITICAL": 100,
    "HIGH": 75,
    "MEDIUM": 50,
    "LOW": 25,
    None: 50,  # unknown criticality defaults to MEDIUM weight, but flagged
}

# Mapping from Mosca urgency to a 0..100 score.
MOSCA_URGENCY_SCORES = {
    "IMMEDIATE": 100,
    "PLANNED": 50,
    "MONITOR": 20,
    "UNKNOWN": 0,
}

# Severity thresholds — inclusive lower bounds.
SEVERITY_THRESHOLDS = [
    (85, "CRITICAL"),
    (65, "HIGH"),
    (40, "MEDIUM"),
    (20, "LOW"),
    (0,  "INFORMATIONAL"),
]

# Confidence threshold below which severity is capped.
CONFIDENCE_CAP_THRESHOLD = 0.4

def _severity_from_score(score: float) -> str:
    for threshold, label in SEVERITY_THRESHOLDS:
        if score >= threshold:
            return label
    return "INFORMATIONAL"

def compute_risk(
    classical: dict[str, Any],
    quantum: dict[str, Any],
    mosca: dict[str, Any],
    business_criticality: str | None = None,
    detection_confidence: float = 0.7,
) -> dict[str, Any]:
    """
    Combine risk signals into a single severity assessment.

    Returns:
      {
        "risk_score": float,          # 0..100
        "severity": str,              # CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL
        "risk_factors": [             # for UI explainability
            {"factor": str, "weight": float, "score": int, "contribution": float},
            ...
        ],
        "explanation": str,
      }
    """
    classical_score = classical.get("classical_risk_score", 0)
    quantum_score = quantum.get("quantum_risk_score", 0)

    mosca_urgency = mosca.get("migration_urgency", "UNKNOWN")
    mosca_score = MOSCA_URGENCY_SCORES.get(mosca_urgency, 0)

    criticality_score = CRITICALITY_SCORES.get(business_criticality, 50)

    # Weighted sum
    factors = [
        {
            "factor": "classical",
            "weight": WEIGHTS["classical"],
            "score": classical_score,
            "contribution": classical_score * WEIGHTS["classical"],
        },
        {
            "factor": "quantum",
            "weight": WEIGHTS["quantum"],
            "score": quantum_score,
            "contribution": quantum_score * WEIGHTS["quantum"],
        },
        {
            "factor": "mosca",
            "weight": WEIGHTS["mosca"],
            "score": mosca_score,
            "contribution": mosca_score * WEIGHTS["mosca"],
        },
        {
            "factor": "criticality",
            "weight": WEIGHTS["criticality"],
            "score": criticality_score,
            "contribution": criticality_score * WEIGHTS["criticality"],
        },
    ]

    risk_score = sum(f["contribution"] for f in factors)
    raw_severity = _severity_from_score(risk_score)

    # If the algorithm is broken by classical, severity is atleast HIGH.
    classical_floored = False
    if classical.get("classical_status") == "BROKEN" and raw_severity in (
        "LOW", "MEDIUM", "INFORMATIONAL"
    ):
        raw_severity = "HIGH"
        classical_floored = True  # not subject to the confidence cap

    # If the algorithm is broken by quantum, severity is atleast MEDIUM.
    quantum_floored = False
    if quantum.get("quantum_status") == "BROKEN" and raw_severity in (
        "LOW", "INFORMATIONAL"
    ):
        raw_severity = "MEDIUM"
        quantum_floored = True

    severity = raw_severity
    confidence_capped = False
    # Confidence cap — a low-confidence detection cannot be CRITICAL or HIGH
    # until corroborated by stronger evidence.
    if detection_confidence < CONFIDENCE_CAP_THRESHOLD:
        if severity in ("CRITICAL", "HIGH"):
            severity = "MEDIUM"
            confidence_capped = True

    # Build explanation
    top_factor = max(factors, key=lambda f: f["contribution"])
    explanation_parts = [
        f"Risk score {risk_score:.1f} derived from weighted factors. "
        f"Dominant factor: {top_factor['factor']} "
        f"(score {top_factor['score']}, contribution {top_factor['contribution']:.1f})."
    ]

    if business_criticality is None:
        explanation_parts.append(
            "Business criticality not provided; assumed MEDIUM for scoring."
        )

    if detection_confidence < CONFIDENCE_CAP_THRESHOLD:
        explanation_parts.append(
            f"Detection confidence is low ({detection_confidence:.2f}); "
            "severity capped at MEDIUM pending stronger evidence."
        )

    if classical_floored:
        explanation_parts.append(
            "Algorithm is classically broken; severity floored at HIGH."
        )
    if quantum_floored:
        explanation_parts.append(
            "Algorithm is quantum-vulnerable; severity floored at MEDIUM."
        )
    if confidence_capped:
        explanation_parts.append(
            f"Detection confidence is low ({detection_confidence:.2f}); "
            "reported severity capped pending confirmation."
        )

    return {
        "risk_score": round(risk_score, 1),
        "severity": severity, # post-cap
        "raw_severity": raw_severity, # pre-cap
        "confidence_capped": confidence_capped, # whether was severity capped due to low confidence
        "risk_factors": factors,
        "explanation": " ".join(explanation_parts),
    }