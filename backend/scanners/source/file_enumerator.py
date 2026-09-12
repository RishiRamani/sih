import os
from dataclasses import dataclass
from typing import List, Tuple

from .language_detector import detect_language_from_shebang, detect_language_from_extension

SKIP_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "venv", ".venv", "env",
    "__pycache__", "dist", "build", "target", ".next", ".idea", ".vscode",
    "vendor", "coverage", ".pytest_cache", ".mypy_cache",
}

MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB safety limit for the prototype (SRS FR-08)

@dataclass
class EnumeratedFile:
    path: str
    language: str

def _peek_first_line(path: str) -> str:
    
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.readline()
    except OSError:
        return ""
 

def enumerate_source_files(root: str) -> Tuple[List[EnumeratedFile], List[str], List[str]]:
    """Returns (supported_files, unsupported_files, skipped_oversize_files)."""
    supported: List[EnumeratedFile] = []
    unsupported: List[EnumeratedFile] = []
    skipped_oversize: List[str] = []

    for dirpath, dirnames, filenames in os.walk(root) :
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]

        for name in filenames:
            full_path = os.path.join(dirpath, name)
           
            try:
                size = os.path.getsize(full_path)
            except OSError:
                continue

            if size > MAX_FILE_SIZE_BYTES:
                skipped_oversize.append(full_path)
                continue

            language = detect_language_from_extension(full_path)

            if language is None:
                language = detect_language_from_shebang(_peek_first_line(full_path))

            if language is None :
                unsupported.append(full_path)
                continue

            supported.append(EnumeratedFile(path=full_path, language=language))

    return supported, unsupported, skipped_oversize
