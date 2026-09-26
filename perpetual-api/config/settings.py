"""Environment-selected entry point for manage.py, WSGI and ASGI."""

from pathlib import Path

from dotenv import load_dotenv

from .environment import django_environment

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)
DJANGO_ENV = django_environment()
if DJANGO_ENV == "development":
    from .local import *  # noqa: F401,F403
else:
    from .production import *  # noqa: F401,F403
