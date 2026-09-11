from schemas.finding import Finding
from .algorithm_rules import lexical_matches

LEXICAL_CONFIDENCE = 0.35


def detect_lexical(file_path: str, source_text: str, language: str):
    findings = []
    lines = source_text.splitlines()

    for algorithm, (compiled_pattern, primitive_type) in lexical_matches().items():
        for line_no, line in enumerate(lines, start=1):
            if not compiled_pattern.search(line):
                continue
            findings.append(Finding(
                artifact_type="source",
                algorithm=algorithm,
                primitive_type=primitive_type,
                variant=None,
                key_size=None,
                library=None,
                library_version=None,
                asset_path=file_path,
                line_start=line_no,
                line_end=line_no,
                detection_method="LEXICAL",
                confidence=LEXICAL_CONFIDENCE,
                evidence=line.strip()[:200],
            ))
    return findings