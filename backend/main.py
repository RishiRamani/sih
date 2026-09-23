# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.scans import router as scans_router
from .api.findings import router as findings_router
from .api.risk import router as risk_router
from .api.recommendations import router as recommendations_router
from .api.cbom import router as cbom_router
from .api.reports import router as reports_router
from .auth.routes import router as auth_router

app = FastAPI(
    title="ECDAT",
    version="0.1.0",
    description="Enterprise Cryptographic Discovery & Analysis Tool",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://qrypta-delta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(scans_router)
app.include_router(findings_router)
app.include_router(risk_router)
app.include_router(recommendations_router)
app.include_router(cbom_router)
app.include_router(reports_router)