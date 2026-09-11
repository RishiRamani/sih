from pathlib import Path

import lief


class BinaryFormatDetector:
    """
    Detects the executable/binary format of a file.

    Supported formats:
    - PE
    - ELF
    - Mach-O
    - Unknown
    """

    def detect(self, path: Path) -> str:
        if not path.is_file():
            return "unknown"

        try:
            binary = lief.parse(str(path))
        except Exception:
            return "unknown"

        if binary is None:
            return "unknown"

        format_name = binary.format

        if format_name == lief.Binary.FORMATS.ELF:
            return "ELF"

        if format_name == lief.Binary.FORMATS.PE:
            return "PE"

        if format_name == lief.Binary.FORMATS.MACHO:
            return "Mach-O"

        return "unknown"