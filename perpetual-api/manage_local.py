#!/usr/bin/env python
"""Run local Django commands with the project's supported virtual environment."""

import os
import subprocess
import sys
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent
    python_path = "Scripts/python.exe" if os.name == "nt" else "bin/python"
    executable = next(
        (
            candidate
            for environment in (".venv", ".venv-web")
            if (candidate := root / environment / python_path).is_file()
        ),
        None,
    )
    if executable is None:
        raise SystemExit(
            "Missing project virtual environment. Follow the local setup in README.md."
        )
    if any(
        arg == "--settings" or arg.startswith("--settings=") for arg in sys.argv[1:]
    ):
        raise SystemExit(
            "This launcher always uses config.local. Use manage.py directly for other settings."
        )
    command = [
        str(executable),
        str(root / "manage.py"),
        *sys.argv[1:],
        "--settings=config.local",
    ]
    try:
        return subprocess.call(
            command, cwd=root, env={**os.environ, "DJANGO_ENV": "development"}
        )
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
