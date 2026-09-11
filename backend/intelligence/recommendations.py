"""
Purpose-aware migration recommendation engine.

MUST use primitive_type, not just algorithm_name.
RSA for KEY_ESTABLISHMENT -> ML-KEM
RSA for DIGITAL_SIGNATURE  -> ML-DSA
"""

from typing import Any


def generate_recommendation(
    algorithm_name: str,
    primitive_type: str,
    quantum_status: str,
    classical_status: str,
) -> dict[str, Any]:
    """
    Returns:
      {
        "direction": "KEM" | "SIGNATURE" | "HASH" | "SYMMETRIC" | "MANUAL_REVIEW",
        "candidate_algorithms": [...],
        "hybrid_path": str | None,
        "migration_priority": "IMMEDIATE" | "PLANNED" | "MONITOR" | "NONE",
        "rationale": str,
      }
    """
    # TO-DO (Day 3): implement using crypto_kb.yaml recommendation mapping
    return {
        "direction": "MANUAL_REVIEW",
        "candidate_algorithms": [],
        "hybrid_path": None,
        "migration_priority": "NONE",
        "rationale": "Not yet implemented",
    }