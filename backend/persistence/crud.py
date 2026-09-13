from ..schemas.scan import ScanResult
from .repositories import scan_repository


def create_scan(result: ScanResult) -> ScanResult:
    """
    Persist a scan result.
    """
    return scan_repository.create(result)


def get_scan(scan_id: str) -> ScanResult | None:
    """
    Retrieve a scan by ID.
    """
    return scan_repository.get(scan_id)


def list_scans() -> list[ScanResult]:
    """
    Retrieve all stored scans.
    """
    return scan_repository.list()


def delete_scan(scan_id: str) -> bool:
    """
    Delete a scan by ID.
    """
    return scan_repository.delete(scan_id)


def update_scan(result: ScanResult) -> ScanResult:
    return scan_repository.update(result)