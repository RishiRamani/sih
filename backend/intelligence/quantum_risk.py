"""
Quantum risk assessment.

Answers: is this algorithm broken or weakened by a quantum computer?

Two distinct threats:
  BROKEN   (Shor): RSA, ECC, DH, DSA, ECDSA, EdDSA. Private key recoverable.
  WEAKENED (Grover): AES, hashes. Effective security halved, not zeroed.
  RESILIENT: adequate post-quantum margin for the observed key size.

Reads from the versioned knowledge base. No hardcoded algorithm rules.
"""

from typing import Any
from intelligence.crypto_kb import lookup_algorithm

_STATUS_SCORES: dict[str, int] = {
    "BROKEN": 100,
    "WEAKENED": 50,
    "RESILIENT": 10,
    "UNKNOWN": 0,
}

def _unknown_result(reason: str) -> dict[str, Any]:
    return {
        "quantum_status": "UNKNOWN",
        "quantum_reasons": [reason],
        "quantum_risk_score": 0,
    }

def _score_for(status: str) -> int:
    return _STATUS_SCORES.get(status, 0)

def assess_quantum_risk(
    algorithm_name: str | None,
    primitive_type: str | None = None,
    key_size: int | None = None,
) -> dict[str, Any]:
    """
    Assess quantum vulnerability of an algorithm.

    Returns:
      {
        "quantum_status": "BROKEN" | "WEAKENED" | "RESILIENT" | "UNKNOWN",
        "quantum_reasons": [str, ...],
        "quantum_risk_score": int between 0..100, higher = worse
      }
    """
    if not algorithm_name:
        return _unknown_result("No algorithm identified in finding")

    entry = lookup_algorithm(algorithm_name)
    if entry is None:
        return _unknown_result(
            f"Algorithm '{algorithm_name}' not in knowledge base"
        )

    quantum = entry.get("quantum_status", {})
    base_status = quantum.get("status", "UNKNOWN")
    base_reason = quantum.get("reason", "")

    reasons: list[str] = []
    if base_reason:
        reasons.append(base_reason)

    # ---------------------------------------------------------------
    # Grover-affected algorithms may be upgraded to RESILIENT
    # if the observed key size provides adequate post-quantum margin.
    # ---------------------------------------------------------------
    resolved_status = base_status

    if base_status == "WEAKENED" and key_size is not None:
        # Symmetric 256-bit keys retain 128-bit post-quantum security
        # against Grover,which is considered adequate.
        if key_size >= 256:
            resolved_status = "RESILIENT"
            reasons.append(
                f"{algorithm_name}-{key_size} retains adequate "
                "post-quantum margin against Grover's algorithm"
            )
        else:
            reasons.append(
                f"{algorithm_name}-{key_size} is weakened by Grover's "
                "algorithm; consider increasing key size"
            )

    score = _score_for(resolved_status)

    return {
        "quantum_status": resolved_status,
        "quantum_reasons": reasons,
        "quantum_risk_score": score,
    }