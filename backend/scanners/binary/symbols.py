from pathlib import Path

import lief


class BinarySymbolExtractor:
    """
    Extracts imported and exported symbols from a binary.

    This is static analysis only. The binary is never executed.
    """

    def extract(self, path: Path) -> dict[str, list[str]]:
        if not path.is_file():
            return {
                "imports": [],
                "exports": [],
            }

        try:
            binary = lief.parse(str(path))
        except Exception:
            return {
                "imports": [],
                "exports": [],
            }

        if binary is None:
            return {
                "imports": [],
                "exports": [],
            }

        imports = []
        exports = []

        for function in binary.imported_functions:
            imports.append(function)

        for function in binary.exported_functions:
            exports.append(function)

        return {
            "imports": sorted(set(imports)),
            "exports": sorted(set(exports)),
        }