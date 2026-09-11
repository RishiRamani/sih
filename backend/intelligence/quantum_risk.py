"""
Quantum risk assessment.

Answers: is this algorithm broken or weakened by a quantum computer?
BROKEN (Shor): RSA, ECC, DH — the quantum computer recovers the private key.
WEAKENED (Grover): AES, hashes — effective security is halved, not zeroed.
RESILIENT: adequate post-quantum margin.
"""

from typing import Any


def assess_quantum_risk(
    algorithm_name: str,
    primitive_type: str | None = None,
    key_size: int | None = None,
) -> dict[str, Any]:
    """
    Returns:
      {
        "quantum_status": "BROKEN" | "WEAKENED" | "RESILIENT" | "UNKNOWN",
        "quantum_reasons": [...],
        "quantum_risk_score": 0..100
      }
    """
    # TO-DO (Day 2): implement using crypto_kb.yaml quantum_status
    return {
        "quantum_status": "UNKNOWN",
        "quantum_reasons": ["Not yet implemented"],
        "quantum_risk_score": 0,
    }