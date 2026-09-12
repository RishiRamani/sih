"""
Mosca's inequality implementation.

Rule: data_lifetime + migration_time > crqc_arrival => if true then at risk.

CRQC arrival is a CONFIGURABLE SCENARIO, not a fact.
Default: 2035 (configurable via environment or scan config).

Only applies to quantum-vulnerable algorithms. Symmetric algorithms
that are quantum-resilient have nothing to migrate to PQC, so Mosca
returns NOT_APPLICABLE for them.
"""

from typing import Any

# Configurable scenario. Overridable per scan.
DEFAULT_CRQC_ARRIVAL_YEARS = 12  # ~2038 from 2026

def assess_mosca(
    data_lifetime_years: float | None,
    migration_time_years: float | None, # Amount of time taken to migrate to a PQC.
    crqc_arrival_years: float = DEFAULT_CRQC_ARRIVAL_YEARS,
    quantum_status: str = "UNKNOWN",
) -> dict[str, Any]:
    """
    Assess migration urgency using Mosca's inequality.

    Returns:
      {
        "mosca_status": "AT_RISK" | "OK" | "NOT_APPLICABLE" | "NOT_QUANTIFIABLE",
        "migration_deadline_years": float | None, (crqc - data_lifetime) ==> by when should the migration be done
        "migration_urgency": "IMMEDIATE" | "PLANNED" | "MONITOR" | "UNKNOWN",
        "explanation": str,
      }
    """
    # Mosca only applies to quantum-vulnerable findings.
    if quantum_status in ("RESILIENT", "UNKNOWN"):
        return {
            "mosca_status": "NOT_APPLICABLE",
            "migration_deadline_years": None,
            "migration_urgency": "UNKNOWN",
            "explanation": (
                f"Mosca's inequality does not apply as quantum status is "
                f"{quantum_status}, so there is no PQC migration timeline to assess."
            ),
        }

    # Both inputs required.
    if data_lifetime_years is None or migration_time_years is None:
        missing = []
        if data_lifetime_years is None:
            missing.append("data lifetime")
        if migration_time_years is None:
            missing.append("migration time")
        return {
            "mosca_status": "NOT_QUANTIFIABLE",
            "migration_deadline_years": None,
            "migration_urgency": "UNKNOWN",
            "explanation": (
                f"Cannot assess migration urgency: {', '.join(missing)} "
                "not provided by user."
            ),
        }

    migration_deadline = crqc_arrival_years - data_lifetime_years
    total_exposure = data_lifetime_years + migration_time_years

    if total_exposure > crqc_arrival_years:
        return {
            "mosca_status": "AT_RISK",
            "migration_deadline_years": migration_deadline,
            "migration_urgency": "IMMEDIATE",
            "explanation": (
                f"Data lifetime ({data_lifetime_years}y) + migration time "
                f"({migration_time_years}y) = {total_exposure}y exceeds the "
                f"configured CRQC horizon ({crqc_arrival_years}y). "
                f"Migration is already behind schedule."
            ),
        }

    # OK — but how much margin?
    margin = crqc_arrival_years - total_exposure
    urgency = "PLANNED" if margin < 5 else "MONITOR"

    return {
        "mosca_status": "OK",
        "migration_deadline_years": migration_deadline,
        "migration_urgency": urgency,
        "explanation": (
            f"Data lifetime ({data_lifetime_years}y) + migration time "
            f"({migration_time_years}y) = {total_exposure}y is within the "
            f"CRQC horizon ({crqc_arrival_years}y), with {margin:.0f}y margin."
        ),
    }