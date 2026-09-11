import os
from dataclasses import dataclass
from typing import List, Tuple

SKIP_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "venv", ".venv", "env",
    "__pycache__", "dist", "build", "target", ".next", ".idea", ".vscode",
    "vendor", "coverage", ".pytest_cache", ".mypy_cache",
}

EXTENSION_LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "javascript",   
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

MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB safety limit for the prototype (SRS FR-08)

@dataclass
class EnumeratedFile:
    path: str
    language: str


def enumerate_source_files(root: str) -> Tuple[List[EnumeratedFile], List[str], List[str]]:
    """Returns (supported_files, unsupported_files, skipped_oversize_files)."""
    supported: List[EnumeratedFile] = []
    unsupported: List[EnumeratedFile] = []
    skipped_oversize: List[str] = []

    for dirpath, dirnames, filenames in os.walk(root) :
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]

        for name in filenames:
            full_path = os.path.join(dirpath, name)
            _, ext = os.path.splitext(name)
            ext = ext.lower()

            try:
                size = os.path.getsize(full_path)
            except OSError:
                continue

            if size > MAX_FILE_SIZE_BYTES:
                skipped_oversize.append(full_path)
                continue

            language = EXTENSION_LANGUAGE_MAP.get(ext)

            if language is None :
                unsupported.append(full_path)
                continue

            supported.append(EnumeratedFile(path=full_path, language=language))

    return supported, unsupported, skipped_oversize
