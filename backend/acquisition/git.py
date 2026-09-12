import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlparse


class GitAcquisitionError(Exception):
    """Raised when a Git repository cannot be acquired."""


def validate_git_url(url: str) -> None:
    """Validate that the supplied URL is a supported Git HTTPS/SSH URL."""
    parsed = urlparse(url)

    if parsed.scheme == "https" and parsed.netloc:
        return

    if parsed.scheme == "ssh" and parsed.netloc:
        return

    if url.startswith("git@"):
        return

    raise GitAcquisitionError(
        "Only HTTPS or SSH Git repository URLs are supported."
    )


def clone_repository(url: str) -> tempfile.TemporaryDirectory[str]:
    """
    Clone a Git repository into a temporary directory.

    The caller owns the returned TemporaryDirectory and must keep it alive
    for the duration of the scan.
    """
    validate_git_url(url)

    temp_dir = tempfile.TemporaryDirectory(prefix="ecdat-scan-")
    destination = Path(temp_dir.name)

    try:
        subprocess.run(
            [
                "git",
                "clone",
                "--depth",
                "1",
                url,
                str(destination),
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except FileNotFoundError as exc:
        temp_dir.cleanup()
        raise GitAcquisitionError(
            "Git is not installed or is not available on PATH."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        temp_dir.cleanup()
        raise GitAcquisitionError(
            "Git clone timed out after 120 seconds."
        ) from exc
    except subprocess.CalledProcessError as exc:
        temp_dir.cleanup()

        detail = exc.stderr.strip() or exc.stdout.strip()

        raise GitAcquisitionError(
            f"Git clone failed: {detail or 'unknown error'}"
        ) from exc

    return temp_dir