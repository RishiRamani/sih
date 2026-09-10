# ECDAT — System Architecture & Design

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement:** SIH26164  
**Document Type:** System Design / Architecture  
**Status:** Baseline Architecture  
**Source of Truth:** `SRS.md`

---

## 1. Purpose

This document defines the technical architecture of ECDAT and translates the requirements in `SRS.md` into an implementable system structure.

The architecture is intentionally designed for a **4-person, 5–6 day prototype**. The system therefore prioritizes a working end-to-end pipeline over enterprise-scale deployment complexity.

The architecture must support the following core flow:

```text
Asset
  ↓
Intake / Dispatcher
  ↓
Asset-Specific Scanners
  ↓
Crypto Detection
  ↓
Finding Normalization
  ↓
CBOM Generation
  ↓
Risk Assessment
  ↓
Recommendation Engine
  ↓
Persistence
  ↓
API
  ↓
Web Dashboard
```

The most important architectural rule is:

> **Scanners discover evidence; downstream components interpret and enrich that evidence.**

The source scanner should not contain business-risk logic, the frontend should not calculate security risk, and the risk engine should not need to know how a finding was discovered.

---

## 2. Architectural Goals

The architecture shall provide:

1. **Modularity** — source, dependency, binary and container analysis are independent modules.
2. **Traceability** — every finding can be traced from UI → risk → CBOM → detection evidence.
3. **Explainability** — findings retain their detection method and evidence.
4. **Extensibility** — new languages, libraries, algorithms and asset types can be added without redesigning the whole system.
5. **Determinism** — the curated demo/test corpus produces repeatable results.
6. **Safety** — untrusted uploads are analyzed without executing arbitrary uploaded binaries.
7. **Separation of concerns** — detection, normalization, risk assessment, recommendation and presentation remain independent.
8. **Prototype practicality** — the architecture should be implementable quickly using the stack defined in the SRS.

---

## 3. System Context

ECDAT sits between an organization's software assets and its security/migration analysis workflow.

```text
                     ┌─────────────────────────┐
                     │  Security / App Analyst  │
                     └────────────┬────────────┘
                                  │
                                  │ upload/select asset
                                  ▼
                     ┌─────────────────────────┐
                     │          ECDAT          │
                     │                         │
                     │ Discovery + CBOM + Risk │
                     └────────────┬────────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   │              │              │
                   ▼              ▼              ▼
              Findings          CBOM        Recommendations
                   │              │              │
                   └──────────────┼──────────────┘
                                  ▼
                         Migration Priorities
```

### 3.1 External Inputs

ECDAT may receive:

- source repositories;
- uploaded source bundles;
- dependency manifests;
- certificates;
- binaries/libraries;
- Dockerfiles or locally accessible container images.

Infrastructure, cloud services and hardware modules remain representable in the common model but are not required to have full automatic discovery in the prototype.

### 3.2 External Outputs

ECDAT produces:

- cryptographic findings;
- CBOM data;
- risk assessments;
- migration recommendations;
- dashboard visualizations;
- machine-readable exports;
- human-readable reports where implemented.

---

## 4. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           WEB FRONTEND                              │
│                     Next.js + TypeScript                           │
│                                                                     │
│ Dashboard │ New Scan │ Findings │ CBOM │ Risk │ Recommendations     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS / JSON
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API SERVER                                │
│                            FastAPI                                  │
│                                                                     │
│ Scan API │ Result API │ CBOM API │ Risk API │ Report API            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SCAN ORCHESTRATOR                          │
│                                                                     │
│ Intake → Dispatch → Execute scanners → Normalize → Enrich → Save   │
└──────────────┬────────────────┬────────────────┬────────────────────┘
               │                │                │
               ▼                ▼                ▼
      ┌────────────────┐ ┌───────────────┐ ┌────────────────────┐
      │ Source Scanner │ │ Dependency    │ │ Binary / Container │
      │                │ │ Scanner       │ │ Scanner            │
      │ Regex          │ │               │ │                    │
      │ API signatures │ │ Manifests     │ │ Symbols/imports    │
      │ AST            │ │ Libraries     │ │ Strings/signatures │
      │ Heuristics     │ │ Versions      │ │ Packages/layers    │
      └───────┬────────┘ └──────┬────────┘ └─────────┬──────────┘
              │                 │                    │
              └─────────────────┼────────────────────┘
                                ▼
                     ┌─────────────────────┐
                     │ Finding Normalizer   │
                     └──────────┬──────────┘
                                ▼
                     ┌─────────────────────┐
                     │   CBOM Generator    │
                     └──────────┬──────────┘
                                ▼
                   ┌──────────────────────────┐
                   │      Risk Engine          │
                   │ Classical + Quantum +     │
                   │ Context + Mosca-style     │
                   └────────────┬─────────────┘
                                ▼
                   ┌──────────────────────────┐
                   │ Recommendation Engine     │
                   └────────────┬─────────────┘
                                ▼
                     ┌─────────────────────┐
                     │ PostgreSQL          │
                     │ Scan / Finding /    │
                     │ Risk / CBOM / etc.  │
                     └─────────────────────┘
```

---

## 5. Architectural Layers

The system is divided into six logical layers.

### Layer 1 — Presentation

Responsible for:

- scan creation;
- scan progress;
- dashboard metrics;
- finding search/filter/sort;
- finding detail views;
- CBOM visualization;
- risk visualization;
- recommendation display;
- exports where implemented.

The frontend **must not** contain authoritative risk calculations or detection rules.

### Layer 2 — API

Responsible for:

- validating requests;
- exposing scan/result resources;
- returning normalized data to the frontend;
- handling error responses;
- controlling access to scan data.

### Layer 3 — Orchestration

Responsible for:

- creating and tracking scans;
- selecting scanners according to asset type;
- coordinating execution;
- updating scan state;
- passing outputs from one processing stage to the next;
- handling partial failures.

### Layer 4 — Analysis

Responsible for:

- detection;
- normalization;
- certificate parsing;
- binary/container analysis;
- CBOM generation.

### Layer 5 — Intelligence

Responsible for:

- algorithm classification;
- classical security assessment;
- quantum vulnerability assessment;
- data-lifetime/business-criticality analysis;
- Mosca-style reasoning;
- risk scoring;
- migration recommendations.

### Layer 6 — Persistence

Responsible for:

- scan metadata;
- findings;
- evidence;
- CBOM output;
- risk results;
- recommendation results.

---

## 6. Core Components

## 6.1 Frontend

**Technology:** Next.js + TypeScript + Tailwind CSS + charting library.

### Responsibilities

The frontend provides these primary views:

```text
Dashboard
   │
   ├── New Scan
   │
   ├── Scan Progress
   │
   ├── Scan Results
   │     ├── Findings
   │     ├── CBOM
   │     ├── Risk Overview
   │     └── Recommendations
   │
   └── Finding Detail
```

### Frontend rule

The frontend is a **consumer of backend analysis results**, not a second analysis engine.

For example, it receives:

```json
{
  "riskScore": 94,
  "severity": "CRITICAL",
  "quantumRisk": "HIGH",
  "reason": "..."
}
```

and renders it. It does not recompute the score itself.

---

## 6.2 FastAPI Application

The FastAPI server is the primary backend entry point.

Suggested structure:

```text
backend/
├── main.py
├── api/
│   ├── scans.py
│   ├── findings.py
│   ├── cbom.py
│   ├── risk.py
│   └── reports.py
├── models/
├── schemas/
├── services/
├── scanners/
├── intelligence/
└── persistence/
```

The exact folder names may vary, but responsibilities should remain separated.

### Backend Responsibilities

- create scans;
- validate assets;
- invoke the scan pipeline;
- expose status/results;
- persist structured outputs;
- serve CBOM/risk/recommendation data.

---

## 6.3 Scan Orchestrator

The orchestrator is the central coordinator.

### Input

```text
ScanRequest
├── assetType
├── source
└── configuration
```

### Output

```text
Completed Scan
├── normalized findings
├── CBOM
├── risk assessments
└── recommendations
```

### Responsibilities

1. Create a scan record.
2. Prepare the asset in a safe temporary workspace.
3. Determine which scanners apply.
4. Execute applicable scanners.
5. Collect raw findings.
6. Normalize findings.
7. Generate/update CBOM.
8. Run risk assessment.
9. Run recommendation engine.
10. Persist results.
11. Mark scan complete or failed.

The orchestrator must not contain detailed cryptographic rules. Those belong in scanner/rule modules.

---

## 6.4 Asset Dispatcher

The dispatcher maps an asset type to scanner modules.

```text
             Scan Input
                 │
                 ▼
          Asset Dispatcher
                 │
      ┌──────────┼──────────┐
      ▼          ▼          ▼
    Source   Certificate  Binary
      │                     │
      ▼                     ▼
 Dependency             Container
```

### Example routing

| Asset Type | Required Scanner(s) |
|---|---|
| Source repository | Source + Dependency + Certificate where present |
| ZIP/source bundle | Source + Dependency + Certificate where present |
| Certificate | Certificate scanner |
| Binary/library | Binary scanner |
| Dockerfile/container image | Container scanner + dependency analysis where available |

A source repository does not need to be scanned by the binary scanner unless binaries are intentionally included and selected for analysis.

---

## 6.5 Source Scanner

The source scanner is a pipeline rather than one detector.

```text
Source Files
    ↓
File Filtering
    ↓
Language Identification
    ↓
Lexical Detection
    ↓
API Signature Detection
    ↓
AST Detection
    ↓
Custom-Crypto Heuristics
    ↓
Evidence Aggregation
    ↓
Raw Findings
```

### Detection methods

The scanner can emit one or more of:

```text
LEXICAL
API_SIGNATURE
AST
CUSTOM_HEURISTIC
```

### Supported prototype languages

Priority support:

- Python
- JavaScript / TypeScript
- Java
- C/C++

The scanner should gracefully mark unsupported languages/files rather than failing the full scan.

### AST strategy

AST support should be implemented through a parser abstraction so a language-specific parser can produce a common representation.

Conceptually:

```text
Python AST ────────┐
JS/TS AST ────────┤
Java AST ─────────┤──► Common AST Detection Interface
C/C++ AST ────────┘
```

The AST detector should focus on extracting meaningful cryptographic facts such as:

- algorithm/API;
- key size;
- mode;
- function invocation;
- location;
- surrounding evidence.

---

## 6.6 Dependency Scanner

The dependency scanner analyzes manifests and recognizable libraries.

```text
Manifest
   ↓
Package/Library Identification
   ↓
Version Extraction
   ↓
Crypto Library Matching
   ↓
Potential Algorithm Mapping
   ↓
Raw Dependency Findings
```

Priority manifest types:

- `requirements.txt`
- `package.json`
- Maven/Gradle manifests where practical
- Docker-related package installation where visible

The scanner should distinguish between:

```text
Library detected
        ≠
Algorithm definitely used
```

A library-level finding may therefore have lower confidence than a direct API/AST finding unless stronger evidence exists.

---

## 6.7 Certificate Scanner

The certificate scanner parses supported PEM/DER certificates.

```text
Certificate
    ↓
Parser
    ↓
Subject / Issuer / Validity
    ↓
Public Key Algorithm
    ↓
Key Size
    ↓
Signature Algorithm
    ↓
Normalized Finding
```

Supported evidence should include:

- certificate file path;
- subject;
- issuer;
- validity period;
- public-key algorithm;
- public-key size where applicable;
- signature algorithm.

---

## 6.8 Binary Scanner

The binary scanner provides prototype-level static discovery.

It is **not** a full reverse-engineering/decompilation system.

```text
Binary
  ↓
Metadata / Format Detection
  ↓
Strings / Imports / Symbols
  ↓
Known Crypto Indicators
  ↓
Signature/Pattern Matching
  ↓
Candidate Finding
```

Possible evidence:

- imported symbols;
- library references;
- recognizable strings;
- known crypto signatures/patterns.

Binary findings should normally carry explicit confidence and evidence because they are indirect compared with AST/API evidence.

---

## 6.9 Container Scanner

The container scanner inspects a Dockerfile or accessible container image at a static/package level.

```text
Dockerfile / Image
        ↓
Image / Layer Metadata
        ↓
Installed Package Discovery
        ↓
Crypto Library Matching
        ↓
Binary / Dependency Evidence
        ↓
Normalized Findings
```

The scanner should avoid executing untrusted application binaries merely to discover cryptographic usage.

Container results should preserve the container/image identity so that a finding can be traced back to the source asset.

---

## 6.10 Crypto Knowledge Base

The detection and intelligence layers require a shared structured knowledge base.

This should contain, at minimum:

```text
Algorithm
Primitive Type
Known Variants
Typical Key Sizes
Classical Risk Guidance
Quantum Vulnerability
Recommended Migration Direction
```

Examples of primitive categories:

```text
SYMMETRIC_ENCRYPTION
HASH
MAC
KEY_ESTABLISHMENT
DIGITAL_SIGNATURE
CERTIFICATE
PROTOCOL
LIBRARY
CUSTOM_CRYPTO
```

The knowledge base should be versioned and separated from application code where practical.

---

## 6.11 Finding Normalizer

Different scanners may produce different representations of the same concept.

Example:

```text
Source scanner:
  RSA.generate(2048)

Dependency scanner:
  cryptography library

Certificate scanner:
  RSA public key
```

The normalizer converts these into a common internal finding model.

```text
RawFinding
    ↓
Field extraction
    ↓
Algorithm normalization
    ↓
Primitive classification
    ↓
Asset classification
    ↓
Evidence normalization
    ↓
Confidence aggregation
    ↓
CryptoArtifact
```

### Canonical finding shape

```json
{
  "id": "finding-001",
  "scanId": "scan-001",
  "algorithm": "RSA",
  "variant": "RSA-2048",
  "primitiveType": "DIGITAL_SIGNATURE",
  "assetType": "SOURCE",
  "location": "backend/auth.py:48",
  "library": "cryptography",
  "libraryVersion": null,
  "mode": null,
  "keySize": 2048,
  "detectionMethods": ["AST", "API_SIGNATURE"],
  "confidence": "HIGH",
  "evidence": {
    "snippet": "RSA.generate(2048)",
    "file": "backend/auth.py",
    "line": 48
  }
}
```

This is an internal model. The external CBOM export does not need to use this exact JSON structure.

---

## 7. Confidence Model

Confidence and risk are intentionally separate.

```text
                 ┌───────────────┐
                 │   Evidence    │
                 └───────┬───────┘
                         ↓
                  Detection Confidence
                         │
            ┌────────────┼────────────┐
            ↓            ↓            ↓
          HIGH         MEDIUM        LOW

Separately:

Crypto Artifact
      ↓
Security / Quantum Analysis
      ↓
Risk Severity
```

### Suggested evidence strength

| Evidence | Typical Confidence |
|---|---|
| Exact cryptographic API call | HIGH |
| Parsed certificate field | HIGH |
| Strong symbol/import evidence | HIGH/MEDIUM |
| Multiple weak indicators | MEDIUM |
| Generic crypto-looking pattern | LOW/MEDIUM |
| Single ambiguous keyword | LOW |

The system may raise confidence when independent signals agree.

Example:

```text
API_SIGNATURE + AST + exact key size
                    ↓
                  HIGH
```

---

## 8. Custom Crypto Detection Architecture

Custom/home-grown cryptography requires a separate heuristic layer.

```text
Source Function
      ↓
Structural Analysis
      ↓
Indicator Extraction
      ├── repeated XOR
      ├── bit rotation
      ├── byte substitutions
      ├── custom permutations
      ├── key-dependent transformations
      └── unusual modular/bit operations
      ↓
Heuristic Score
      ↓
Potential Custom Crypto Finding
```

### Important design boundary

ECDAT must label such results as:

> **Potential / Suspicious Custom Cryptographic Implementation**

rather than claiming mathematical proof that an arbitrary function is cryptography.

Example finding:

```json
{
  "primitiveType": "CUSTOM_CRYPTO",
  "confidence": "MEDIUM",
  "detectionMethods": ["CUSTOM_HEURISTIC"],
  "evidence": [
    "Repeated XOR transformation",
    "Key-dependent byte manipulation",
    "Iterative transformation"
  ]
}
```

The risk/recommendation layer can then require **manual cryptographic review**.

---

## 9. CBOM Architecture

CBOM is the central product representation.

```text
                   Findings
                      ↓
              ┌───────────────┐
              │ CBOM Builder  │
              └───────┬───────┘
                      ↓
            ┌────────────────────┐
            │ Internal CBOM Model│
            └─────────┬──────────┘
                      │
            ┌─────────┴──────────┐
            ↓                    ↓
       UI representation     Export format
                              (CycloneDX-oriented)
```

### CBOM responsibilities

The CBOM layer shall:

- generate stable identifiers;
- preserve relationships between findings and source assets;
- retain detection evidence/traceability where the representation permits it;
- expose cryptographic algorithms/libraries/certificates as structured components;
- include relevant relationships between artefacts;
- support machine-readable export;
- provide data to dashboard and report views.

### CBOM versus finding

A **finding** is an observation produced by analysis.

A **CBOM artefact** is the normalized/catalogued representation used to describe the cryptographic inventory.

Multiple observations may contribute to one normalized artefact when appropriate.

---

## 10. Risk Engine Architecture

The risk engine consumes normalized cryptographic artefacts. It should not inspect source files directly.

```text
CryptoArtifact
      │
      ├── Algorithm / Variant
      ├── Key Size
      ├── Primitive Type
      ├── Detection Confidence
      ├── Data Lifetime
      └── Business Criticality
               │
               ▼
      ┌─────────────────────┐
      │ Classical Analysis  │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │ Quantum Analysis    │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │ Mosca-style Model   │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │ Risk Scoring        │
      └──────────┬──────────┘
                 │
                 ▼
           RiskAssessment
```

### 10.1 Classical Analysis

Inputs may include:

- algorithm family;
- variant/key size;
- known weak/deprecated status;
- usage context where known.

### 10.2 Quantum Analysis

The engine classifies algorithms according to their relevance to future quantum attacks.

It should distinguish between:

```text
Public-key cryptography
    → major quantum migration concern

Symmetric cryptography / hashes
    → different quantum treatment
```

### 10.3 Contextual Inputs

Where the system cannot reliably infer context, the user may supply or adjust:

- data lifetime;
- business criticality;
- migration effort/time.

### 10.4 Mosca-style Assessment

The implementation should express the logic conceptually as:

```text
Required Protection Lifetime
            +
Estimated Migration Time
            ↓
     Migration Deadline
            ↓
Compare against configured
quantum-threat scenario
            ↓
       Risk Assessment
```

The threat horizon remains a **configurable scenario**, not a guaranteed prediction.

---

## 11. Recommendation Engine Architecture

The recommendation engine maps a finding to a migration direction based on its cryptographic function.

```text
RiskAssessment + PrimitiveType + Algorithm
                      ↓
            Recommendation Rules
                      ↓
             Migration Direction
                      ↓
                Recommendation
```

### Recommendation categories

At minimum:

```text
KEY_ESTABLISHMENT
    → PQ/hybrid KEM direction

DIGITAL_SIGNATURE
    → PQ/hybrid signature direction

SYMMETRIC_ENCRYPTION
    → modern symmetric alternative

HASH / INTEGRITY
    → stronger approved hash/construction

CUSTOM_CRYPTO
    → vetted standard / manual review
```

The engine should not map solely by algorithm name.

### Example

```text
RSA used for digital signatures
        ↓
Quantum vulnerable
        ↓
Signature primitive
        ↓
Recommend PQ signature direction
(e.g. ML-DSA or SLH-DSA, subject to context)
```

```text
RSA used for key establishment
        ↓
Quantum vulnerable
        ↓
Key-establishment primitive
        ↓
Recommend KEM / hybrid direction
(e.g. ML-KEM / hybrid)
```

Recommendations are guidance, not an automated migration action.

---

## 12. Pipeline Data Flow

The complete data flow is:

```text
┌──────────────┐
│ User / Asset │
└──────┬───────┘
       ▼
┌──────────────┐
│ Scan Created │
└──────┬───────┘
       ▼
┌──────────────┐
│   Intake     │
└──────┬───────┘
       ▼
┌──────────────┐
│  Dispatcher  │
└──────┬───────┘
       ▼
┌───────────────────────────────────────┐
│ Scanner Layer                          │
│ Source / Dependency / Cert / Binary    │
│ / Container                            │
└───────────────────┬───────────────────┘
                    ▼
              Raw Findings
                    ▼
            Finding Normalizer
                    ▼
             CryptoArtefacts
                    ▼
               CBOM Builder
                    ▼
             Risk Assessment
                    ▼
             Recommendations
                    ▼
                Persistence
                    ▼
                  REST API
                    ▼
               Web Frontend
```

---

## 13. Scan Lifecycle Architecture

The SRS defines these logical states:

```text
CREATED
   ↓
QUEUED
   ↓
DISCOVERING
   ↓
ANALYSING
   ↓
NORMALIZING
   ↓
BUILDING_CBOM
   ↓
ASSESSING_RISK
   ↓
GENERATING_RECOMMENDATIONS
   ↓
COMPLETED
```

Failure from any stage:

```text
Any stage
   ↓
 FAILED
   ↓
 error_summary + safe partial results
```

### State ownership

| State | Main responsibility |
|---|---|
| CREATED | API |
| QUEUED | Orchestrator |
| DISCOVERING | Dispatcher/scanners |
| ANALYSING | Detection modules |
| NORMALIZING | Normalizer |
| BUILDING_CBOM | CBOM builder |
| ASSESSING_RISK | Risk engine |
| GENERATING_RECOMMENDATIONS | Recommendation engine |
| COMPLETED / FAILED | Orchestrator |

---

## 14. Persistence Architecture

### 14.1 Storage Technology

The prototype should use **PostgreSQL** as the main relational store.

### 14.2 Logical entities

```text
Project / Asset
      │
      └── Scan
            │
            ├── Finding / CryptoArtifact
            │       │
            │       ├── Evidence
            │       ├── RiskAssessment
            │       └── Recommendation
            │
            └── CBOM / Report
```

### 14.3 Minimal relational design

```text
scans
─────
id PK
asset_name
asset_type
status
started_at
completed_at
error_summary

findings
────────
id PK
scan_id FK
algorithm
variant
primitive_type
asset_type
location
line_number
library
library_version
mode
key_size
confidence
evidence

risk_assessments
────────────────
id PK
finding_id FK
classical_risk
quantum_risk
data_lifetime
business_criticality
migration_effort
risk_score
severity
risk_reason

recommendations
───────────────
id PK
finding_id FK
current_technology
recommended_direction
candidate_algorithm
priority
reason
assumptions

cboms
─────
id PK
scan_id FK
schema_version
generated_at
artifact_count
cbom_payload
```

Exact physical schema is finalized in `API_DB_SPEC.md`.

---

## 15. API Architecture

The API is resource-oriented and keeps analysis logic behind service boundaries.

### 15.1 Scan endpoints

```http
POST /scans
GET  /scans/{scan_id}
POST /scans/{scan_id}/start
GET  /scans/{scan_id}/status
```

### 15.2 Findings

```http
GET /scans/{scan_id}/findings
GET /scans/{scan_id}/findings/{finding_id}
```

### 15.3 CBOM

```http
GET /scans/{scan_id}/cbom
```

### 15.4 Risk

```http
GET /scans/{scan_id}/risks
```

### 15.5 Recommendations

```http
GET /scans/{scan_id}/recommendations
```

### 15.6 Reporting

```http
GET /scans/{scan_id}/report
```

The exact request/response schemas are defined separately in `API_DB_SPEC.md`.

---

## 16. API-to-Service Mapping

```text
HTTP Request
     ↓
FastAPI Route
     ↓
Pydantic Validation
     ↓
Service Layer
     ↓
Domain Component
     ↓
Repository / Persistence
     ↓
Response Schema
```

Example:

```text
POST /scans
     ↓
ScanRoute
     ↓
ScanService.create_scan()
     ↓
ScanRepository.insert()
     ↓
ScanResponse
```

Example start flow:

```text
POST /scans/{id}/start
     ↓
ScanService.start()
     ↓
Orchestrator
     ↓
Scanner pipeline
```

---

## 17. Frontend Architecture

Suggested structure:

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── scans/
│   ├── findings/
│   ├── cbom/
│   ├── risk/
│   └── recommendations/
├── components/
├── lib/
│   ├── api.ts
│   └── types.ts
└── hooks/
```

### Primary screens

```text
1. Dashboard
2. New Scan
3. Scan Progress
4. Scan Results / Findings
5. Finding Detail
6. CBOM Explorer
7. Risk Overview
8. Recommendations
```

### Dashboard data

The dashboard should consume aggregated backend results such as:

- total artefacts;
- severity distribution;
- quantum-vulnerable count;
- algorithm distribution;
- migration priority distribution;
- recent scans.

Aggregation belongs in backend services or database queries, not in repeated client-side calculations.

---

## 18. End-to-End Example

Consider:

```python
key = RSA.generate(1024)
```

### Step 1 — Source scanning

```text
AST detector
API signature detector
        ↓
Raw finding
```

### Step 2 — Normalization

```text
algorithm = RSA
keySize = 1024
primitiveType = digital-signature / key establishment
location = file:line
confidence = HIGH
```

### Step 3 — CBOM

The normalized artefact is added to the scan's CBOM.

### Step 4 — Risk

The risk engine evaluates:

```text
Algorithm
Key size
Classical status
Quantum vulnerability
Data lifetime
Business criticality
Migration effort
Configured quantum scenario
```

### Step 5 — Recommendation

The recommendation engine determines the appropriate migration direction **from the cryptographic function**, not merely from `RSA`.

### Step 6 — UI

The user sees:

```text
RSA-1024
backend/auth.py:48

Confidence: HIGH
Severity: CRITICAL
Quantum Risk: HIGH

Why?
<explanation>

Recommendation:
<PQ / hybrid direction>

Evidence:
RSA.generate(1024)
```

---

## 19. Multi-Signal Detection and Deduplication

A single cryptographic use may be discovered multiple times.

Example:

```text
AST detector ───────────┐
API detector ───────────┼──► same logical usage
Regex detector ─────────┘
```

The normalizer should attempt to merge duplicate observations when they represent the same location/usage.

### Suggested identity hints

```text
scan_id
asset
file/location
algorithm
function/API
nearby source range
```

The result can retain all contributing detection methods:

```json
{
  "detectionMethods": [
    "AST",
    "API_SIGNATURE",
    "LEXICAL"
  ]
}
```

This improves both confidence and explainability.

---

## 20. Error Handling Architecture

The prototype must tolerate ordinary scanner failures.

```text
Repository
   ↓
File A → success
File B → unsupported
File C → parse error
File D → success
   ↓
Continue scan
   ↓
Record warnings
   ↓
Return partial + successful findings
```

### Error categories

```text
INPUT_ERROR
UNSUPPORTED_FILE
PARSE_ERROR
SCANNER_ERROR
TIMEOUT
RESOURCE_LIMIT
PERSISTENCE_ERROR
INTERNAL_ERROR
```

A single malformed file should not automatically invalidate a complete repository scan unless the failure prevents safe/meaningful continuation.

---

## 21. Security Architecture

ECDAT processes untrusted inputs, so scanning is treated as a security-sensitive subsystem.

### 21.1 Upload isolation

Uploaded archives/files should be stored in a temporary workspace.

```text
Upload
  ↓
Validate
  ↓
Generate isolated work directory
  ↓
Extract safely
  ↓
Scan
  ↓
Delete/expire workspace
```

### 21.2 Archive safety

The intake layer must protect against:

- path traversal;
- unexpected file types;
- excessive archive size;
- excessive file count;
- decompression/resource abuse.

### 21.3 Binary safety

Ordinary scanning should use static inspection only.

```text
Binary uploaded
      ↓
Static inspection
      ↓
No execution of uploaded binary
```

### 21.4 Resource limits

At minimum, the prototype should support practical limits for:

- upload size;
- extraction size;
- scan duration;
- file count;
- per-file processing time where practical.

### 21.5 Evidence sanitization

Source excerpts and filenames rendered in the frontend must be treated as untrusted data.

---

## 22. Deterministic Demo Dataset Architecture

The prototype should not depend exclusively on arbitrary external GitHub repositories for the main demo.

Use two dataset classes:

### Class A — Curated ECDAT Test Repository

Purpose:

- deterministic demo;
- known expected detections;
- regression testing;
- controlled coverage of features.

Example:

```text
ecdat-test-repo/
├── python/
│   ├── weak_crypto.py
│   ├── secure_crypto.py
│   └── custom_crypto.py
├── javascript/
│   └── auth.js
├── java/
│   └── LegacyCrypto.java
├── certificates/
│   └── sample.crt
├── docker/
│   └── Dockerfile
└── dependencies/
    ├── requirements.txt
    └── package.json
```

### Class B — Real Open-Source Corpus

Purpose:

- demonstrate real-world applicability;
- validate that detection is not hard-coded only to the curated test project;
- provide additional regression samples where practical.

Examples may include openly licensed repositories/libraries such as GitHub projects or crypto libraries such as OpenSSL, consistent with the SIH dataset guidance.

The system itself should not require internet access for the primary deterministic demo.

---

## 23. Deployment Architecture

### Prototype Deployment

Docker Compose is sufficient.

```text
┌─────────────────────────────┐
│        Docker Compose       │
│                             │
│  ┌─────────────┐            │
│  │ Frontend    │            │
│  │ Next.js     │            │
│  └──────┬──────┘            │
│         │                   │
│         ▼                   │
│  ┌─────────────┐            │
│  │ Backend     │            │
│  │ FastAPI     │            │
│  └──────┬──────┘            │
│         │                   │
│         ▼                   │
│  ┌─────────────┐            │
│  │ PostgreSQL  │            │
│  └─────────────┘            │
│                             │
└─────────────────────────────┘
```

The scanner can initially execute inside the backend process/container if that is sufficient for the prototype, provided security/resource isolation remains reasonable.

A separate worker service is a future optimization if scan execution becomes too heavy for the API process.

---

## 24. Synchronous vs Asynchronous Processing

Scanning is potentially long-running and should not block the frontend request until completion.

Preferred prototype flow:

```text
POST /scans
     ↓
returns scan_id
     ↓
POST /scans/{id}/start
     ↓
start scan
     ↓
frontend polls status
     ↓
GET /scans/{id}/status
```

The backend may run the orchestrator in a background execution mechanism suitable for the prototype.

The architecture should make it possible to replace the prototype execution mechanism with a queue/worker architecture later.

---

## 25. Observability

The prototype only needs lightweight observability.

### Required

- backend logs;
- scan start/end logs;
- scanner failures;
- scan duration;
- number of files inspected;
- number of findings produced;
- scan failure reason.

### Useful metrics

```text
scan_duration
files_scanned
findings_discovered
findings_high_confidence
critical_findings
scanner_errors
```

The frontend does not need a full observability dashboard in the prototype.

---

## 26. Extensibility Model

The architecture should make the following additions possible without altering the core pipeline:

```text
New Language
    ↓
New Detector Adapter
    ↓
Same RawFinding
    ↓
Same Normalizer
    ↓
Same CBOM
    ↓
Same Risk Engine
```

Likewise for new asset types:

```text
Cloud Connector
Hardware Connector
Infrastructure Connector
Network Connector
        ↓
Common Artefact Model
        ↓
Existing CBOM / Risk / Recommendation layers
```

This is the main reason the common normalized finding model is important.

---

## 27. Architectural Decisions

### AD-01 — Modular scanner architecture

**Decision:** Each asset type has an independent scanner module.  
**Reason:** Prevents source/binary/container logic from becoming one unmaintainable scanner.

### AD-02 — Normalize before risk analysis

**Decision:** All scanner outputs pass through a common normalized model before intelligence analysis.  
**Reason:** Keeps the risk engine independent of scanner implementation details.

### AD-03 — CBOM is a first-class domain object

**Decision:** CBOM is generated from normalized artefacts rather than being a final UI export assembled ad hoc.  
**Reason:** The CBOM is a core product output and must support both visualization and machine-readable export.

### AD-04 — Risk engine is server-side

**Decision:** Risk scores and classifications are authoritative backend results.  
**Reason:** Prevents inconsistent scoring and keeps business logic centralized.

### AD-05 — Static binary analysis for prototype

**Decision:** Binary scanning uses static indicators rather than full reverse engineering.  
**Reason:** Full reverse engineering would exceed the prototype scope.

### AD-06 — Heuristic custom-crypto findings are advisory

**Decision:** Custom-crypto heuristics generate suspicious/possible findings rather than definitive proofs.  
**Reason:** Technically honest and reduces false certainty.

### AD-07 — Configurable quantum scenario

**Decision:** The quantum threat horizon is treated as an input/scenario.  
**Reason:** A precise future CRQC arrival date cannot be presented as a guaranteed fact.

### AD-08 — Deterministic internal dataset

**Decision:** The project maintains a curated test repository.  
**Reason:** Demo and regression tests must not depend on unpredictable external repositories.

---

## 28. Prototype Implementation Priorities

The architecture supports more than the team can reliably finish in 5–6 days. Implementation priority therefore follows the SRS priority model.

### P0 — Must work end-to-end

```text
Source repository intake
        ↓
Python / JS / TS detection
        ↓
Regex + API signatures + AST
        ↓
Dependency detection
        ↓
Normalized findings
        ↓
CBOM
        ↓
Quantum/classical risk
        ↓
Mosca-style assessment
        ↓
Recommendations
        ↓
Dashboard + finding detail
```

### P1 — Strong secondary coverage

```text
Certificate scanning
Binary scanning
Container scanning
Custom crypto heuristics
CBOM export/report polish
```

### P2 — Future expansion

```text
Cloud discovery
Infrastructure connectors
Hardware-module discovery
Kubernetes-wide scanning
Network inspection
Advanced binary reverse engineering
```

---

## 29. Parallel Development Contracts

The four major implementation areas must communicate through stable interfaces.

```text
               ┌─────────────────────┐
               │ Detection Contract  │
               │ RawFinding[]        │
               └──────────┬──────────┘
                          ↓
               ┌─────────────────────┐
               │ Domain Contract     │
               │ CryptoArtifact[]    │
               └──────────┬──────────┘
                          ↓
               ┌─────────────────────┐
               │ Risk Contract       │
               │ RiskAssessment[]    │
               └──────────┬──────────┘
                          ↓
               ┌─────────────────────┐
               │ API Contract        │
               │ JSON resources      │
               └──────────┬──────────┘
                          ↓
               ┌─────────────────────┐
               │ UI Contract         │
               │ dashboard/details   │
               └─────────────────────┘
```

These contracts are finalized in `API_DB_SPEC.md`.

### Critical rule

**No team member should invent a parallel representation of a finding.**

There must be one canonical domain representation.

---

## 30. Failure and Partial-Result Strategy

A scan should be treated as a collection of analyzable units.

```text
100 files
 ├── 92 analyzed successfully
 ├── 5 unsupported
 └── 3 parse failures
          ↓
Scan can still COMPLETE with warnings
```

The scan record should preserve an error/warning summary so users know that "completed" does not necessarily mean every file was analyzable.

For severe systemic failures:

```text
Database unavailable
Scanner initialization failure
Unsafe extraction failure
        ↓
       FAILED
```

---

## 31. Traceability Requirement

The architecture must support this drill-down path:

```text
Dashboard
   ↓
Risk severity / artefact count
   ↓
Finding
   ↓
CryptoArtifact
   ↓
Detection evidence
   ↓
RiskAssessment
   ↓
Recommendation
   ↓
CBOM entry
```

A user should not encounter a high-risk result for which ECDAT cannot explain:

- what was detected;
- where it was detected;
- how it was detected;
- why it is considered risky;
- what migration direction is suggested.

---

## 32. Future Enterprise Architecture

The prototype architecture intentionally leaves extension points for full enterprise discovery.

```text
                       Future Connectors
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
 Cloud Scanner      Infrastructure        Hardware Scanner
                         Scanner
      │                    │                    │
      └────────────────────┼────────────────────┘
                           ▼
                  Common Artefact Model
                           ▼
                          CBOM
                           ▼
                      Risk Engine
                           ▼
                   Recommendations
```

The critical property is that future asset connectors produce the same normalized artefacts used by the existing intelligence layers.

---

## 33. Architecture Validation Checklist

Before calling the prototype architecturally complete, verify:

### Input

- [ ] A repository/source bundle can be submitted.
- [ ] Asset type is known before scanning.
- [ ] Uploaded files are handled safely.

### Detection

- [ ] Source scanner emits structured findings.
- [ ] Dependency scanner emits structured findings.
- [ ] Certificate scanner can emit structured certificate findings.
- [ ] Binary/container scanners use the same domain model.
- [ ] Detection methods and confidence are retained.

### Processing

- [ ] Findings can be normalized.
- [ ] Multiple detection signals can contribute to one logical finding.
- [ ] CBOM can be generated from normalized findings.
- [ ] Risk engine does not depend on source-scanner internals.
- [ ] Recommendation engine uses primitive/function context.

### Backend

- [ ] Scan lifecycle is persisted.
- [ ] Results can be retrieved through API endpoints.
- [ ] Long-running scans do not block the UI request indefinitely.

### Frontend

- [ ] User can start a scan.
- [ ] User can see progress/status.
- [ ] User can see findings.
- [ ] User can open a finding and view evidence.
- [ ] User can view risk reasoning.
- [ ] User can view recommendations.
- [ ] User can inspect the CBOM.

### Security

- [ ] Uploaded archives cannot escape the extraction directory.
- [ ] Uploaded binaries are not executed by normal analysis.
- [ ] Scan resource limits exist.
- [ ] UI evidence is safely rendered.

### Demo

- [ ] Curated dataset gives deterministic output.
- [ ] At least one end-to-end scan works from upload to recommendation.
- [ ] The results visibly demonstrate the core product story.

---

## 34. Final Architecture Summary

ECDAT is organized around a **single normalized cryptographic domain model** and a staged analysis pipeline:

```text
                    ┌──────────────┐
                    │    Assets    │
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │  Dispatcher  │
                    └──────┬───────┘
                           ▼
        ┌────────────────────────────────────┐
        │             Scanners               │
        │                                    │
        │ Source │ Dependency │ Cert │ Binary│
        │                       │ Container  │
        └─────────────────┬──────────────────┘
                          ▼
                 ┌─────────────────┐
                 │ Normalized      │
                 │ Findings        │
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │      CBOM       │
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │   Risk Engine   │
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │ Recommendation  │
                 │     Engine      │
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │ PostgreSQL/API  │
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │   Next.js UI    │
                 └─────────────────┘
```

The architecture deliberately keeps the hardest parts isolated:

- **Discovery complexity** is contained in scanner modules.
- **Data consistency** is handled by the normalizer.
- **Inventory** is represented centrally through CBOM.
- **Security intelligence** is isolated in the risk/recommendation engines.
- **Presentation** consumes authoritative backend results.

This gives the team a realistic path to a strong prototype while preserving an architecture that can later expand toward broader enterprise asset discovery.

---
