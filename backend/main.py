from fastapi import FastAPI

from .api.scans import router as scans_router
from .api.findings import router as findings_router
from .api.risk import router as risk_router
from .api.recommendations import router as recommendations_router
from .api.cbom import router as cbom_router
from .api.reports import router as reports_router

app = FastAPI(
    title="ECDAT",
    version="0.1.0",
    description="Enterprise Cryptographic Discovery & Analysis Tool",
)

app.include_router(scans_router)
app.include_router(findings_router)
app.include_router(risk_router)
app.include_router(recommendations_router)
app.include_router(cbom_router)
app.include_router(reports_router)