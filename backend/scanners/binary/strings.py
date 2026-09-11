from pathlib import Path


class BinaryStringExtractor:
    """
    Extracts printable ASCII strings from a binary file.

    This is a static analysis step. The binary is never executed.
    """

    def __init__(self, min_length: int = 4):
        self.min_length = min_length

    def extract(self, path: Path) -> list[str]:
        if not path.is_file():
            return []

        data = path.read_bytes()

        strings = []
        current = []

        for byte in data:
            if 32 <= byte <= 126:
                current.append(chr(byte))
            else:
                if len(current) >= self.min_length:
                    strings.append("".join(current))

                current = []

        if len(current) >= self.min_length:
            strings.append("".join(current))

        return strings