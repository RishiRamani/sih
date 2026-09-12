"""
Knowledge base loader for ECDAT intelligence layer.

Loads the versioned crypto_kb.yaml and exposes lookup functions.
All intelligence modules read from this — no hardcoded algorithm rules elsewhere.
"""

from pathlib import Path
from typing import Any, Optional
import yaml


_KB_CACHE: Optional[dict[str, Any]] = None
_KB_PATH = Path(__file__).resolve().parent.parent / "data" / "crypto_kb.yaml"


def load_kb(force_reload: bool = False) -> dict[str, Any]:
    """Load the knowledge base YAML. Cached after first load."""
    global _KB_CACHE
    if _KB_CACHE is None or force_reload:
        with open(_KB_PATH, "r", encoding="utf-8") as f:
            _KB_CACHE = yaml.safe_load(f)
    return _KB_CACHE


def get_kb_version() -> str:
    """Return the version string of the loaded KB. Used for scan reproducibility."""
    return load_kb().get("version", "unknown")


def lookup_algorithm(name: str) -> Optional[dict[str, Any]]:
    """
    Look up an algorithm entry by canonical name or alias.

    Algorithm names are normalized case-insensitively and with hyphens /
    underscores removed.
    """
    kb = load_kb()
    algorithms = kb.get("algorithms", {})

    normalized = _normalize_name(name)

    # Canonical-name lookup
    for canonical, entry in algorithms.items():
        if _normalize_name(canonical) == normalized:
            return entry

        # Alias lookup
        aliases = entry.get("aliases", [])
        if any(_normalize_name(alias) == normalized for alias in aliases):
            return entry

    return None

def _normalize_name(name: str) -> str:
    """Normalize algorithm name for lookup: strip hyphens, uppercase."""
    return name.upper().replace("-", "").replace("_", "")


def get_recommendation(
    algorithm_name: str, primitive_type: str
) -> Optional[dict[str, Any]]:
    """
    Get the purpose-aware recommendation for an algorithm.

    Example:
      get_recommendation("RSA", "KEY_ESTABLISHMENT")
      -> {"direction": "KEM", "candidates": ["ML-KEM-768", ...], ...}
    """
    entry = lookup_algorithm(algorithm_name)
    if not entry:
        return None

    recommendations = entry.get("recommendation", {})
    return recommendations.get(primitive_type)