"""
Classical (pre-quantum) risk assessment.

Answers: is this algorithm broken or weak TODAY, by classical computers?
This is independent of quantum risk. Eg: MD5 is broken classically; RSA-2048 is not.
"""

from typing import Any


def assess_classical_risk(
    algorithm_name: str, key_size: int | None = None, mode: str | None = None
) -> dict[str, Any]:
    """
    Returns:
      {
        "classical_status": "BROKEN" | "WEAK" | "ACCEPTABLE" | "STRONG" | "UNKNOWN",
        "classical_reasons": [...],
        "classical_risk_score": 0..100
      }
    """
    # TO-DO (Day 2): implement rules from crypto_kb.yaml
    return {
        "classical_status": "UNKNOWN",
        "classical_reasons": ["Not yet implemented"],
        "classical_risk_score": 0,
    }