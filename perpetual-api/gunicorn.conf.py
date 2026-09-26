"""Railway supplies PORT; background reset-mail workers must not be preloaded."""

import os

bind = f"0.0.0.0:{int(os.environ.get('PORT', '8000'))}"
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))
threads = 4
worker_class = "gthread"
timeout = 60
graceful_timeout = 30
keepalive = 5
preload_app = False
accesslog = "-"
errorlog = "-"
# Log the path without query strings, authorization headers or request bodies.
access_log_format = "%(h)s %(m)s %(U)s %(s)s %(L)s"
