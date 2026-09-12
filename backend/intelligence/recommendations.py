"""
Purpose-aware migration recommendation engine.

MUST use primitive_type, not just algorithm_name.
RSA for KEY_ESTABLISHMENT -> ML-KEM
RSA for DIGITAL_SIGNATURE  -> ML-DSA

Never recommend experimental algorithms as if they were finalized.
Never recommend a KEM for a signature or vice versa.
"""

from typing import Any
from .crypto_kb import get_recommendation, lookup_algorithm

# Migration priority derived from risk severity.
PRIORITY_BY_SEVERITY = {
    "CRITICAL": "IMMEDIATE",
    "HIGH": "IMMEDIATE",
    "MEDIUM": "PLANNED",
    "LOW": "MONITOR",
    "INFORMATIONAL": "NONE",
}

def generate_recommendation(
    algorithm_name: str | None,
    primitive_type: str | None,
    quantum_status: str,
    classical_status: str,
    severity: str = "INFORMATIONAL",
) -> dict[str, Any]:
    """
    Produce a migration recommendation for a finding.

    Returns:
      {
        "direction": "KEM" | "SIGNATURE" | "HASH" | "SYMMETRIC" | "MANUAL_REVIEW",
        "candidate_algorithms": [str, ...],
        "hybrid_path": str | None,
        "migration_priority": "IMMEDIATE" | "PLANNED" | "MONITOR" | "NONE",
        "rationale": str,
      }
    """
    if not algorithm_name:
        return _manual_review(
            "No algorithm identified; manual cryptographic review required.",
            severity,
        )

    if not primitive_type:
        return _manual_review(
            f"Algorithm '{algorithm_name}' detected but cryptographic "
            "purpose could not be determined. Manual review required to "
            "select an appropriate migration target.",
            severity,
        )

    kb_entry = lookup_algorithm(algorithm_name)
    if kb_entry is None:
        return _manual_review(
            f"Algorithm '{algorithm_name}' is not in the knowledge base. "
            "Manual cryptographic review required.",
            severity,
        )

    rec = get_recommendation(algorithm_name, primitive_type)
    if rec is None:
        return _manual_review(
            f"No recommendation mapping for '{algorithm_name}' used as "
            f"'{primitive_type}'. Manual review required.",
            severity,
        )

    direction = rec.get("direction", "MANUAL_REVIEW")
    candidates = rec.get("candidates", [])
    hybrid = rec.get("hybrid")
    note = rec.get("note")

    priority = PRIORITY_BY_SEVERITY.get(severity, "NONE")

    # Build rationale
    rationale_parts = []
    if quantum_status == "BROKEN":
        rationale_parts.append(
            f"{algorithm_name} is broken by Shor's algorithm and must be "
            f"migrated for post-quantum security."
        )
    elif quantum_status == "WEAKENED":
        rationale_parts.append(
            f"{algorithm_name} is weakened by Grover's algorithm."
        )
    elif quantum_status == "RESILIENT":
        rationale_parts.append(
            f"{algorithm_name} retains adequate post-quantum margin."
        )

    if classical_status == "BROKEN":
        rationale_parts.append(
            f"It is also classically broken and should be replaced "
            f"regardless of quantum concerns."
        )
    elif classical_status == "WEAK":
        rationale_parts.append(
            f"It is also classically weak and should be upgraded."
        )

    if note:
        rationale_parts.append(note)

    if candidates:
        rationale_parts.append(
            f"Recommended direction: {direction} using "
            f"{', '.join(candidates)}."
        )
    if hybrid:
        rationale_parts.append(f"Hybrid path: {hybrid}.")

    return {
        "direction": direction,
        "candidate_algorithms": candidates,
        "hybrid_path": hybrid,
        "migration_priority": priority,
        "rationale": " ".join(rationale_parts) or "No rationale available.",
    }


def _manual_review(reason: str, severity: str) -> dict[str, Any]:
    return {
        "direction": "MANUAL_REVIEW",
        "candidate_algorithms": [],
        "hybrid_path": None,
        "migration_priority": PRIORITY_BY_SEVERITY.get(severity, "NONE"),
        "rationale": reason,
    }