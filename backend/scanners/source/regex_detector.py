import re
from ...schemas.finding import Finding
from .algorithm_rules import lexical_matches

LEXICAL_CONFIDENCE = 0.35

LEXICAL_COMMENT_CONFIDENCE = 0.15

_COMMENT_PREFIXES = {
    "python": (re.compile(r"^\s*#"),),
    "go": (re.compile(r"^\s*//"),),
    "javascript": (re.compile(r"^\s*//"), re.compile(r"^\s*\*")),
    "java": (re.compile(r"^\s*//"), re.compile(r"^\s*\*")),
    "c": (re.compile(r"^\s*//"), re.compile(r"^\s*\*")),
}
 
 
def _is_comment_line(line: str, language: str) -> bool:
    for pattern in _COMMENT_PREFIXES.get(language, ()):
        if pattern.match(line):
            return True
    return False
 

def detect_lexical(file_path: str, source_text: str, language: str):
    findings = []
    lines = source_text.splitlines()

    for algorithm, (compiled_pattern, primitive_type) in lexical_matches().items():
        for line_no, line in enumerate(lines, start=1):
            if not compiled_pattern.search(line):
                continue
            is_comment = _is_comment_line(line, language)
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
                detection_method="LEXICAL_COMMENT" if is_comment else "LEXICAL",
                confidence=LEXICAL_COMMENT_CONFIDENCE if is_comment else LEXICAL_CONFIDENCE,
                evidence=line.strip()[:200],
            ))
    return findings