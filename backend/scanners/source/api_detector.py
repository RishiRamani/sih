from schemas.finding import Finding
from .algorithm_rules import api_signatures_for_language
from .key_size_extractor import extract_key_size_from_match

API_CONFIDENCE = 0.75


def detect_api_signatures(file_path: str, source_text: str, language: str):
    findings = []
    signatures = api_signatures_for_language(language)
    if not signatures:
        return findings

    lines = source_text.splitlines()

    for sig in signatures:
        for line_no, line in enumerate(lines, start=1):
            match = sig["compiled"].search(line)
            if not match:
                continue

            key_size = extract_key_size_from_match(match, sig["algorithm"])

            findings.append(Finding(
                artifact_type="source",
                algorithm=sig["algorithm"],
                primitive_type=sig["primitive_type"],
                variant=f'{sig["algorithm"]}-{key_size}' if key_size else None,
                key_size=key_size,
                library=sig.get("library"),
                library_version=None,
                asset_path=file_path,
                line_start=line_no,
                line_end=line_no,
                detection_method="API_SIGNATURE",
                confidence=API_CONFIDENCE,
                evidence=line.strip()[:200],
            ))
    return findings