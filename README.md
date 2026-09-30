# Qrypta Backend

Qrypta is a Python backend for discovering cryptographic usage in software assets, normalizing the results, assessing cryptographic and quantum risk, generating migration recommendations, and producing a CycloneDX 1.7 Cryptography Bill of Materials (CBOM).

## Current Capabilities

The backend currently supports:

* Scanning local source directories.
* Scanning Git repositories by URL.
* Inspecting supported executable and shared-library binaries without executing them.
* Inspecting `.tar` container image archives for cryptographic library indicators.
* Detecting cryptography-related dependencies in supported manifest files.
* Parsing X.509 certificates in PEM, CRT, CER, and DER formats.
* Normalizing scanner output into a shared `Finding` model.
* Deduplicating findings and retaining detection evidence and confidence.
* Assessing classical risk, quantum risk, Mosca-style timing risk, and combined severity.
* Generating migration and hybrid-cryptography recommendations.
* Generating and validating CycloneDX 1.7 CBOM data.
* Persisting completed scan results in a MongoDB database.

The implementation is a synchronous prototype. Uploaded or acquired binaries are inspected statically and are not executed by the scanners.

## Architecture

The backend follows this flow:

```text
Local path or Git URL
				|
				v
Target acquisition
				|
				v
Scanner selection and execution
				|
				v
Raw findings with evidence
				|
				v
Normalization and deduplication
				|
				+--> Intelligence and risk assessment
				|
				+--> Migration recommendations
				|
				+--> CycloneDX 1.7 CBOM
				|
				v
MongoDB persistence and API responses
```

The main orchestration entry point is `backend/orchestration/pipeline.py`. Scanners implement the interface in `backend/scanners/base.py` and return `Finding` objects defined in `backend/schemas/finding.py`.

## Repository Layout

```text
164/
	backend/
		main.py                 FastAPI application entry point
		requirements.txt        Pinned Python dependencies
		api/                    Scan, finding, risk, CBOM, and report routes
		acquisition/            Local and Git target acquisition
		cbom/                   CycloneDX CBOM generation and validation
		data/                   Knowledge base, schemas, and local data
		intelligence/           Classical, quantum, Mosca, risk, and recommendation logic
		normalization/          Finding normalization and deduplication
		orchestration/          Scan pipeline
		persistence/            MongoDB database and scan repository
		reporting/              Reporting package area
		scanners/               Source, binary, container, dependency, and certificate scanners
		schemas/                Pydantic request, finding, scan, intelligence, and CBOM models
		tests/                  Backend pytest suite
	docs/
		SRS.md                  Product requirements and scope
		SYSTEM_DESIGN.md        Architecture design
		WORK_DIVISION.md        Team responsibilities and contracts
	pyproject.toml            Pytest configuration
```

## Scanner Coverage

### Source scanner

The source scanner is available through `backend/scanners/source/`. It combines:

* Lexical algorithm detection.
* API and library signature detection.
* AST-based detection for supported languages.
* Key-size extraction where the call site provides it.
* Custom-crypto heuristics.
* Source-file enumeration and language detection.

The API signature rules cover Python, JavaScript/TypeScript, Java, C/C++, and Go patterns. Detected cipher modes such as GCM, CBC, ECB, and CTR are stored only when the source evidence identifies the mode, using `finding.metadata["mode"]`. Generic AES, RSA, and hashing findings do not receive an invented mode.

### Binary scanner

`backend/scanners/binary/` performs static inspection of recognized binary formats. It extracts printable strings and symbols, then matches known cryptographic signatures such as OpenSSL, AES variants, RSA, ECDSA, ECDH, and common hashes. Binary files are never executed.

Mode-aware binary signatures include AES-GCM, AES-CBC, AES-CTR, and AES-ECB. Mode metadata is omitted when a signature does not identify a mode.

### Container scanner

`backend/scanners/container/` accepts `.tar` archives and inspects their file listings. It identifies cryptographic library indicators such as OpenSSL and libsodium. This scanner reports package/library-level evidence and does not infer a cipher algorithm or mode from a library name alone.

### Dependency scanner

`backend/scanners/dependency/` scans these manifest formats:

* `package.json`
* `requirements.txt`
* `pyproject.toml`
* `pom.xml`
* `build.gradle`
* `build.gradle.kts`
* `CMakeLists.txt`

Dependency findings identify cryptography-related libraries and versions. They do not claim that a particular algorithm is used; source-level usage must be established separately.

### Certificate scanner

`backend/scanners/certificate/` parses `.pem`, `.crt`, `.cer`, and `.der` X.509 certificates and records public-key algorithm, key size, curve, signature algorithm, subject, issuer, SAN, and validity dates when available.

## Finding Contract

Every scanner emits the shared Pydantic model in `backend/schemas/finding.py`. Important fields include:

```json
{
	"artifact_type": "source",
	"algorithm": "AES",
	"variant": null,
	"key_size": null,
	"asset_path": "src/crypto.py",
	"detection_method": "API_SIGNATURE",
	"confidence": 0.75,
	"evidence": "...",
	"metadata": {
		"mode": "GCM"
	}
}
```

`metadata` is an extensible dictionary. Cipher mode is represented consistently as `metadata["mode"]` and is optional. A mode is included only when scanner evidence explicitly identifies it.

## Requirements

* Python 3.13 or a compatible modern Python version.
* Git, when scanning a repository URL.
* MongoDB.
* The dependencies listed in `backend/requirements.txt`.

The binary scanner uses `lief` and `pyelftools`; the source scanner uses Tree-sitter language packages; CBOM validation uses `jsonschema` and the repository's CycloneDX schema.

## Setup

From the repository root:

```powershell
cd 164
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

On macOS or Linux, use the equivalent activation and path syntax:

```bash
cd 164
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
```

Configure the MongoDB connection string in the environment according to the backend configuration.

## Run the API

From `164/`, using the project virtual environment:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

The API is then available at `http://127.0.0.1:8000`. FastAPI's generated OpenAPI documentation is available at `/docs`, and the alternative ReDoc view is available at `/redoc`.

## API

### Create a scan

Create a scan from a local directory:

```powershell
curl.exe -X POST http://127.0.0.1:8000/scans `
	-H "Content-Type: application/json" `
	-d '{"source_type":"local","source":"C:\\path\\to\\project"}'
```

Create a scan from a Git repository:

```powershell
curl.exe -X POST http://127.0.0.1:8000/scans `
	-H "Content-Type: application/json" `
	-d '{"source_type":"git","source":"https://github.com/example/project.git"}'
```

The request accepts either `source` or the backwards-compatible `target_path` field, but not both. `source_type` is `local` by default and may be `local` or `git`.

The response is a persisted `ScanResult` containing the scan ID, status, target path, normalized findings, intelligence assessments, CBOM, and total finding count.

### Scan resources

| Method   | Endpoint                           | Description                                                      |
| -------- | ---------------------------------- | ---------------------------------------------------------------- |
| `POST`   | `/scans`                           | Acquire a target, run the scan pipeline, and persist the result. |
| `GET`    | `/scans`                           | List stored scans, newest first.                                 |
| `GET`    | `/scans/{scan_id}`                 | Return one stored scan.                                          |
| `DELETE` | `/scans/{scan_id}`                 | Delete one stored scan.                                          |
| `GET`    | `/scans/{scan_id}/findings`        | Return normalized findings.                                      |
| `GET`    | `/scans/{scan_id}/risk`            | Return intelligence and risk assessments.                        |
| `GET`    | `/scans/{scan_id}/recommendations` | Return migration recommendations.                                |
| `GET`    | `/scans/{scan_id}/cbom`            | Return the generated CycloneDX CBOM.                             |
| `GET`    | `/scans/{scan_id}/report`          | Return the complete persisted scan result.                       |

Missing scan IDs return HTTP 404. Acquisition failures return HTTP 400, and unexpected scan failures return HTTP 500.

## CBOM Generation

The CBOM generator in `backend/cbom/` produces a CycloneDX 1.7 document with:

* Cryptographic-asset components.
* Application and library components where applicable.
* Algorithm properties such as primitive, family, parameter set, and mode when available.
* Certificate properties for certificate findings.
* Evidence properties including asset path, detection method, confidence, and source-finding identity.
* Dependency relationships between applications, libraries, and cryptographic assets.

The schema used for validation is `backend/data/schemas/cyclonedx-1.7.schema.json`. Serialization uses CycloneDX JSON aliases such as `bomFormat`, `specVersion`, `bom-ref`, and `cryptoProperties`.

## Risk and Recommendations

The intelligence layer consumes normalized findings and evaluates:

* Classical algorithm and key-size risk.
* Quantum-readiness status.
* Mosca-style timing risk based on data lifetime, migration time, and CRQC arrival assumptions when supplied.
* Detection confidence and business criticality inputs.
* Migration priority and candidate post-quantum or hybrid algorithms.

The current scan request does not expose business-context fields, so default or unknown context values may be used during the automatic pipeline assessment. The assessment functions can accept business criticality and timing context when called directly by backend code.

## Tests

Run the complete backend test suite from `164/`:

```powershell
backend\.venv\Scripts\python.exe -m pytest
```

The pytest configuration in `pyproject.toml` sets `backend/tests` as the test path and adds the repository root to `PYTHONPATH`.

Run a focused scanner test selection:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend/tests/test_source_scanner.py backend/tests/test_binary_scanner.py -q
```

The suite covers source, binary, container, dependency, certificate, normalization, pipeline, CBOM, risk, and language-detection behavior. Source mode regression tests cover AES-GCM, AES-CBC, AES-ECB, AES-CTR, and generic AES findings without a mode.

## Limitations

* Static detection cannot guarantee discovery of proprietary, obfuscated, dynamically generated, or home-grown cryptography.
* Dependency findings identify declared libraries, not confirmed algorithm usage.
* Container findings identify library/package indicators from archive contents; the container is not executed.
* Binary findings are based on static strings, symbols, and signatures and may not prove runtime use.
* MongoDB persistence is used for application and scan data.
* The scan API currently accepts local directories and Git repositories. It does not expose a general multipart upload endpoint.
* The report endpoint returns the complete persisted `ScanResult`; a separate human-readable report file generator is not currently wired into the API.

## Related Documentation

* [Software Requirements Specification](docs/SRS.md)
* [System Design](docs/SYSTEM_DESIGN.md)
* [Team Work Division](docs/WORK_DIVISION.md)
