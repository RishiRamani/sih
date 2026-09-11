from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from schemas.finding import Finding


class BaseScanner(ABC):
    """
    Base interface for every ECDAT scanner.

    Each scanner receives a target and returns zero or more findings.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable scanner name."""
        raise NotImplementedError

    @abstractmethod
    def can_scan(self, target: Any) -> bool:
        """
        Return True if this scanner can handle the target.
        """
        raise NotImplementedError

    @abstractmethod
    def scan(self, target: Path) -> list[Finding]:
        """
        Analyze the target and return findings.
        """
        raise NotImplementedError