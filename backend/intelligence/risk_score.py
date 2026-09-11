"""
Combines classical risk, quantum risk, Mosca assessment, and business context
into a single severity score and category.
"""

from typing import Any


def compute_risk(
    classical: dict[str, Any],
    quantum: dict[str, Any],
    mosca: dict[str, Any],
    business_criticality: str = "MEDIUM",
    detection_confidence: str = "MEDIUM",
) -> dict[str, Any]:
    """
    Returns:
      {
        "risk_score": 0..100,
        "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL",
        "risk_factors": [...],
        "explanation": str
      }
    """
    # TO-DO (Day 3): implement
    return {
        "risk_score": 0,
        "severity": "INFORMATIONAL",
        "risk_factors": [],
        "explanation": "Not yet implemented",
    }