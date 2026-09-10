# ECDAT — Exact Work Division

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement:** SIH26164  
**Team Size:** 4 people  
**Prototype Window:** 5–6 days  
**Source of Truth:** `SRS.md` and `SYSTEM_DESIGN.md`

---

## 1. Division Principle

The team should be divided by **system boundary**, not by isolated features. Each person owns one major layer and is responsible for making that layer production-quality enough for the prototype.

The four ownership areas are:

```text
Person 1 → Discovery & Detection
Person 2 → Risk & Recommendation Intelligence
Person 3 → Backend, Persistence & Integration
Person 4 → Frontend & Presentation
```

The common integration contract is:

```text
                    ┌──────────────────┐
                    │     Person 1     │
                    │ Discovery/Scan   │
                    └────────┬─────────┘
                             │ Findings
                             ▼
                    ┌──────────────────┐
                    │     Person 3     │
                    │ Backend + CBOM   │
                    └────────┬─────────┘
                             │ Normalized data
                             ▼
                    ┌──────────────────┐
                    │     Person 2     │
                    │ Risk + Recommend │
                    └────────┬─────────┘
                             │ Enriched results
                             ▼
                    ┌──────────────────┐
                    │     Person 3     │
                    │ API / Persistence│
                    └────────┬─────────┘
                             │ JSON
                             ▼
                    ┌──────────────────┐
                    │     Person 4     │
                    │ Dashboard / UX   │
                    └──────────────────┘
```

No person should build a private data format that the rest of the system has to reverse-engineer later.

---

# 2. Person 1 — Discovery & Cryptographic Detection

## Primary Ownership

**Own the entire asset discovery and cryptographic detection layer.**

This person is responsible for answering:

> "What cryptographic artefacts exist in this asset, where are they, and what evidence caused us to detect them?"

### Responsibilities

- Repository/file enumeration
- Source-code scanning
- Regex/lexical detection
- Cryptographic API/function signature detection
- AST-based detection
- Algorithm and variant identification
- Key-size extraction where available
- Detection evidence extraction
- Confidence calculation
- Dependency/library discovery
- Certificate parsing
- Binary scanning at prototype depth
- Container/image scanning at prototype depth
- Suspicious/custom-crypto heuristics
- Conversion of raw detections into the shared `CryptoFinding` structure

### Ownership Boundary

Person 1 **does not** own:

- Final risk score
- Mosca-style assessment
- Migration recommendations
- Frontend
- Database persistence implementation
- Authentication

Person 1 supplies the evidence needed by those components.

---

## 2.1 Exact Scanner Responsibilities

### A. Source scanner

Support the languages prioritized by the SRS for the prototype:

- Python
- JavaScript / TypeScript
- Java
- C/C++ where practical

Implement detection in this order:

```text
1. File enumeration
2. Lexical/regex patterns
3. Known crypto API signatures
4. AST extraction
5. Evidence/context extraction
6. Normalize finding
```

### B. Dependency scanner

Inspect common manifests and dependency declarations such as:

```text
requirements.txt
package.json
pom.xml
Dockerfile
```

Output:

- package/library name
- version when available
- source manifest
- line/location when available
- known cryptographic relevance
- confidence

### C. Certificate scanner

Parse supported certificates/keys where provided as files and extract relevant metadata such as:

- subject
- issuer
- validity dates
- public-key algorithm
- key size
- signature algorithm

### D. Binary scanner

Prototype-level static indicators only:

```text
strings
imports/symbols
known crypto names/signatures/constants
```

Do not implement full disassembly/reverse engineering.

### E. Container scanner

Prototype-level inspection of image metadata/layers/package contents to identify:

- cryptographic libraries
- relevant binaries/packages
- configuration/certificate artefacts

Do not attempt full cloud/Kubernetes infrastructure discovery.

### F. Suspicious custom crypto

Implement explainable heuristics for indicators such as:

- repeated XOR transformations
- bit rotations
- byte substitutions
- unusual modular arithmetic
- lookup-table-heavy transformations
- key-dependent iterative transformations

The result must be labelled **potential/suspicious custom cryptography**, not guaranteed cryptographic classification.

---

## 2.2 Mandatory Output Contract

Person 1 must expose a stable normalized result object to Person 3.

Minimum conceptual fields:

```json
{
  "algorithm": "RSA",
  "variant": "RSA-1024",
  "category": "public-key",
  "artifact_type": "source",
  "file": "backend/auth.py",
  "line": 48,
  "evidence": "RSA.generate(1024)",
  "detection_method": "AST",
  "confidence": 0.98,
  "library": null,
  "library_version": null
}
```

The exact shared schema is defined by the API/DB specification. Person 1 must implement against that contract rather than inventing another one.

---

## 2.3 Person 1 — Day-by-Day Deliverables

### Day 1

- Define detection signatures
- Define normalized finding interface with Person 3
- Set up scanner module structure
- Implement file enumeration
- Implement first regex/API detectors

### Day 2

- Implement AST detection for Python
- Implement AST detection for JS/TS
- Extract line, context, algorithm, variant and key size

### Day 3

- Add Java/C/C++ coverage as practical
- Implement dependency scanning
- Implement certificate parsing

### Day 4

- Implement custom-crypto heuristics
- Begin binary scanning
- Begin container scanning

### Day 5

- Integrate every scanner through one common output format
- Fix false positives
- Test against curated dataset and at least one real open-source project/library

### Day 6

- Stabilize scanners
- Prepare deterministic demo scan
- Assist integration and bug fixing

---

# 3. Person 2 — Risk, Quantum Analysis & Recommendations

## Primary Ownership

**Own the intelligence layer that converts a crypto finding into a security decision.**

This person answers:

> "How serious is this cryptographic artefact, why is it serious, and what should the organization do?"

### Responsibilities

- Cryptographic strength classification
- Classical weakness classification
- Quantum-vulnerability classification
- Key-size assessment
- Data-lifetime assessment
- Business-criticality handling
- Mosca-style risk assessment
- Risk scoring
- Severity classification
- Migration priority calculation
- PQC/hybrid recommendation logic
- Explanation text for findings

### Ownership Boundary

Person 2 **does not** own:

- Source parsing
- Repository/file upload handling
- API server implementation
- Database persistence implementation
- Frontend pages

Person 2 receives normalized findings and returns enriched risk results.

---

## 3.1 Risk Inputs

The engine should consume at minimum:

```text
Algorithm
Variant / key size
Artefact category
Detection confidence
Classical security status
Quantum vulnerability
Data lifetime
Business criticality
Migration/transition considerations
```

The system should not reduce risk to a fixed mapping such as:

```text
RSA → Critical
AES → Safe
```

The risk result must be contextual.

---

## 3.2 Quantum Risk

Maintain a compact knowledge base covering the algorithms used in the demo/test corpus.

At minimum, support the major categories required by the SRS:

- RSA
- DH
- ECDH
- ECDSA
- DSA
- AES
- 3DES/DES
- MD5
- SHA-1
- SHA-2 family
- ChaCha20
- Ed25519/related modern signatures where detected
- suspicious/custom cryptography

Classify whether each artefact has meaningful post-quantum migration exposure.

---

## 3.3 Mosca-Style Assessment

Implement the comparison around:

```text
required protection lifetime
vs.
expected migration/protection transition window
```

Keep assumptions configurable and clearly label estimates as assumptions rather than guaranteed predictions.

The UI/API should expose enough reasoning that a judge can understand **why** the risk is high.

---

## 3.4 Recommendation Rules

Recommendations must depend on the cryptographic use case.

Examples:

```text
RSA key establishment / encryption
    → ML-KEM or hybrid approach as appropriate

ECDH / DH
    → ML-KEM or hybrid approach as appropriate

RSA / ECDSA signatures
    → ML-DSA / SLH-DSA as appropriate

MD5 / SHA-1
    → stronger approved hash functions

DES / 3DES
    → modern symmetric encryption, typically AES-256 where appropriate

Potential custom crypto
    → manual review and replacement with vetted standard primitives
```

Do not make a blanket `RSA → ML-KEM` rule for every use case; signatures and key establishment require different migration targets.

---

## 3.5 Mandatory Output Contract

Minimum conceptual output:

```json
{
  "risk_score": 94,
  "severity": "CRITICAL",
  "quantum_vulnerable": true,
  "classical_risk": "HIGH",
  "mosca_status": "HIGH",
  "migration_priority": "IMMEDIATE",
  "recommendation": "Transition to an appropriate PQC/hybrid mechanism",
  "reason": "RSA-1024 is vulnerable to quantum factoring attacks and protects long-lived critical data."
}
```

Person 2 must keep the output deterministic and testable.

---

## 3.6 Person 2 — Day-by-Day Deliverables

### Day 1

- Define risk inputs with Person 1/3
- Define algorithm knowledge base structure
- Define severity levels
- Define scoring dimensions

### Day 2

- Implement algorithm/security classification
- Implement key-size rules
- Implement quantum-vulnerability rules

### Day 3

- Implement Mosca-style assessment
- Implement data-lifetime/business-criticality handling
- Implement risk scoring

### Day 4

- Implement recommendation matrix
- Implement migration priority
- Implement explanation generation

### Day 5

- Integrate risk engine with normalized scanner findings
- Create deterministic test cases
- Validate scores against expected outputs

### Day 6

- Tune scoring/recommendations
- Support frontend integration
- Prepare demo explanations and fix inconsistencies

---

# 4. Person 3 — Backend, Database, CBOM & Integration

## Primary Ownership

**Own the application's central integration layer.**

This person answers:

> "How does a scan move through the system, get stored, enriched, exposed through APIs, and turned into a CBOM/report?"

### Responsibilities

- FastAPI application
- API routing
- Scan orchestration
- Asset intake
- Job/scan state handling
- Temporary file handling
- Database schema implementation
- Persistence
- CBOM generation/normalization
- Integration of Person 1's scanner output
- Integration of Person 2's risk output
- Result retrieval APIs
- Report/export plumbing if time permits
- Container scan orchestration
- Shared validation/error handling

### Ownership Boundary

Person 3 **does not** implement the detection algorithms or the risk model itself. Those come from Persons 1 and 2.

Person 3 integrates them.

---

## 4.1 Core Backend Flow

```text
POST /scan
    ↓
Create scan record
    ↓
Store/prepare asset
    ↓
Select scanner(s)
    ↓
Run detection
    ↓
Normalize findings
    ↓
Send findings to risk engine
    ↓
Create enriched CBOM entries
    ↓
Persist results
    ↓
Expose results through API
```

---

## 4.2 Required API Surface

At minimum:

```text
POST /scans
GET  /scans/{scan_id}
GET  /scans/{scan_id}/findings
GET  /scans/{scan_id}/cbom
GET  /scans/{scan_id}/risks
GET  /scans/{scan_id}/recommendations
```

The exact request/response contract must match `API_DB_SPEC.md`.

---

## 4.3 Database Responsibilities

Persist at minimum:

```text
Scan
Asset
CryptoFinding / Artifact
RiskAssessment
Recommendation
```

The database must support:

- scan history
- finding retrieval
- filtering by severity/algorithm/type
- CBOM reconstruction
- dashboard aggregates

Do not over-engineer the DB.

---

## 4.4 CBOM Responsibilities

Person 3 owns the final conversion from normalized findings + risk data into the project's CBOM representation.

Each CBOM entry should retain:

- artefact identity
- algorithm
- variant/key size when available
- category
- asset/file/location
- detection method
- confidence
- library/dependency information when available
- quantum status
- risk
- business/data-lifetime context where supplied
- recommendation
- evidence/reference

The implementation should follow the CBOM representation selected in `API_DB_SPEC.md`.

---

## 4.5 Person 3 — Day-by-Day Deliverables

### Day 1

- Scaffold FastAPI project
- Define shared schemas
- Set up database
- Implement health/status endpoint
- Agree scanner/risk interfaces with Persons 1 and 2

### Day 2

- Implement scan creation/intake
- Implement file/repository handling
- Implement scan state model
- Persist findings

### Day 3

- Integrate Person 1 scanner
- Implement CBOM construction
- Implement findings/results APIs

### Day 4

- Integrate Person 2 risk engine
- Persist risk/recommendation results
- Implement CBOM/risk/recommendation endpoints

### Day 5

- End-to-end pipeline working:

```text
upload → scan → detect → CBOM → risk → API
```

- Add aggregation endpoints for dashboard
- Add robust errors/validation

### Day 6

- Stabilize backend
- Demo dataset handling
- Performance cleanup
- Support frontend debugging
- Report/export only if core system is already stable

---

# 5. Person 4 — Frontend, Dashboard & Demo UX

## Primary Ownership

**Own the complete user-facing experience.**

This person answers:

> "Can a security analyst understand the organization's cryptographic posture and act on it?"

### Responsibilities

- Next.js/TypeScript application
- Dashboard
- Scan creation interface
- Scan progress/status UI
- Findings table
- Filtering/sorting/search
- CBOM explorer
- Risk detail page
- Recommendation display
- Repository/evidence viewer
- Charts/visualizations
- Error/loading states
- Final demo UX

### Ownership Boundary

Person 4 should not implement scanner or risk logic in the frontend. The UI consumes backend results through the API.

---

## 5.1 Required Pages

### A. Dashboard

Show:

```text
Total artefacts
Critical/high/medium/low findings
Quantum-vulnerable count
Algorithm distribution
Risk distribution
Recent scans
```

### B. New Scan

Support the prototype input options defined in the SRS:

```text
Git repository / repository URL
ZIP/source bundle
Binary
Container/image reference
Certificate
```

Only expose options that are genuinely implemented in the backend.

### C. Scan Progress

Show meaningful pipeline stages such as:

```text
Enumerating files
Parsing source
Scanning dependencies
Inspecting certificates
Building CBOM
Assessing risk
Generating recommendations
```

### D. Findings / CBOM Explorer

Table with at least:

```text
Algorithm
Variant/key size
Location
Artifact type
Severity
Quantum status
Confidence
Detection method
```

### E. Risk Detail

Show:

```text
Finding
Evidence
Why detected
Classical risk
Quantum risk
Data lifetime
Business criticality
Mosca-style result
Risk score
Migration priority
Recommendation
```

### F. Recommendations

Display:

```text
Current mechanism
Problem
Recommended transition
Priority
Reason
```

---

## 5.2 Person 4 — Day-by-Day Deliverables

### Day 1

- Scaffold frontend
- Define app routes
- Define reusable data types from API contract
- Build dashboard shell

### Day 2

- Build scan creation screen
- Build scan progress screen
- Add API integration skeleton

### Day 3

- Build findings table
- Build CBOM explorer
- Add filtering/search/sorting

### Day 4

- Build risk detail page
- Build recommendation view
- Add charts/summary cards

### Day 5

- Connect all backend endpoints
- Implement loading/error/empty states
- Verify complete end-to-end user flow

### Day 6

- Polish UI
- Fix presentation issues
- Make demo flow deterministic
- Add final charts/animations only after functionality works

---

# 6. Shared Work — ALL 4 PEOPLE

These activities are **not assigned to one person** because they require the complete system.

## A. Shared Data Contract

By the end of Day 1, all four must agree on:

```text
CryptoFinding
RiskAssessment
Recommendation
Scan
CBOM
```

No breaking schema changes after integration begins unless all four agree.

## B. Integration Testing

All four participate in testing:

```text
Repository
   ↓
Person 1 scanner
   ↓
Person 3 backend/CBOM
   ↓
Person 2 risk
   ↓
Person 3 API
   ↓
Person 4 frontend
```

## C. Demo Dataset

Everyone contributes to a single deterministic test repository containing deliberately known examples.

Minimum examples:

```text
RSA weak key
RSA modern key
AES
MD5
SHA-1
SHA-256
ECDSA/ECDH
crypto dependency
certificate
potential custom crypto
Dockerfile/container dependency
binary indicator
```

The team should also test against at least one suitable real open-source repository/library from the SIH-supported dataset strategy where feasible.

## D. Final Demo

All four should know the complete product flow. No single person should be the only person capable of running the demo.

---

# 7. Exact Feature Ownership Matrix

| Feature | P1 | P2 | P3 | P4 |
|---|---:|---:|---:|---:|
| File/repository discovery | **Owner** |  | Support |  |
| Regex detection | **Owner** |  |  |  |
| API detection | **Owner** |  |  |  |
| AST detection | **Owner** |  |  |  |
| Dependency detection | **Owner** |  | Integration |  |
| Certificate parsing | **Owner** |  | Integration | Display |
| Binary scanning | **Owner** |  | Integration | Display |
| Container scanning | **Owner** |  | **Integration owner** | Display |
| Custom crypto heuristics | **Owner** |  |  | Display |
| Finding normalization | **Owner** |  | **Integration owner** |  |
| Algorithm security classification |  | **Owner** |  |  |
| Quantum vulnerability |  | **Owner** |  | Display |
| Mosca-style assessment |  | **Owner** |  | Display |
| Risk scoring |  | **Owner** | Integration | Display |
| Recommendations |  | **Owner** | Integration | Display |
| Scan orchestration |  |  | **Owner** |  |
| Database |  |  | **Owner** |  |
| CBOM generation/storage | Support |  | **Owner** | Display |
| API |  |  | **Owner** | Consumer |
| Dashboard |  |  |  | **Owner** |
| Scan UI |  |  |  | **Owner** |
| Findings UI |  |  |  | **Owner** |
| Risk UI |  |  |  | **Owner** |
| Recommendations UI |  |  |  | **Owner** |
| Demo presentation | Support | Support | Support | **Owner** |
| Integration testing | **Shared** | **Shared** | **Shared** | **Shared** |

---

# 8. What Each Person Must Have Working Before Integration

## Person 1

```text
sample repository
    ↓
scanner
    ↓
normalized findings JSON
```

At least these must be reliably detected:

```text
RSA
AES
MD5
SHA-1/SHA-256
ECDSA/ECDH
known crypto dependency
```

Plus prototype support for certificate/custom/binary/container where time permits.

## Person 2

```text
normalized finding
    ↓
risk engine
    ↓
enriched risk + recommendation JSON
```

At least:

```text
quantum status
risk score
severity
Mosca-style result
migration priority
recommendation
reason
```

## Person 3

```text
asset
 ↓
scan job
 ↓
P1 findings
 ↓
P2 risk
 ↓
CBOM
 ↓
REST API
```

## Person 4

```text
API
 ↓
Dashboard
 ↓
Scan
 ↓
Results
 ↓
Finding detail
 ↓
Recommendation
```

---

# 9. Integration Milestones

## Milestone 1 — End of Day 1

All four agree on:

- architecture
- schemas
- endpoint contracts
- repository structure
- ownership boundaries

## Milestone 2 — End of Day 2

Person 1 can detect basic crypto.  
Person 2 can score hard-coded/sample findings.  
Person 3 can create a scan and persist data.  
Person 4 has the frontend shell and scan/results skeleton.

## Milestone 3 — End of Day 3

First real vertical slice:

```text
Upload repository
    ↓
Detect RSA/MD5/AES
    ↓
Store findings
    ↓
Calculate risk
    ↓
View results in UI
```

**This is the most important milestone.**

## Milestone 4 — End of Day 4

Add:

- dependency detection
- better AST detection
- risk detail
- recommendations
- CBOM explorer

## Milestone 5 — End of Day 5

Add and stabilize prototype-level:

- certificates
- binary indicators
- containers
- custom-crypto heuristics

Only if the core path is already stable.

## Milestone 6 — Day 6

Full integration, bug fixing, demo hardening and presentation polish.

---

# 10. Priority Rule When Time Runs Out

The team must **not** sacrifice the core end-to-end pipeline to add more scanner types.

Priority order:

```text
P0 — MUST WORK

1. Source repository scanning
2. Crypto API/AST detection
3. Dependency detection
4. Normalized findings
5. CBOM
6. Quantum-risk classification
7. Risk scoring
8. Mosca-style assessment
9. Recommendations
10. Dashboard + finding detail

P1 — SHOULD WORK

11. Certificate scanning
12. Binary scanning
13. Container scanning
14. Custom-crypto heuristics
15. Export/report

P2 — NICE TO HAVE

16. More languages
17. Advanced binary analysis
18. Cloud/infrastructure connectors
19. Enterprise authentication
20. Advanced deployment/distributed scanning
```

**Rule:** Never delay P0 functionality because a P1 scanner is unfinished.

---

# 11. Definition of Done

The project is considered demo-ready when a fresh run can reliably perform:

```text
1. User selects a repository.
2. System starts a scan.
3. Crypto artefacts are discovered.
4. Findings include evidence and confidence.
5. Dependencies are identified.
6. Findings are normalized into a CBOM.
7. Quantum/classical risk is assessed.
8. Mosca-style context is shown.
9. Migration recommendations are generated.
10. Results are visible in the dashboard.
11. A user can open a finding and understand why it was flagged.
12. The complete flow works without manual database edits or hard-coded UI results.
```

Hard-coded **demo data may be included as a fallback dataset**, but the primary demonstration must show the actual scan pipeline producing the displayed findings.

---

# 12. Collaboration Rules

## Rule 1 — Shared schemas first

No coding around incompatible data structures.

## Rule 2 — Small, frequent integration

Do not wait until the final day to merge all components.

## Rule 3 — Every owner must expose usable interfaces

A module is not complete merely because its internal code works. It must be callable by the rest of the system.

## Rule 4 — Deterministic demo

The demo repository and expected findings must be known in advance.

## Rule 5 — No scope creep

Do not add AI, cloud scanning, Kubernetes, full reverse engineering, or additional languages until the P0 flow is stable.

---

# 13. Final Ownership Summary

```text
PERSON 1
Discovery + Detection
"What crypto is here?"

PERSON 2
Risk + Quantum + Recommendations
"How dangerous is it and what should we do?"

PERSON 3
Backend + DB + CBOM + Integration
"How does everything connect and persist?"

PERSON 4
Frontend + Dashboard + Demo UX
"How does the analyst understand and use it?"
```

The four people together own the final integration. **No module is considered complete until it works through the shared interfaces and contributes to the end-to-end scan flow.**
