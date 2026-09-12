"""
Classical (pre-quantum) risk assessment.

Answers: is this algorithm broken or weak TODAY, on classical computers?
Independent of quantum risk.

Reads from the versioned knowledge base (data/crypto_kb.yaml).
Does not hardcode algorithm knowledge.
"""

from typing import Any
from .crypto_kb import lookup_algorithm


# Severity mapping for classical statuses.
_STATUS_SCORES: dict[str, int] = {
    "BROKEN": 95,
    "WEAK": 70,
    "WEAK_BELOW_THRESHOLD": 70,   # refined by key_size below
    "ACCEPTABLE": 25,
    "ACCEPTABLE_ABOVE_256": 15,
    "STRONG": 5,
    "UNKNOWN": 0,
}

def _unknown_result(reason: str) -> dict[str, Any]:
    return {
        "classical_status": "UNKNOWN",
        "classical_reasons": [reason],
        "classical_risk_score": 0,
    }

def _score_for(status: str) -> int:
    return _STATUS_SCORES.get(status, 0)

def assess_classical_risk(
    algorithm_name: str | None,
    key_size: int | None = None,
    mode: str | None = None,
) -> dict[str, Any]:
    
    """
    Assess the classical (pre-quantum) cryptographic strength of an algorithm.

    Returns:
      {
        "classical_status": "BROKEN" | "WEAK" | "ACCEPTABLE" | "STRONG" | "UNKNOWN",
        "classical_reasons": [str, ...],
        "classical_risk_score": int between 0..100, higher = worse
      }

    Unknown inputs produce UNKNOWN, not a default "safe".
    """

    if not algorithm_name:
        return _unknown_result("No algorithm identified in finding")

    entry = lookup_algorithm(algorithm_name)
    if entry is None:
        return _unknown_result(
            f"Algorithm '{algorithm_name}' is not in the knowledge base"
        )

    classical = entry.get("classical_status", {})
    base_status = classical.get("status", "UNKNOWN")
    base_reason = classical.get("reason", "")

    reasons: list[str] = []
    if base_reason:
        reasons.append(base_reason)

    # ---------------------------------------------------------------
    # Key-size-dependent status
    # ---------------------------------------------------------------
    if base_status in ("WEAK_BELOW_THRESHOLD", "ACCEPTABLE_ABOVE_256"):
        thresholds = entry.get("key_size_thresholds", {})
        weak_below = thresholds.get("weak_below")
        recommended = thresholds.get("recommended")

        if key_size is None:
            return _unknown_result(
                f"Key size not observed for {algorithm_name}; "
                "cannot assess classical strength"
            )

        if weak_below is not None and key_size < weak_below:
            resolved_status = "WEAK"
            reasons.append(
                f"{algorithm_name}-{key_size} is below the recommended "
                f"minimum of {weak_below} bits"
            )
        elif recommended is not None and key_size >= recommended:
            resolved_status = "STRONG"
        else:
            resolved_status = "ACCEPTABLE"
    else:
        resolved_status = base_status

    # ---------------------------------------------------------------
    # Mode-based downgrade
    # ECB mode leaks plaintext structure regardless of algorithm strength.
    # ---------------------------------------------------------------
    if mode and mode.upper() == "ECB":
        reasons.append(
            "ECB mode is used, which leaks plaintext structure"
        )
        # Downgrade one tier
        downgrade = {
            "STRONG": "ACCEPTABLE",
            "ACCEPTABLE": "WEAK",
            "ACCEPTABLE_ABOVE_256": "WEAK",
            "WEAK": "WEAK",
            "BROKEN": "BROKEN",
            "UNKNOWN": "UNKNOWN",
        }
        resolved_status = downgrade.get(resolved_status, resolved_status)

    score = _score_for(resolved_status)

    return {
        "classical_status": resolved_status,
        "classical_reasons": reasons,
        "classical_risk_score": score,
    }