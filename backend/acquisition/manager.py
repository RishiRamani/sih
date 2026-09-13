from pathlib import Path

from .git import GitAcquisitionError, clone_repository


class AcquisitionError(Exception):
    """Raised when a scan target cannot be acquired."""


class AcquiredTarget:
    """
    Represents an acquired scan target.

    For local targets there is nothing to clean up.
    For Git targets, the temporary directory remains alive until cleanup().
    """

    def __init__(
        self,
        path: Path,
        cleanup=None,
    ) -> None:
        self.path = path
        self._cleanup = cleanup

    def cleanup(self) -> None:
        if self._cleanup is not None:
            self._cleanup()
            self._cleanup = None

    def __enter__(self) -> "AcquiredTarget":
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self.cleanup()


def acquire_target(
    source_type: str,
    source: str,
) -> AcquiredTarget:
    """
    Acquire a scan target from a local path or Git repository.
    """

    if source_type == "local":
        target = Path(source)

        if not target.exists():
            raise AcquisitionError(
                f"Target path does not exist: {source}"
            )

        if not target.is_dir() and not target.is_file():
            raise AcquisitionError(
                f"Target must be a file or directory: {source}"
            )

        return AcquiredTarget(target)

    if source_type == "git":
        try:
            temp_dir = clone_repository(source)
        except GitAcquisitionError as exc:
            raise AcquisitionError(str(exc)) from exc

        return AcquiredTarget(
            Path(temp_dir.name),
            cleanup=temp_dir.cleanup,
        )

    raise AcquisitionError(
        f"Unsupported source_type: {source_type}"
    )