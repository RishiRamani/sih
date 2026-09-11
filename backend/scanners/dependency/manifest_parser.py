from pathlib import Path
import json
import re
from typing import Any


class ManifestParser:
    """
    Parses dependency manifests from supported ecosystems.

    Supported:
    - Python: requirements.txt, pyproject.toml
    - JavaScript / TypeScript: package.json
    - Java: pom.xml, build.gradle, build.gradle.kts
    - C/C++: CMakeLists.txt
    """

    def parse(self, target: Path) -> list[dict[str, Any]]:
        if not target.is_file():
            return []

        filename = target.name.lower()

        if filename == "package.json":
            return self._parse_package_json(target)

        if filename == "requirements.txt":
            return self._parse_requirements_txt(target)

        if filename == "pyproject.toml":
            return self._parse_pyproject_toml(target)

        if filename == "pom.xml":
            return self._parse_pom_xml(target)

        if filename in {"build.gradle", "build.gradle.kts"}:
            return self._parse_gradle(target)

        if filename == "cmakelists.txt":
            return self._parse_cmake(target)

        return []

    # ---------------------------------------------------------
    # JavaScript / TypeScript
    # ---------------------------------------------------------

    def _parse_package_json(self, target: Path) -> list[dict[str, Any]]:
        try:
            data = json.loads(target.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            return []

        dependencies = {}

        for section in (
            "dependencies",
            "devDependencies",
            "peerDependencies",
            "optionalDependencies",
        ):
            values = data.get(section, {})

            if isinstance(values, dict):
                dependencies.update(values)

        result = []

        for name, version in dependencies.items():
            result.append(
                {
                    "name": name,
                    "version": self._clean_npm_version(str(version)),
                    "ecosystem": "javascript",
                    "manifest": target.name,
                }
            )

        return result

    # ---------------------------------------------------------
    # Python - requirements.txt
    # ---------------------------------------------------------

    def _parse_requirements_txt(self, target: Path) -> list[dict[str, Any]]:
        try:
            lines = target.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError):
            return []

        result = []

        for line in lines:
            line = line.strip()

            if not line or line.startswith("#"):
                continue

            # Ignore pip options and recursive requirements.
            if line.startswith("-"):
                continue

            # Remove inline comments.
            line = line.split("#", 1)[0].strip()

            match = re.match(
                r"^([A-Za-z0-9_.-]+)"
                r"(?:\[[^\]]+\])?"
                r"\s*"
                r"(?:(==|!=|<=|>=|~=|<|>)\s*"
                r"([A-Za-z0-9_.+!-]+))?",
                line,
            )

            if not match:
                continue

            name = match.group(1)
            operator = match.group(2)
            version = match.group(3)

            result.append(
                {
                    "name": name,
                    "version": (
                        f"{operator}{version}"
                        if operator and version
                        else None
                    ),
                    "ecosystem": "python",
                    "manifest": target.name,
                }
            )

        return result

    # ---------------------------------------------------------
    # Python - pyproject.toml
    # ---------------------------------------------------------

    def _parse_pyproject_toml(self, target: Path) -> list[dict[str, Any]]:
        try:
            import tomllib
        except ImportError:
            return []

        try:
            with target.open("rb") as file:
                data = tomllib.load(file)
        except (OSError, tomllib.TOMLDecodeError):
            return []

        dependencies = []

        project = data.get("project", {})

        if isinstance(project, dict):
            dependencies.extend(project.get("dependencies", []))

            optional = project.get("optional-dependencies", {})

            if isinstance(optional, dict):
                for group in optional.values():
                    if isinstance(group, list):
                        dependencies.extend(group)

        result = []

        for dependency in dependencies:
            if not isinstance(dependency, str):
                continue

            match = re.match(
                r"^([A-Za-z0-9_.-]+)"
                r"(?:\[[^\]]+\])?"
                r"\s*"
                r"([=!<>~].*)?$",
                dependency.strip(),
            )

            if not match:
                continue

            result.append(
                {
                    "name": match.group(1),
                    "version": (
                        match.group(2).strip()
                        if match.group(2)
                        else None
                    ),
                    "ecosystem": "python",
                    "manifest": target.name,
                }
            )

        return result

    # ---------------------------------------------------------
    # Java - Maven
    # ---------------------------------------------------------

    def _parse_pom_xml(self, target: Path) -> list[dict[str, Any]]:
        import xml.etree.ElementTree as ET

        try:
            root = ET.parse(target).getroot()
        except (OSError, ET.ParseError):
            return []

        result = []

        for dependency in root.iter():
            if not dependency.tag.endswith("dependency"):
                continue

            group_id = None
            artifact_id = None
            version = None

            for child in dependency:
                tag = child.tag.split("}")[-1]

                if tag == "groupId":
                    group_id = child.text

                elif tag == "artifactId":
                    artifact_id = child.text

                elif tag == "version":
                    version = child.text

            if not artifact_id:
                continue

            name = (
                f"{group_id}:{artifact_id}"
                if group_id
                else artifact_id
            )

            result.append(
                {
                    "name": name,
                    "version": version,
                    "ecosystem": "java",
                    "manifest": target.name,
                }
            )

        return result

    # ---------------------------------------------------------
    # Java - Gradle
    # ---------------------------------------------------------

    def _parse_gradle(self, target: Path) -> list[dict[str, Any]]:
        try:
            text = target.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            return []

        result = []

        pattern = re.compile(
            r"""
            (?:implementation|
               api|
               compileOnly|
               runtimeOnly|
               testImplementation|
               testRuntimeOnly)
            \s*
            \(?
            \s*
            ['"]
            ([^:'"]+)
            :
            ([^:'"]+)
            :
            ([^'"]+)
            ['"]
            \s*
            \)?
            """,
            re.VERBOSE,
        )

        for match in pattern.finditer(text):
            group_id, artifact_id, version = match.groups()

            result.append(
                {
                    "name": f"{group_id}:{artifact_id}",
                    "version": version,
                    "ecosystem": "java",
                    "manifest": target.name,
                }
            )

        return result

    # ---------------------------------------------------------
    # C / C++ - CMake
    # ---------------------------------------------------------

    def _parse_cmake(self, target: Path) -> list[dict[str, Any]]:
        try:
            text = target.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            return []

        result = []

        pattern = re.compile(
            r"\bfind_package\s*\(\s*"
            r"([A-Za-z0-9_.+-]+)"
            r"(?:\s+([0-9][A-Za-z0-9_.+-]*))?",
            re.IGNORECASE,
        )

        for match in pattern.finditer(text):
            name = match.group(1)
            version = match.group(2)

            result.append(
                {
                    "name": name,
                    "version": version,
                    "ecosystem": "cpp",
                    "manifest": target.name,
                }
            )

        return result

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

    @staticmethod
    def _clean_npm_version(version: str) -> str | None:
        """
        Converts common npm ranges into a useful representative version.

        ^4.2.0  -> 4.2.0
        ~4.2.0  -> 4.2.0
        >=4.0   -> 4.0
        """

        match = re.search(
            r"\d+(?:\.\d+)*(?:[-+][A-Za-z0-9.-]+)?",
            version,
        )

        if match:
            return match.group(0)

        return version or None