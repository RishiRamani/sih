from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse

from ..persistence.crud import get_scan
from ..schemas.scan import ScanResult
from ..reporting.report_generator import render_html


router = APIRouter(
    prefix="/scans",
    tags=["Reports"],
)


@router.get("/{scan_id}/report", response_class=HTMLResponse)
def get_report(scan_id: str, format: str = Query(default="html", pattern="^(html|json)$")):
    """
    Return the complete persisted scan result as the ECDAT report.
    """

    result = get_scan(scan_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scan not found: {scan_id}",
        )

    if format == "json":
        return JSONResponse(result.model_dump(mode="json"))
    return HTMLResponse(render_html(result), headers={"Content-Disposition": f'inline; filename="ecdat-{scan_id}.html"'})