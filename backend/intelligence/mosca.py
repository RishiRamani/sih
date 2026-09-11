"""
Mosca's inequality implementation.

Rule: data_lifetime + migration_time > crqc_arrival => if true then at risk.

CRQC arrival is a CONFIGURABLE SCENARIO, not a fact.
Default: 2035 (configurable via environment or scan config).
"""

from typing import Any

DEFAULT_CRQC_ARRIVAL_YEARS = 12  # from 2026, i.e. ~2038


def assess_mosca(
    data_lifetime_years: float | None,
    migration_time_years: float | None,
    crqc_arrival_years: float = DEFAULT_CRQC_ARRIVAL_YEARS,
    quantum_status: str = "UNKNOWN",
) -> dict[str, Any]:
    """
    Returns:
      {
        "mosca_status": "AT_RISK" | "OK" | "NOT_APPLICABLE" | "NOT_QUANTIFIABLE",
        "migration_deadline_years": float | None,
        "migration_urgency": "IMMEDIATE" | "PLANNED" | "MONITOR" | "UNKNOWN",
        "explanation": str
      }
    """
    # TO-DO (Day 3): implement
    return {
        "mosca_status": "NOT_QUANTIFIABLE",
        "migration_deadline_years": None,
        "migration_urgency": "UNKNOWN",
        "explanation": "Not yet implemented",
    }