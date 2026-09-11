from pathlib import Path
import tarfile


class ContainerImageInspector:
    """
    Inspects a container image exported as a TAR archive.

    The archive is never executed. Files are only inspected statically.
    """

    def __init__(self, max_files: int = 10000):
        self.max_files = max_files

    def inspect(self, path: Path) -> list[dict]:
        if not path.is_file():
            return []

        if path.suffix.lower() != ".tar":
            return []

        results = []

        try:
            with tarfile.open(path, mode="r") as archive:
                members = archive.getmembers()

                if len(members) > self.max_files:
                    raise ValueError(
                        f"Container archive contains too many files "
                        f"(maximum: {self.max_files})."
                    )

                for member in members:
                    if not self._is_safe_path(member.name):
                        continue

                    if not member.isfile():
                        continue

                    results.append(
                        {
                            "path": member.name,
                            "size": member.size,
                        }
                    )

        except (tarfile.TarError, OSError):
            return []

        return results

    def _is_safe_path(self, path: str) -> bool:
        """
        Prevent path traversal when inspecting archive entries.
        """
        try:
            normalized = Path(path)

            if normalized.is_absolute():
                return False

            return ".." not in normalized.parts

        except Exception:
            return False