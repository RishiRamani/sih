"""
Handles user-supplied business context: data lifetime, criticality,
migration effort. Distinguishes user-supplied values from detected facts.

Missing values stay None — unknown must remain unknown.
"""

from typing import Any

VALID_CRITICALITY = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}

def validate_business_context(context: dict[str, Any]) -> dict[str, Any]:
    """
    Validate user-supplied business context.

    Returns only the fields that were provided AND valid.
    Invalid values are dropped and reported in `errors`.

    Output shape:
      {
        "data_lifetime_years": float | None,
        "business_criticality": str | None,
        "migration_time_years": float | None,
        "source": "user",
        "errors": [str, ...],
      }
    """
    errors: list[str] = []

    dlf = context.get("data_lifetime_years")
    if dlf is not None:
        try:
            dlf = float(dlf)
            if dlf < 0:
                errors.append("data_lifetime_years must be non-negative")
                dlf = None
        except (TypeError, ValueError):
            errors.append(f"data_lifetime_years not a number: {dlf!r}")
            dlf = None

    mt = context.get("migration_time_years")
    if mt is not None:
        try:
            mt = float(mt)
            if mt < 0:
                errors.append("migration_time_years must be non-negative")
                mt = None
        except (TypeError, ValueError):
            errors.append(f"migration_time_years not a number: {mt!r}")
            mt = None

    crit = context.get("business_criticality")
    if crit is not None:
        crit = str(crit).upper()
        if crit not in VALID_CRITICALITY:
            errors.append(
                f"business_criticality must be one of {sorted(VALID_CRITICALITY)}, received: {crit!r}"
            )
            crit = None

    return {
        "data_lifetime_years": dlf,
        "business_criticality": crit,
        "migration_time_years": mt,
        "source": "user",
        "errors": errors,
    }