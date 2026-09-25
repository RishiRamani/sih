# backend/api/scans.py
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException

from ..acquisition.manager import AcquisitionError, acquire_target
from ..auth.dependencies import get_current_user
from ..orchestration.pipeline import ScanPipeline
from ..persistence.crud import (
    create_scan as persist_scan,
    delete_scan,
    get_scan,
    list_scans,
)
from ..scanners.binary.binary_scanner import BinaryScanner
from ..scanners.certificate.certificate_scanner import CertificateScanner
from ..scanners.container.container_scanner import ContainerScanner
from ..scanners.dependency.dependency_scanner import DependencyScanner
from ..scanners.source.source_scanner_adapter import SourceScanner
from ..schemas.scan import ScanRequest, ScanResult


router = APIRouter(prefix="/scans", tags=["Scans"])


def _application_name(source_type: str, source: str) -> str:
    if source_type == "git":
        repo_name = Path(urlparse(source).path.rstrip("/")).name
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
        return repo_name or "git-repository"
    return Path(source).name or "local-target"


def build_pipeline() -> ScanPipeline:
    return ScanPipeline(
        scanners=[
            SourceScanner(),
            CertificateScanner(),
            BinaryScanner(),
            ContainerScanner(),
            DependencyScanner(),
        ]
    )


@router.get("", response_model=list[ScanResult])
def get_scans(current_user: dict = Depends(get_current_user)) -> list[ScanResult]:
    return list_scans(owner_id=current_user["user_id"])


@router.get("/{scan_id}", response_model=ScanResult)
def get_scan_by_id(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
) -> ScanResult:
    result = get_scan(scan_id, owner_id=current_user["user_id"])
    if result is None:
        raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")
    return result


@router.delete("/{scan_id}")
def delete_scan_by_id(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict[str, str]:
    deleted = delete_scan(scan_id, owner_id=current_user["user_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")
    return {"scan_id": scan_id, "status": "deleted"}


@router.post("", response_model=ScanResult)
def create_scan(
    request: ScanRequest,
    current_user: dict = Depends(get_current_user),
) -> ScanResult:
    if request.target_path is not None:
        source_type = "local"
        source = request.target_path
    else:
        source_type = request.source_type
        source = request.source

    try:
        with acquire_target(source_type, source) as acquired:
            result = build_pipeline().run(
                acquired.path,
                application_name_override=_application_name(source_type, source),
                business_criticality=request.business_criticality,
                data_lifetime_years=request.data_lifetime_years,
                migration_time_years=request.migration_time_years,
                crqc_arrival_years=request.crqc_arrival_years,
            )
            result.target_path = source
            return persist_scan(result, owner_id=current_user["user_id"])

    except AcquisitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scan failed: {exc}") from exc