import os
import re

EXTENSION_LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "javascript",   # treated the same as JS for lexical/api detection
    ".tsx": "javascript",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cc": "c",
    ".cpp": "c",
    ".cxx": "c",
    ".hpp": "c",
    ".go": "go",
}

_SHEBANG_PATTERNS = [
    (re.compile(r"^#!.*\bpython3?\b"), "python"),
    (re.compile(r"^#!.*\bnode\b"), "javascript"),
    (re.compile(r"^#!.*\b(?:bash|sh|zsh)\b"), None),
]

def detect_language_from_extension(file_path: str):
    _, ext = os.path.splitext(file_path)
    return EXTENSION_LANGUAGE_MAP.get(ext.lower())

def detect_language_from_shebang(first_line: str):
    if not first_line.startswith("#!"):
        return None
    for pattern, language in _SHEBANG_PATTERNS:
        if pattern.search(first_line):
            return language
    return None


def detect_language(file_path: str, content: str = None):

    language = detect_language_from_extension(file_path)
    if language:
        return language

    if content:
        lines = content.splitlines()
        first_line = lines[0] if lines else ""
        return detect_language_from_shebang(first_line)

    return None


def supported_languages():

    languages = set(EXTENSION_LANGUAGE_MAP.values())
    languages |= {lang for _, lang in _SHEBANG_PATTERNS if lang}
    return sorted(languages)