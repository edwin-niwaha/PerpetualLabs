#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys
from pathlib import Path


def main():
    """Run administrative tasks."""
    try:
        import django
        from django.core.management import execute_from_command_line
        from dotenv import load_dotenv
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    if django.VERSION < (5, 2):
        raise SystemExit(
            f"This project requires Django 5.2 or newer; this Python uses {django.get_version()}.\n"
            "For local development run: python manage_local.py "
            + " ".join(sys.argv[1:])
            + "\n"
            "Or use .venv/Scripts/python.exe manage.py with the intended settings."
        )
    # Select settings from .env before Django initializes; shell values win.
    load_dotenv(Path(__file__).resolve().parent / ".env", override=False)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
