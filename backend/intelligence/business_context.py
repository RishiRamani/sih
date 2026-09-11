"""
Handles user-supplied business context: data lifetime, criticality,
migration effort. Distinguishes user-supplied values from detected facts.
"""

from typing import Any


def validate_business_context(context: dict[str, Any]) -> dict[str, Any]:
    """
    Validates and normalizes user inputs.

    Returns a dict with only valid values, marking source as 'user'.
    Missing values become None, not defaults — unknown must stay unknown.
    """
    # TO-DO (Day 2): implement validation
    return {}