# Railway API deployment

Deploy this folder as its own Railway service, with PostgreSQL and the separate Next.js web service. Follow the complete [GitHub-to-Railway guide](../../perpetual-web/docs/railway-deployment.md).

- Root Directory: `/perpetual-api`
- Config File Path: `/perpetual-api/railway.json`
- Variables checklist: `.env.railway.example`
- Python: 3.12, selected by `.python-version`
- Locked dependencies: `requirements.txt` includes `requirements-web.lock.txt`
- Build: `python manage.py collectstatic --noinput`
- Pre-deploy: `python manage.py migrate --noinput && python manage.py createcachetable`
- Start: `gunicorn config.wsgi:application --config gunicorn.conf.py`
- Health check: `/health/`; allow `healthcheck.railway.app` in `ALLOWED_HOSTS`

All required production variables must be set before building. Keep `TRUST_PROXY_HEADERS=True` behind Railway ingress, use the public HTTPS web/API origins, and reference Railway PostgreSQL with `${{Postgres.DATABASE_URL}}`. Use the existing Resend and Cloudinary services. Gunicorn uses Railway's `PORT` and logs paths without query strings or request bodies.

Create the administrator once with `python manage.py createsuperuser` in the deployed API's shell. Existing local data and media are not transferred by pushing source to GitHub.
