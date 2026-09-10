# Software Requirements Specification (SRS)
## Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)

**Problem Statement:** SIH 2026 – SIH26164  
**Organization:** National Technical Research Organisation (NTRO)  
**Team Size:** 4 developers  
**Implementation Window:** 5–6 days for the working prototype  
**Document Status:** Baseline requirements for prototype development  

---

## 1. Purpose

ECDAT is a cryptographic discovery, inventory, quantum-risk assessment, and migration-assistance platform. The system scans software artefacts, identifies cryptographic usage, normalizes findings into a Cryptography Bill of Materials (CBOM), evaluates quantum-readiness risk, and recommends appropriate post-quantum or hybrid migration options.

This SRS is the **baseline product contract for the team**. Architecture, database schema, API design, scanner design, UI, testing, and demo behavior should be derived from the requirements and scope defined here. Any feature not defined here is not part of the prototype unless the team explicitly revises this document.

The SIH problem statement asks for identification and cataloguing of cryptographic artefacts across applications, products, and infrastructure; quantum-risk assessment; classification by type, lifetime, and business criticality; use of a framework such as Mosca's algorithm/inequality; recommendations for PQC/hybrid alternatives; scanning of source repositories, binaries, libraries, and container images; standardized reporting; and an interactive GUI. ECDAT therefore treats **discovery → normalized inventory/CBOM → risk → recommendation → visualization/reporting** as its primary end-to-end workflow.

---

## 2. Problem Definition

Organizations frequently use cryptography indirectly through libraries, SDKs, dependencies, protocols, certificates, and embedded components. Cryptographic usage can also exist in several representations at the same time:

- directly in source code;
- through imported cryptographic libraries;
- in compiled binaries;
- inside container images;
- in configuration and certificate files.

A migration to post-quantum cryptography cannot be planned reliably without first knowing **what cryptography exists, where it is used, what implementation it belongs to, how important the system is, and how long the protected information must remain secure**.

ECDAT addresses this by producing a traceable cryptographic inventory and translating technical findings into migration-oriented risk information.

---

## 3. Objectives

### 3.1 Primary Objectives

1. Discover cryptographic artefacts from supported software inputs.
2. Identify algorithm family, variant, key/parameter size, mode, library, protocol, certificate, and usage context whenever observable.
3. Preserve evidence showing **where and how a finding was detected**.
4. Normalize heterogeneous scanner findings into a common internal representation.
5. Generate a CBOM aligned with the CycloneDX cryptographic-asset model.
6. Classify artefacts by type, data lifetime, and business criticality.
7. Calculate quantum-readiness risk using a configurable Mosca-style assessment.
8. Recommend appropriate PQC or hybrid migration options.
9. Provide an interactive dashboard for scans, findings, risks, CBOMs, and recommendations.
10. Produce a standardized machine-readable CBOM and a human-readable report.

### 3.2 Secondary Objectives

1. Provide confidence scores so users can distinguish strong detections from heuristic detections.
2. Correlate source, dependency, binary, library, and container evidence belonging to the same application or component.
3. Make scanning deterministic and reproducible for a given input and scanner version.
4. Make the scanner architecture extensible so new languages, libraries, algorithms, and input types can be added later.

### 3.3 Explicit Non-Objective

ECDAT will **not claim perfect discovery of arbitrary proprietary, dynamically generated, obfuscated, or home-grown cryptography**. The system must report coverage limitations and confidence rather than presenting heuristic guesses as ground truth.

---

## 4. Scope

### 4.1 In-Scope Prototype Capabilities

The prototype SHALL provide:

- source repository ingestion;
- source-code cryptographic discovery;
- dependency/library discovery;
- certificate/configuration discovery where files are available to the scan;
- binary inspection for detectable cryptographic indicators;
- container image inspection for packages, binaries, libraries, certificates, and configuration artefacts;
- common finding normalization;
- CBOM generation;
- cryptographic inventory and search/filtering;
- quantum-risk assessment;
- data-lifetime and business-criticality inputs;
- PQC/hybrid recommendation engine;
- scan result dashboard;
- finding detail view with evidence;
- report generation/export;
- scan history;
- basic validation, error handling, and safe input limits.

### 4.2 Out of Scope for the 5–6 Day Prototype

The following are explicitly not required for the prototype:

- guaranteed discovery of custom/home-grown cryptographic algorithms;
- deep dynamic instrumentation of running applications;
- live enterprise-wide network traffic discovery;
- direct scanning of arbitrary cloud accounts;
- hardware/HSM firmware reverse engineering;
- automated source-code modification or migration;
- automatic deployment of PQC changes into production;
- full enterprise identity and role administration;
- multi-tenant SaaS functionality;
- continuous background fleet scanning;
- distributed scan clusters;
- formal compliance certification.

The architecture may leave extension points for these features, but they must not delay completion of the working prototype.

---

## 5. Users and Primary Use Cases

### 5.1 Primary User

**Security / Cryptography Analyst**

Needs to understand where cryptography is used, which artefacts require attention, how severe the quantum migration problem is, and what should be migrated first.

### 5.2 Secondary User

**Application / DevSecOps Engineer**

Needs precise finding locations, dependency information, affected components, and practical migration recommendations.

### 5.3 Core Use Cases

#### UC-01: Create Scan
User selects a repository, binary set, or container image and starts a scan.

#### UC-02: Review Scan Progress
User sees scan state, supported input type, progress, errors, and completion status.

#### UC-03: Inspect Cryptographic Findings
User views each discovered artefact with algorithm, implementation information, evidence, location, and confidence.

#### UC-04: Review CBOM
User views the generated cryptographic inventory and exports a standardized CBOM.

#### UC-05: Assess Quantum Risk
User provides or confirms data lifetime and business criticality, then views calculated risk and Mosca-style assessment results.

#### UC-06: Review Recommendations
User receives migration recommendations and rationale for affected cryptographic artefacts.

#### UC-07: Generate Report
User exports a report summarizing inventory, high-risk findings, recommendations, scan coverage, and limitations.

#### UC-08: Compare / Re-scan
User repeats a scan after code or dependency changes and can compare result counts and risk changes at a high level.

---

## 6. Product Workflow

The complete product flow SHALL be:

```text
Input
  |
  +--> Source Repository
  +--> Binary / Library
  +--> Container Image
  |
  v
Ingestion & File Classification
  |
  v
Specialized Discovery Engines
  |        |        |
  |        |        +--> Container/package inspection
  |        +-----------> Binary/library inspection
  +--------------------> Source/AST/dependency inspection
  |
  v
Raw Findings + Evidence
  |
  v
Normalization / Deduplication
  |
  v
Cryptographic Inventory
  |
  +--> CBOM Generation
  |
  +--> Risk Assessment
  |       |
  |       +--> Algorithm risk
  |       +--> Quantum vulnerability
  |       +--> Data lifetime
  |       +--> Business criticality
  |       +--> Migration time
  |       +--> Mosca-style assessment
  |
  v
PQC / Hybrid Recommendations
  |
  v
Dashboard + Report + Export
```

A finding must remain traceable through this pipeline. At minimum, a user should be able to move from a dashboard risk to the affected cryptographic artefact and then to the evidence that caused the detection.

---

## 7. Functional Requirements

### 7.1 Project and Scan Management

**FR-01** The system SHALL allow a user to create a scan/project.

**FR-02** The system SHALL accept supported inputs from local upload and/or a repository URL as defined by the implementation.

**FR-03** The system SHALL identify the input type (source repository, binary/library set, or container image/archive) before analysis.

**FR-04** The system SHALL create a unique scan identifier.

**FR-05** The system SHALL track scan status using at least: `queued`, `running`, `completed`, `failed`.

**FR-06** The system SHALL record scan start/end time and scanner/tool version.

**FR-07** The system SHALL expose scan errors without exposing internal secrets or stack traces to normal users.

**FR-08** The system SHALL enforce file count, archive size, extracted size, and execution-time limits appropriate for a local prototype.

---

### 7.2 Source-Code Discovery

**FR-09** The system SHALL scan supported source files for recognizable cryptographic APIs, constructors, imports, invocations, constants, configuration patterns, and algorithm names.

**FR-10** The source scanner SHALL support a practical set of languages for the prototype. Initial target languages SHOULD prioritize Python, JavaScript/TypeScript, Java, C/C++, and Go where parser/tooling support can be completed within the implementation window.

**FR-11** The scanner SHALL distinguish direct API usage from name-only textual matches where possible.

**FR-12** The scanner SHOULD use AST-aware analysis for supported languages to reduce false positives.

**FR-13** Each source finding SHALL preserve evidence sufficient to identify the source file and line or source range when available.

**FR-14** The scanner SHOULD recognize common libraries and APIs including OpenSSL and standard language cryptography APIs where practical.

**FR-15** The scanner SHALL record confidence for each discovery.

**FR-16** The scanner SHOULD detect likely cryptographic constants/patterns as lower-confidence evidence when no explicit API call is available.

**FR-17** The scanner SHALL report unsupported language/file types in scan coverage rather than silently ignoring them.

---

### 7.3 Dependency and Library Discovery

**FR-18** The system SHALL inspect supported dependency manifests and package metadata.

**FR-19** Initial dependency formats SHOULD include `requirements.txt`, `package.json`, `go.mod`, Maven/Gradle metadata, and common C/C++ package/build metadata when feasible.

**FR-20** The system SHALL identify cryptography-related dependencies using a maintained registry or mapping.

**FR-21** Where dependency versions are available, the system SHALL store the exact version.

**FR-22** The system SHALL distinguish a dependency being present from evidence that a specific cryptographic primitive is actually invoked.

**FR-23** A dependency-only finding SHALL have lower evidentiary specificity than a direct source/API finding unless stronger evidence exists.

---

### 7.4 Certificate and Configuration Discovery

**FR-24** The system SHOULD recognize common certificate formats such as PEM/DER-backed X.509 certificates when the raw files are present.

**FR-25** The system SHOULD extract certificate algorithm, public-key type/size, signature algorithm, validity period, subject/issuer summary, and source location when parseable.

**FR-26** Private key material SHALL NOT be displayed in reports or stored as raw secret content.

**FR-27** The system SHOULD detect common protocol/configuration indicators such as TLS, SSH, IPsec, or cryptographic configuration references when available in source/configuration files.

---

### 7.5 Binary and Library Inspection

**FR-28** The system SHALL accept supported binary/library artefacts for inspection.

**FR-29** The binary scanner SHALL inspect available metadata, imported/exported symbols, linked libraries, strings, and other safe static indicators.

**FR-30** The binary scanner SHALL NOT execute uploaded binaries as part of the default scan.

**FR-31** The scanner SHOULD recognize known cryptographic library indicators such as OpenSSL/libcrypto symbols or linked artefacts where detectable.

**FR-32** The binary scanner SHOULD detect recognizable algorithm constants or signatures only when confidence and evidence can be recorded.

**FR-33** Binary findings SHALL identify the binary path/name and evidence type.

**FR-34** The system SHALL clearly label heuristic binary detections and unsupported binaries.

---

### 7.6 Container Image Inspection

**FR-35** The system SHALL support scanning a container image or exported image/archive using a safe, non-executing inspection path.

**FR-36** The container scanner SHALL inspect image/package metadata and filesystem contents where available.

**FR-37** The scanner SHALL reuse the same binary, library, certificate, configuration, and dependency detection logic where practical.

**FR-38** The system SHALL associate findings with the container image and, where available, image digest/tag and package path.

**FR-39** The system SHALL report the image/package layer or path when practical, while avoiding unnecessary storage of complete image contents.

**FR-40** Container scanning SHALL have extraction/resource limits to prevent decompression/resource exhaustion during demonstration and evaluation.

---

### 7.7 Finding Normalization and Deduplication

**FR-41** All scanner outputs SHALL be transformed into one normalized finding model.

**FR-42** A normalized finding SHALL contain, where known:

- unique finding ID;
- scan ID;
- asset/component identifier;
- artefact type;
- algorithm family;
- algorithm variant/mode;
- primitive/function;
- key/parameter size;
- library/component name;
- library/component version;
- protocol;
- certificate metadata;
- source location/path;
- binary/container location;
- detection method;
- evidence summary;
- confidence;
- first-seen/scan metadata.

**FR-43** The system SHALL prevent obvious duplicate findings caused by multiple detectors identifying the same underlying artefact.

**FR-44** The system SHALL retain multiple evidence sources when they materially strengthen confidence.

---

### 7.8 Cryptographic Inventory / CBOM

**FR-45** The system SHALL generate a cryptographic inventory from normalized findings.

**FR-46** The CBOM SHALL follow the CycloneDX cryptographic-asset model rather than inventing a completely unrelated format.

**FR-47** The generated CBOM SHALL represent cryptographic assets including algorithms and, when available, certificates, protocols, keys/related cryptographic material metadata, and relationships to software components.

**FR-48** The CBOM SHALL preserve enough source/evidence metadata for traceability to the scan result.

**FR-49** The system SHALL export machine-readable JSON.

**FR-50** The system SHOULD export a human-readable inventory/report separately from the machine-readable CBOM.

**FR-51** The system SHALL record the CBOM/specification version used for generation.

---

### 7.9 Cryptographic Classification

**FR-52** Every finding SHALL be classified by cryptographic artefact type where possible, such as:

- algorithm;
- certificate;
- protocol;
- library/component;
- public key;
- secret/private key metadata (without raw secret storage);
- related cryptographic material;
- implementation evidence.

**FR-53** The system SHALL allow users to provide or override:

- data lifetime;
- business criticality;
- migration/effort estimate where appropriate.

**FR-54** The system SHALL distinguish automatically detected values from user-supplied values.

---

### 7.10 Quantum Risk Assessment

**FR-55** The system SHALL determine whether a detected algorithm is considered quantum-vulnerable, quantum-reduced, or comparatively quantum-resilient according to the configured cryptographic knowledge base.

**FR-56** The system SHALL separate classical security weakness from quantum-specific risk where possible.

**FR-57** The system SHALL support a configurable Mosca-style calculation using:

```text
Data Lifetime + Migration Time > Expected CRQC Arrival Time
```

The exact numerical horizon SHALL be configurable rather than hard-coded as an unquestionable fact.

**FR-58** The system SHALL account for at least:

- algorithm class;
- key/parameter size where relevant;
- data lifetime;
- business criticality;
- migration time;
- expected CRQC arrival assumption.

**FR-59** The system SHALL produce a risk category for each applicable artefact. Initial categories SHALL be:

- Critical;
- High;
- Medium;
- Low;
- Informational / Not currently quantifiable.

**FR-60** The system SHALL display the main factors contributing to the risk result.

**FR-61** The system SHALL allow a user to update business criticality and lifetime and recalculate risk without re-running discovery, unless the underlying cryptographic evidence changes.

**FR-62** The system SHOULD calculate an overall scan-level risk summary from individual findings.

---

### 7.11 PQC and Hybrid Recommendation Engine

**FR-63** The system SHALL maintain a recommendation mapping based on cryptographic purpose, not merely on algorithm name.

**FR-64** Recommendations SHALL distinguish at least:

- key establishment / KEM;
- digital signature;
- symmetric encryption;
- hashing / integrity.

**FR-65** Initial finalized NIST PQC recommendations SHALL prioritize ML-KEM, ML-DSA, and SLH-DSA as applicable to the use case.

**FR-66** The recommendation engine SHALL support hybrid migration recommendations where appropriate rather than forcing a pure-PQC replacement in every case.

**FR-67** Recommendations SHALL include a rationale.

**FR-68** Recommendations SHOULD include practical trade-off metadata such as relative performance/size considerations and migration complexity.

**FR-69** The system SHALL NOT recommend experimental or non-finalized algorithms as if they were finalized mandatory standards. Future candidates may be represented separately as future/experimental options.

**FR-70** For symmetric cryptography, the system SHOULD explain that quantum risk differs from the direct breakability of current public-key cryptography and may result in recommendations such as stronger key sizes rather than a PQC algorithm substitution.

---

### 7.12 Dashboard and Visualization

**FR-71** The GUI SHALL provide a scan overview showing:

- total findings;
- cryptographic artefact counts;
- risk distribution;
- top risky algorithms/components;
- scan coverage;
- scan status.

**FR-72** The GUI SHALL provide a findings table with search, filtering, and sorting.

**FR-73** Minimum useful filters SHOULD include:

- risk level;
- artefact type;
- algorithm;
- source/input type;
- confidence;
- component/library;
- scan.

**FR-74** Selecting a finding SHALL show evidence and contextual metadata.

**FR-75** The GUI SHALL provide a CBOM view.

**FR-76** The GUI SHALL provide a risk view explaining why a finding has its assigned risk.

**FR-77** The GUI SHALL provide recommendation details for actionable findings.

**FR-78** The GUI SHOULD include at least one visual summary such as a risk-distribution chart and/or algorithm-family distribution chart.

**FR-79** The GUI SHALL clearly distinguish facts detected by the scanner from user-provided assumptions.

---

### 7.13 Reporting and Export

**FR-80** The system SHALL generate a report containing:

- scan metadata;
- input summary;
- cryptographic inventory;
- high-risk findings;
- risk methodology/assumptions;
- recommendations;
- scan coverage and unsupported inputs;
- limitations.

**FR-81** The system SHALL export the standardized CBOM as JSON.

**FR-82** The system SHOULD export a human-readable report as PDF and/or HTML, depending on the final implementation time.

**FR-83** Reports SHALL include generation time and scanner/version metadata.

---

### 7.14 Scan Comparison / Change Awareness

**FR-84** The system SHOULD support comparing two completed scans of the same project.

**FR-85** Comparison SHOULD report added, removed, or changed cryptographic findings and risk totals.

This feature is lower priority than the first end-to-end scan and may be dropped if it threatens core completion.

---

## 8. Cryptographic Detection Coverage for the Prototype

The team SHALL define a controlled initial knowledge base rather than attempting to enumerate every cryptographic algorithm in existence.

### 8.1 Initial Algorithm Families

The prototype SHOULD prioritize high-value, commonly encountered families such as:

- AES and common modes (GCM, CBC, CTR);
- RSA;
- ECC/ECDSA/ECDH/EdDSA where identifiable;
- DH/ECDH key exchange indicators;
- SHA-1, SHA-2 family, SHA-3 family;
- MD5;
- HMAC;
- ChaCha20/Poly1305;
- 3DES/DES;
- common TLS/SSL and SSH indicators;
- X.509 certificates;
- common cryptographic libraries such as OpenSSL/libcrypto and language-standard cryptography packages.

The actual supported set SHALL be finalized based on detector implementation time and test availability. Unsupported algorithms MUST appear as unsupported/unknown rather than silently treated as safe.

### 8.2 Detection Evidence Types

Every finding SHOULD identify one or more evidence types:

- AST/API call;
- import/package;
- dependency manifest;
- library symbol;
- binary string;
- binary constant/signature;
- certificate parse;
- configuration match;
- container package metadata;
- heuristic pattern.

### 8.3 Confidence Model

Initial confidence classes:

**High** – direct API/AST evidence, parsed certificate evidence, or strong binary/library evidence.

**Medium** – multiple corroborating indirect indicators or a strong dependency/context signal.

**Low** – heuristic/name/pattern evidence with insufficient corroboration.

The confidence score describes **detection certainty**, not security severity.

---

## 9. Risk Model

### 9.1 Risk Inputs

The prototype risk engine SHALL use the following inputs when available:

1. Cryptographic algorithm and variant.
2. Key/parameter size.
3. Cryptographic purpose.
4. Classical weakness status.
5. Quantum-vulnerability status.
6. Data lifetime.
7. Migration time estimate.
8. Business criticality.
9. Expected CRQC arrival assumption.
10. Detection confidence.

### 9.2 Risk Principle

A system with no known quantum vulnerability but weak classical cryptography may still be high-risk. Conversely, a quantum-vulnerable artefact protecting data that expires quickly may have lower immediate migration priority than the same artefact protecting long-lived highly sensitive information.

### 9.3 Initial Risk Categories

The implementation SHALL define transparent rules and weights for converting inputs to risk. The exact scoring formula may be adjusted during implementation, but must be deterministic and documented.

A recommended prototype interpretation is:

- **Critical:** severe cryptographic weakness and/or quantum exposure combined with high criticality and a migration timeline that collides with the assumed threat horizon.
- **High:** significant quantum exposure or classical weakness requiring prioritized migration.
- **Medium:** meaningful exposure but lower urgency, uncertainty, or compensating context.
- **Low:** low immediate migration urgency or comparatively strong cryptography.
- **Informational / Not Quantifiable:** insufficient evidence or missing business/lifetime information.

### 9.4 Business Criticality

Business criticality SHALL be a user-input field rather than a value the scanner pretends to infer perfectly.

Initial values:

- Critical
- High
- Medium
- Low

The UI SHALL explain that business criticality is an organizational assumption.

### 9.5 Data Lifetime

Data lifetime SHALL support years and may be represented as an integer/decimal number of years for the prototype.

The UI SHALL make clear that this means the period for which confidentiality/integrity is considered important, not merely the application's operational lifetime.

---

## 10. Recommendation Matrix – Prototype Baseline

Recommendations shall be purpose-aware.

| Current primitive / use | Typical problem | Prototype recommendation class |
|---|---|---|
| RSA key establishment | Quantum vulnerable | ML-KEM or hybrid KEM approach |
| ECDH / EC key establishment | Quantum vulnerable | ML-KEM or hybrid KEM approach |
| RSA signatures | Quantum vulnerable | ML-DSA or, where policy/use-case favors it, SLH-DSA |
| ECDSA / EdDSA signatures | Quantum vulnerable | ML-DSA or SLH-DSA |
| AES-128 | Quantum reduces brute-force margin | Prefer AES-256 where policy/performance permits |
| SHA-1 / MD5 | Classical weakness | Migrate to an appropriate SHA-2/SHA-3 family hash |
| Strong SHA-2/SHA-3 | Not directly analogous to public-key break | Review usage and security strength; no automatic PQC signature/KEM substitution |
| Strong AES-256 | Strong symmetric baseline | Generally retain unless organizational policy requires otherwise |

The engine must avoid treating a KEM as a drop-in replacement for a hash function or a signature algorithm as a replacement for encryption. Recommendation semantics must follow cryptographic purpose.

---

## 11. CBOM Requirements

ECDAT shall use the CycloneDX cryptographic-asset model as the primary CBOM representation.

The normalized internal finding model and the exported CBOM are related but are **not required to be identical**. Internal fields may be richer for UI/evidence/risk purposes; the exporter maps relevant data into CBOM structures.

### 11.1 Minimum Internal Asset Fields

```text
asset_id
scan_id
asset_type
name
algorithm_family
variant
primitive
mode
parameter_set
key_size
library_name
library_version
protocol
certificate_metadata
input_type
source_path
line_start
line_end
detection_method
evidence
confidence
classical_status
quantum_status
data_lifetime
business_criticality
migration_time
risk_level
risk_score
recommendation
```

### 11.2 Traceability

Every exported asset SHOULD be traceable back to the originating finding ID and evidence location through metadata/properties where the CBOM representation permits it.

---

## 12. Input and Output Requirements

### 12.1 Inputs

Supported inputs SHALL include at least one working path for each of:

- source repository/archive;
- binary/library file;
- container image/archive.

The implementation may support multiple ingestion mechanisms, but one reliable path is required for each core type.

### 12.2 Outputs

For a successful scan the system SHALL produce:

1. scan metadata;
2. normalized findings;
3. cryptographic inventory;
4. risk assessment;
5. recommendations;
6. standardized CBOM JSON;
7. dashboard data;
8. human-readable report, subject to prototype output format.

---

## 13. Non-Functional Requirements

### 13.1 Security

**NFR-01** Uploaded artefacts SHALL NOT be executed by the default scanner.

**NFR-02** Private keys, credentials, tokens, and secret contents SHALL not be displayed or persisted unnecessarily.

**NFR-03** Archive extraction SHALL have resource limits.

**NFR-04** File paths and user-provided names SHALL be validated to avoid path traversal.

**NFR-05** Scanner errors SHALL not expose sensitive runtime details through the normal UI.

### 13.2 Performance

**NFR-06** The system SHOULD process a small/medium demonstration repository within a reasonable demo timeframe (target: roughly 1–3 minutes depending on input size and hardware).

**NFR-07** Parsing work SHOULD be modular so source detectors can be parallelized later.

### 13.3 Reliability

**NFR-08** A failure in one unsupported or malformed file SHALL not necessarily fail the entire scan.

**NFR-09** Partial scan errors SHALL be recorded in scan diagnostics.

**NFR-10** Re-running the same scan on unchanged inputs SHOULD produce logically consistent findings.

### 13.4 Usability

**NFR-11** A first-time user SHOULD be able to start a scan without reading developer documentation.

**NFR-12** Every risk result SHALL have an understandable explanation.

**NFR-13** The UI SHALL visibly distinguish detected facts, inferred values, and user assumptions.

### 13.5 Extensibility

**NFR-14** Detection engines SHALL have a common interface.

**NFR-15** Adding a new algorithm/library detector SHOULD not require rewriting risk, CBOM, or UI code.

**NFR-16** The risk engine SHALL use configuration/knowledge data instead of hard-coding every recommendation throughout the application.

---

## 14. Error Handling Requirements

The system SHALL gracefully handle:

- empty repositories;
- malformed source files;
- unsupported language;
- unsupported binary format;
- corrupted archive;
- container extraction failure;
- missing dependency metadata;
- incomplete certificate data;
- duplicate findings;
- missing key size/mode/version;
- scanner timeout/resource limit;
- invalid user risk inputs.

For unknown values, the preferred representation is `unknown`/`not_observed`, not an invented value.

---

## 15. Knowledge Base Requirements

ECDAT depends on a cryptographic knowledge base to interpret discoveries.

The knowledge base SHALL contain, where applicable:

- algorithm family;
- variants/modes;
- cryptographic purpose;
- classical security assessment;
- quantum status;
- applicable key/parameter sizes;
- recommendation mapping;
- standards/reference information;
- explanatory text.

The knowledge base SHALL be versioned so a scan can record which rules were used.

The prototype SHOULD keep this knowledge in structured files or database tables rather than embedding large rule sets directly inside scanner logic.

---

## 16. Architecture Boundaries Implied by the SRS

The implementation SHOULD separate the system into these logical components:

```text
Frontend
   |
API / Application Service
   |
Scan Orchestrator
   |
+------------------------------+
| Discovery Engines             |
| - Source/AST                  |
| - Dependency/Library         |
| - Binary                      |
| - Container                   |
| - Certificate/Config          |
+------------------------------+
   |
Normalized Finding Model
   |
+------------------------------+
| Knowledge Base                |
| CBOM Generator                |
| Risk Engine                   |
| Recommendation Engine         |
+------------------------------+
   |
Persistence / Reporting
```

The important contract is:

```text
Detector -> Finding
Finding -> Normalizer
Normalized Finding -> Asset
Asset -> CBOM / Risk / Recommendation
Risk/Recommendation -> UI / Report
```

Scanner-specific details must not leak into the risk engine. The risk engine should consume normalized cryptographic attributes, not raw AST nodes, ELF structures, or Docker metadata.

---

## 17. Priority Classification for the 5–6 Day Build

### P0 – Must Work

1. End-to-end project/scan creation.
2. Source repository scanning.
3. Dependency/library scanning.
4. Core cryptographic detector knowledge base.
5. Normalized findings.
6. CBOM JSON generation.
7. Quantum-risk assessment.
8. Business-criticality/data-lifetime inputs.
9. PQC/hybrid recommendations.
10. Dashboard with findings and risk.
11. Finding evidence/details.
12. Working report/export.
13. Basic safety/resource controls.

### P1 – Important for Strong Demonstration

1. Binary/library static scanning.
2. Container image inspection.
3. X.509 certificate parsing.
4. Risk distribution charts.
5. Scan coverage/limitations display.
6. Scan comparison.

### P2 – Only if P0/P1 Are Stable

1. Additional programming languages.
2. More binary formats.
3. More protocol detection.
4. Advanced heuristics for unknown/custom crypto.
5. More detailed remediation cost modeling.
6. Cloud/infrastructure connectors.
7. Automated migration patches.

The team SHALL protect P0 completion. P1 features must not be allowed to break the core end-to-end demo.

---

## 18. Acceptance Criteria for the Prototype

The prototype is considered functionally successful when the team can demonstrate the following sequence on a prepared test repository/image/binary set:

1. User starts ECDAT.
2. User selects a scan input.
3. ECDAT scans the input.
4. ECDAT reports discovered cryptographic artefacts.
5. At least several known algorithm families are detected correctly.
6. Findings show evidence/location and confidence.
7. Dependency/library evidence is visible separately from direct usage evidence.
8. The system generates a CBOM JSON containing discovered cryptographic assets.
9. The user can enter business criticality and data lifetime.
10. The system calculates quantum risk and shows why the risk was assigned.
11. The system recommends a purpose-appropriate PQC or hybrid migration option.
12. The dashboard visualizes inventory and risk.
13. The system exports a human-readable report and standardized CBOM.
14. Unsupported/unknown cases are explicitly disclosed rather than hidden.
15. Binary and container scanning, where implemented, visibly contributes findings to the same inventory pipeline.

### 18.1 Minimum Demonstration Dataset

The team SHALL maintain a small controlled dataset containing intentional examples of:

- RSA usage;
- ECC/ECDSA/ECDH usage;
- AES usage with at least one mode;
- SHA-256 or similar modern hashing;
- MD5 or SHA-1 weakness;
- a cryptographic dependency/library;
- an X.509 certificate if certificate scanning is implemented;
- a binary containing a known crypto library/reference;
- a container image containing a cryptographic library/package.

Expected findings SHALL be documented so the team can test the system deterministically.

---

## 19. Coverage and Honest-Detection Policy

ECDAT SHALL NEVER equate "not detected" with "not present".

The report/UI SHALL distinguish among:

```text
Detected
Detected with heuristic evidence
Not detected in scanned artefacts
Unsupported input
Unknown / insufficient evidence
```

This is particularly important for:

- custom implementations;
- dynamically loaded libraries;
- runtime-generated cryptography;
- proprietary hardware modules;
- encrypted/obfuscated binaries;
- external cloud services;
- network-only cryptographic behavior.

The scanner should expose a coverage summary so a security analyst understands what was actually assessed.

---

## 20. Assumptions and Constraints

### Assumptions

1. Inputs are authorized for scanning.
2. Demonstration datasets may be open-source/public test projects.
3. The prototype runs in a controlled environment.
4. Users can provide business context such as data lifetime and criticality.
5. Open-source parser and crypto-analysis libraries may be used.

### Constraints

1. Four developers.
2. Five–six day implementation window.
3. Limited opportunity for deep reverse engineering.
4. No assumption that every enterprise cryptographic implementation is statically discoverable.
5. Recommendation content must track current authoritative PQC standards.

---

## 21. Technology-Neutral Implementation Guidance

The team may choose its exact framework/stack, but the implementation must preserve the following responsibilities:

- frontend for visualization and interaction;
- API/service layer for scan orchestration and data retrieval;
- scanner modules for each input type;
- normalized cryptographic finding model;
- persistent scan/result storage;
- CBOM exporter;
- risk engine;
- recommendation engine;
- reporting layer.

The implementation SHALL avoid coupling the frontend directly to scanner internals.

---

## 22. Future Extensions

The following are recognized as future architecture targets, not prototype commitments:

- enterprise repository connectors;
- GitHub/GitLab/Bitbucket scanning;
- continuous CI/CD scanning;
- live cloud inventory connectors;
- network protocol/certificate discovery;
- HSM/hardware metadata integrations;
- SBOM + CBOM correlation at enterprise scale;
- stronger reverse engineering of custom crypto;
- dynamic program analysis;
- automated remediation PRs;
- crypto-agility planning;
- migration project planning and cost estimation;
- fleet-wide asset tracking.

---

## 23. External Standards and References

1. **SIH 2026 Problem Statement SIH26164 – Enterprise Cryptographic Discovery & Analysis Tool (ECDAT).** The statement requires cryptographic artefact discovery, quantum-risk assessment, classification, recommendations, scanning of source code repositories/binaries/libraries/container images, standardized reporting, and an interactive GUI.  
   Source: https://sih2026.vuce.in/ps/SIH26164

2. **NIST FIPS 203 – Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM).**  
   Source: https://csrc.nist.gov/pubs/fips/203/final

3. **NIST FIPS 204 – Module-Lattice-Based Digital Signature Standard (ML-DSA).**  
   Source: https://csrc.nist.gov/pubs/fips/204/final

4. **NIST FIPS 205 – Stateless Hash-Based Digital Signature Standard (SLH-DSA).**  
   Source: https://csrc.nist.gov/pubs/fips/205/final

5. **NIST Post-Quantum Cryptography project.**  
   Source: https://csrc.nist.gov/Projects/post-quantum-cryptography

6. **OWASP CycloneDX – Cryptography Bill of Materials (CBOM).** CycloneDX provides a structured representation of cryptographic assets such as algorithms, keys, certificates, and protocols.  
   Source: https://cyclonedx.org/capabilities/cbom/

7. **CycloneDX Cryptography Registry.** Provides algorithm-family patterns and examples useful for standardized cryptographic asset naming and modeling.  
   Source: https://cyclonedx.org/registry/cryptography/

---

## 24. Requirement Baseline for Subsequent Documents

The following items are considered the project's stable baseline and SHALL be reused when the team writes the System Design, API/DB Specification, and Test Plan:

```text
CORE PIPELINE
Input -> Discovery -> Normalize -> Inventory/CBOM -> Risk -> Recommendation -> UI/Report

CORE INPUT TYPES
Source repository
Binary/library
Container image

CORE ANALYSIS TYPES
Source/API/AST
Dependency/library
Certificate/configuration
Binary static indicators
Container filesystem/package inspection

CORE OUTPUTS
Normalized findings
CBOM JSON
Risk assessment
PQC/hybrid recommendation
Interactive dashboard
Human-readable report

CORE USER-CONTEXT INPUTS
Business criticality
Data lifetime
Migration time / estimate
Expected CRQC arrival assumption

CORE RISK RESULT
Critical / High / Medium / Low / Informational-Unquantifiable

CORE DETECTION CONFIDENCE
High / Medium / Low

CORE SAFETY RULE
Never execute uploaded binaries or arbitrary application code merely to perform the default scan.

CORE HONESTY RULE
Not detected != not present.
Unsupported and heuristic cases must be visible.
```

This section is the contractual hand-off point to the remaining project documentation.
