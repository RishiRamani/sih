# ECDAT — Exact 4-Person Work Division

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement:** SIH26164  
**Team:** Rishi, Arnav, Shubh, Rachit  
**Implementation Window:** 5–6 days  
**Source of Truth:** `SRS.md` + `SYSTEM_DESIGN.md`

---

## 1. Division Principle

The project is divided into four **independently implementable core ownership areas** with clearly defined interfaces.

```text
                     ┌─────────────────────┐
                     │   Asset Intake/API   │
                     └──────────┬──────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ↓                  ↓                  ↓
       Source Scanner     Asset Scanners      Intelligence
       (Arnav)             (Rachit)             (Shubh)
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ↓
                    Normalization + CBOM
                           (Rishi)
                                │
                                ↓
                         Risk / Recommendations
                             (Shubh)
                                │
                                ↓
                         API + Frontend
                    (shared secondary work)
```

The goal is **not** to give one person the entire frontend or one person all integration work. Every member owns a meaningful core subsystem and a small portion of the visible product.

---

# 2. Exact Ownership

## Person 1 — Rishi

### Primary ownership: Orchestration, Normalization, CBOM and System Integration

Rishi owns the central pipeline that turns independent scanner output into the final ECDAT result.

### Files / Modules

```text
backend/
├── api/
│   ├── scans.py
│   ├── findings.py
│   ├── cbom.py
│   ├── risk.py
│   └── recommendations.py
├── orchestration/
│   ├── scan_manager.py
│   ├── dispatcher.py
│   └── lifecycle.py
├── normalization/
│   ├── normalizer.py
│   └── deduplication.py
├── cbom/
│   ├── generator.py
│   └── serializer.py
└── integration/
    └── pipeline.py
```

### Responsibilities

1. Scan lifecycle and orchestration.
2. Route an input asset to the correct scanner(s).
3. Define and enforce the canonical finding schema.
4. Normalize outputs from all scanners.
5. Deduplicate findings from multiple detection methods.
6. Generate the internal CBOM representation.
7. Connect the risk engine to the normalized findings.
8. Connect recommendations to the final result.
9. Expose the core FastAPI endpoints.
10. Own end-to-end integration and final debugging.
11. Ensure scan status transitions work correctly.
12. Ensure all output is traceable back to evidence.

### Exact deliverable

Given any scanner output conforming to the shared finding contract:

```text
scanner output
      ↓
normalized finding
      ↓
CBOM record
      ↓
risk analysis
      ↓
recommendation
      ↓
API response
```

Rishi does **not** implement the source detector, risk rules, or individual asset scanners. Those are owned by the other members.

### Secondary visible-product ownership

- Dashboard shell / overall result layout.
- Overall scan result integration.
- Final end-to-end UX consistency.

---

## Person 2 — Arnav

### Primary ownership: Source-Code Cryptographic Detection Engine

Arnav owns all source-code discovery logic.

### Files / Modules

```text
scanner/
└── source/
    ├── file_enumerator.py
    ├── regex_detector.py
    ├── api_detector.py
    ├── ast_detector.py
    ├── algorithm_rules.py
    ├── key_size_extractor.py
    ├── custom_crypto.py
    └── source_scanner.py
```

### Responsibilities

1. Enumerate supported source files.
2. Regex / lexical cryptographic detection.
3. Cryptographic API/function signature detection.
4. AST-based detection for supported languages.
5. Identify algorithms and primitive types.
6. Extract key sizes, modes and other parameters when available.
7. Produce source evidence such as file, line and code context.
8. Implement detection confidence.
9. Implement suspicious/custom crypto heuristics.
10. Support the prototype languages defined in the SRS.
11. Emit findings using the canonical finding contract.

### Detection layers

```text
Source File
    │
    ├── Regex
    ├── API Signature
    ├── AST
    └── Custom-Crypto Heuristics
             ↓
      Source Finding
```

### Exact deliverable

Input:

```text
repository / source directory
```

Output:

```json
{
  "artifact_type": "source",
  "algorithm": "RSA",
  "variant": "RSA-1024",
  "file": "backend/auth.py",
  "line": 48,
  "detection_method": "AST",
  "confidence": 0.97,
  "evidence": "RSA.generate(1024)"
}
```

Arnav does **not** calculate business risk, CBOM structure, or migration recommendations.

### Secondary visible-product ownership

- Finding detail view.
- Evidence/code-location display.
- Detection-method and confidence presentation.

---

## Person 3 — Shubh

### Primary ownership: Cryptographic Intelligence, Risk and Migration Recommendation Engine

Shubh owns the interpretation of findings after discovery.

### Files / Modules

```text
intelligence/
├── crypto_kb.py
├── algorithm_classification.py
├── classical_risk.py
├── quantum_risk.py
├── mosca.py
├── risk_score.py
├── business_context.py
├── migration.py
└── recommendations.py
```

### Responsibilities

1. Maintain the supported cryptographic algorithm knowledge base.
2. Classify primitive type and security status.
3. Assess classical weaknesses.
4. Determine quantum-vulnerability status.
5. Account for key size where applicable.
6. Accept data lifetime as a contextual input.
7. Accept business criticality as a contextual input.
8. Compare protection lifetime and migration timeline using the defined Mosca-style approach.
9. Produce a normalized risk score.
10. Map risk score to severity.
11. Produce an explainable reason for the risk.
12. Generate migration recommendations.
13. Distinguish KEM/key-establishment recommendations from signature recommendations.
14. Assign migration priority.

### Risk flow

```text
Normalized Finding
        ↓
Algorithm Classification
        ↓
Classical Security
        ↓
Quantum Vulnerability
        ↓
Data Lifetime + Business Criticality
        ↓
Mosca-style Assessment
        ↓
Risk Score / Severity
        ↓
Migration Recommendation
```

### Exact deliverable

Input:

```json
{
  "algorithm": "RSA",
  "key_size": 1024,
  "business_criticality": "HIGH",
  "data_lifetime_years": 10,
  "migration_time_years": 4
}
```

Output:

```json
{
  "quantum_vulnerable": true,
  "classical_risk": "HIGH",
  "risk_score": 94,
  "severity": "CRITICAL",
  "mosca_status": "MIGRATION_WINDOW_AT_RISK",
  "recommendation": "Evaluate a hybrid transition and an appropriate post-quantum replacement",
  "migration_priority": "IMMEDIATE"
}
```

### Secondary visible-product ownership

- Risk-detail visualization.
- Risk explanation section.
- Migration recommendation screen.
- Mosca-style timeline visualization.

---

## Person 4 — Rachit

### Primary ownership: Non-Source Asset Discovery

Rachit owns all discovery paths that are outside the main source-code detector.

### Files / Modules

```text
scanner/
├── dependency/
│   ├── manifest_parser.py
│   ├── library_detector.py
│   └── dependency_scanner.py
├── certificate/
│   ├── certificate_parser.py
│   └── certificate_scanner.py
├── binary/
│   ├── strings.py
│   ├── symbols.py
│   ├── signatures.py
│   └── binary_scanner.py
└── container/
    ├── image_inspector.py
    ├── package_detector.py
    └── container_scanner.py
```

### Responsibilities

#### Dependency / Library scanning

1. Parse supported dependency manifests.
2. Identify cryptographic libraries.
3. Extract library names and versions.
4. Map libraries to known crypto capabilities where supported.

#### Certificate scanning

5. Parse PEM/DER certificates.
6. Extract issuer, subject and validity.
7. Extract public-key algorithm and key size.
8. Extract signature algorithm.
9. Produce certificate findings.

#### Binary scanning

10. Inspect strings.
11. Inspect symbols/imports where available.
12. Match known crypto library indicators and signatures.
13. Produce confidence-rated binary findings.
14. Avoid executing untrusted uploaded binaries.

#### Container scanning

15. Inspect Dockerfile/image metadata.
16. Identify installed crypto-related packages/libraries.
17. Reuse binary/dependency detection logic where possible.
18. Produce container findings.

### Exact deliverable

Each module emits the **same normalized pre-CBOM finding contract** as Arnav's source scanner.

```text
Dependency ───┐
Certificate ──┤
Binary ───────┼──→ Finding Contract
Container ────┘
```

### Secondary visible-product ownership

- New Scan asset-type selection.
- Scan progress stages for dependency/certificate/binary/container analysis.
- CBOM table filters for source/dependency/binary/container/certificate artefacts.

---

# 3. Shared Finding Contract

This is the single most important interface between members.

No scanner should invent its own output format.

Every scanner must be able to produce at least:

```json
{
  "artifact_type": "source | dependency | certificate | binary | container",
  "algorithm": "string | null",
  "primitive_type": "symmetric | asymmetric | hash | signature | key_exchange | protocol | custom | unknown",
  "variant": "string | null",
  "key_size": "integer | null",
  "library": "string | null",
  "library_version": "string | null",
  "asset_path": "string",
  "line_start": "integer | null",
  "line_end": "integer | null",
  "detection_method": "string",
  "confidence": "float",
  "evidence": "string | null"
}
```

Rishi owns normalization, but **all four members must code to this contract**.

---

# 4. Secondary Shared Work — Frontend

Frontend is **not assigned to one person**.

Each member owns the UI that corresponds to their core subsystem:

| Person | UI responsibility |
|---|---|
| Rishi | Dashboard shell + overall scan/result integration |
| Arnav | Finding detail + source evidence |
| Shubh | Risk detail + recommendations + Mosca visualization |
| Rachit | Scan input/progress + CBOM filters/table |

The frontend uses the same backend APIs and data models. No member should create a separate data model purely for their UI.

---

# 5. Workload Balance

The work is intentionally divided into approximately four comparable work packages:

| Person | Core engineering scope | Integration load | UI scope |
|---|---|---|---|
| Rishi | Orchestration + normalization + CBOM + API integration | High | Moderate |
| Arnav | Source detection engine | Low | Moderate |
| Shubh | Risk + quantum + recommendations | Medium | Moderate |
| Rachit | Dependency + certificate + binary + container scanning | Medium | Moderate |

### Important balancing rule

Rishi owns **system integration**, but that does **not** mean Rishi writes everyone else's code or finishes unfinished modules for them.

Each owner must deliver a functioning module against the shared interfaces.

Similarly, Rachit's four scanner categories are intentionally lighter-weight static inspection modules and reuse common parser/signature utilities where possible; they are not four separate full-scale analysis systems.

---

# 6. Day-by-Day Assignment

## Day 1 — Contracts and Skeletons

### Rishi
- Freeze finding schema.
- Freeze scan lifecycle.
- Create API skeleton.
- Create orchestration skeleton.
- Create CBOM skeleton.

### Arnav
- Create source scanner structure.
- Implement file enumeration.
- Implement initial regex/API signatures.

### Shubh
- Create crypto knowledge base structure.
- Define algorithm classification.
- Define risk inputs/outputs.
- Define first risk rules.

### Rachit
- Create dependency/certificate/binary/container scanner structures.
- Implement manifest parsing skeleton.
- Implement certificate parsing skeleton.

### End-of-day requirement

All four members commit code that can be imported by the rest of the system.

---

## Day 2 — First Working Modules

### Rishi
- Finish orchestration and normalization contracts.
- Implement scan status lifecycle.
- Implement storage models needed for findings/scans.

### Arnav
- Implement AST detection.
- Implement algorithm/key-size extraction.
- Implement confidence calculation.

### Shubh
- Implement classical + quantum classification.
- Implement first risk score.
- Implement explainable risk output.

### Rachit
- Finish dependency detection.
- Finish certificate parser.
- Start binary signatures/import detection.

### End-of-day requirement

A real source repository should produce normalized findings and a risk result through code, even if the frontend is incomplete.

---

## Day 3 — End-to-End Vertical Slice

### Rishi
- Connect source scanner → normalizer → CBOM → risk engine → API.
- Persist scan/finding data.

### Arnav
- Improve detector coverage.
- Add custom crypto heuristics.
- Add evidence extraction.

### Shubh
- Implement Mosca-style calculation.
- Add business criticality/data lifetime inputs.
- Implement migration recommendations.

### Rachit
- Finish binary scanner.
- Implement container/package inspection.
- Normalize all non-source scanner outputs.

### End-of-day hard milestone

```text
Repository
   ↓
Source detection
   ↓
Normalized findings
   ↓
CBOM
   ↓
Risk
   ↓
Recommendation
   ↓
API response
```

must work for at least one complete test repository.

---

## Day 4 — Product Completion

### Rishi
- Finish API coverage.
- Connect frontend data flow.
- Fix pipeline/integration defects.

### Arnav
- Increase source detection coverage.
- Reduce false positives.
- Finalize source evidence output.

### Shubh
- Finalize risk scoring.
- Finalize recommendation mappings.
- Finalize explanations and migration priority.

### Rachit
- Stabilize dependency/certificate/binary/container scanners.
- Improve error handling for unsupported inputs.
- Finalize non-source evidence output.

### Shared frontend work

Each member builds their assigned screens/components.

---

## Day 5 — Integration and Demo Dataset

### Rishi
- Full integration testing.
- Scan history/report integration.
- Performance and failure-path cleanup.

### Arnav
- Prepare curated source-code test cases.
- Validate expected detections.
- Fix source scanner regressions.

### Shubh
- Validate risk outputs against curated findings.
- Prepare example risk scenarios.
- Ensure recommendation explanations are consistent.

### Rachit
- Prepare dependency, certificate, binary and container test inputs.
- Validate expected outputs.
- Fix scanner regressions.

### Shared goal

Create one deterministic demonstration dataset containing:

```text
RSA
AES
SHA-1 / MD5
ECDSA / ECDH
legacy dependency
certificate
binary indicator
container dependency
suspicious custom crypto
```

---

## Day 6 — Hardening / Buffer

### Everyone

- Fix crashes.
- Fix integration issues.
- Validate complete scan pipeline.
- Run the final demo dataset.
- Improve loading/error states.
- Verify CBOM output.
- Verify risk and recommendation consistency.
- Remove unfinished features from the demo.

### Rishi
Final system integration owner.

### Arnav
Final source-detection owner.

### Shubh
Final risk/intelligence owner.

### Rachit
Final non-source-scanning owner.

---

# 7. Integration Rules

## Rule 1 — Shared contracts first

No member changes the canonical finding structure casually.

If a field must change, all affected modules are updated together.

## Rule 2 — Modules must work independently

Every core subsystem should have a simple direct test.

Examples:

```text
source_scanner(repo) → findings
risk_engine(finding) → risk
cbom_generator(findings) → cbom
binary_scanner(file) → findings
```

## Rule 3 — No hidden logic in the frontend

The frontend only displays backend results.

It must not independently calculate:

- risk scores;
- quantum vulnerability;
- recommendations;
- CBOM semantics.

## Rule 4 — No arbitrary scope expansion

Nobody adds major features during the last two days unless the core end-to-end path already works.

---

# 8. Definition of Done for Each Person

## Rishi

```text
[ ] scan can be created
[ ] scanners can be dispatched
[ ] findings are normalized
[ ] duplicates are handled
[ ] CBOM is generated
[ ] API exposes final results
[ ] end-to-end pipeline works
```

## Arnav

```text
[ ] source files are enumerated
[ ] regex detection works
[ ] API detection works
[ ] AST detection works
[ ] algorithm/key size extraction works
[ ] evidence is captured
[ ] confidence is assigned
[ ] custom crypto heuristic works
```

## Shubh

```text
[ ] algorithm knowledge base exists
[ ] classical risk works
[ ] quantum classification works
[ ] data lifetime is supported
[ ] business criticality is supported
[ ] Mosca-style assessment works
[ ] risk score works
[ ] recommendations work
```

## Rachit

```text
[ ] dependency scanning works
[ ] certificate scanning works
[ ] binary scanning works
[ ] container scanning works
[ ] all outputs follow finding contract
[ ] unsupported input handling works
```

---

# 9. Final Ownership Map

```text
RISHI
─────
Scan orchestration
Normalization
Deduplication
CBOM
FastAPI integration
End-to-end integration
Dashboard shell

ARNAV
─────
Source scanning
Regex detection
API signatures
AST detection
Key-size extraction
Custom crypto heuristics
Source evidence
Finding detail UI

SHUBH
──────
Crypto knowledge base
Classical risk
Quantum risk
Mosca-style analysis
Business context
Risk scoring
PQC / hybrid recommendations
Risk + recommendation UI

RACHIT
──────
Dependency scanning
Library detection
Certificate scanning
Binary scanning
Container scanning
Non-source evidence
Scan input/progress UI
CBOM table UI
```

---

# 10. The One Rule That Matters Most

The team should not aim for:

> **“Everyone finishes their entire module separately.”**

The real milestone is:

> **“A real repository can be scanned, cryptographic artefacts can be detected, normalized into a CBOM, assigned a quantum/classical risk, given a migration recommendation, and displayed in the product.”**

Everything else is expansion, coverage and polish.
