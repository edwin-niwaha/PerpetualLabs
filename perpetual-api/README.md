# 🛠️Perpetual Labs

A full-stack web application powered by **Django** (REST API backend) and **Next.js** (React frontend).  
The platform is built for modern, scalable, and responsive digital solutions.

[![Python](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org/downloads/release/python-3120/)

---

## 🚀 Tech Stack

### 🔧 Backend – Django
- Django REST Framework
- PostgreSQL
- Custom user authentication
- Media & static file handling
- Email support

### 💻 Frontend – Next.js
- React 18
- Tailwind CSS
- API integration with Django backend
- Responsive design
- Form handling

---

## 🧩 Project Structure

## ⚙️ Getting Started

### 📥 1. Clone the Repository

```bash
git clone https://github.com/edwin-niwaha/perpetual_ict.git
cd perpetual_ict
```

## 🖥️ 2. Backend Setup (Django)

```
cd perpetual-api

# Create and activate the supported environment (Git Bash on Windows)
python -m venv .venv
source .venv/Scripts/activate

# Install the tested API dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Local SQLite database and admin account
python manage_local.py migrate
python manage_local.py createsuperuser
python manage_local.py runserver 127.0.0.1:8100
```
## Python dependency files

Use Python 3.12 and the project virtual environment. `requirements.txt` installs `requirements-web.lock.txt`, the tested Django 5.2 API dependency set. `requirements-web.txt` contains compatible direct dependency ranges for deliberate upgrades. Gunicorn is included for non-Windows deployments using the existing Procfile.

PowerShell activation: `.\.venv\Scripts\Activate.ps1`. Git Bash activation: `source .venv/Scripts/activate`. After replacing an old environment, run `deactivate` and activate it again so the shell resolves the new Python. Verify with `python -m django --version` and `python -m pip check`.

Use `python manage_local.py <command>` for local development. This launcher selects `.venv` first, falls back to `.venv-web`, and always uses `config.local`, even when the shell resolves a different Python.

To use ordinary `python manage.py <command>` commands in your activated virtual environment, add this to the API directory's local `.env`:

```dotenv
DJANGO_SETTINGS_MODULE=config.settings
DJANGO_ENV=development
FRONTEND_URL_DEVELOPMENT=http://localhost:3000
```

`manage.py` loads this file before selecting Django settings. Existing shell or hosting environment variables take precedence over `.env`, and `--settings` takes precedence over both. `config.settings` selects development or production from `DJANGO_ENV`; an omitted flag defaults to production. Use `DJANGO_ENV=production` with the production environment template when deploying. Local settings use SQLite in `db.sqlite3`. Keep the local `.env` out of deployments; `.env.example` and `.env.production.example` describe production configuration.

A `DEBUG must be false in production` error during local migration means production settings were selected. Use the local `.env` setting above, `python manage_local.py makemigrations`, or `DJANGO_ENV=development` with `DJANGO_SETTINGS_MODULE=config.settings`.

## Uploaded images

All image uploads use Cloudinary in development and production: profile pictures,
team and testimonial portraits, journal covers, product images, and site visuals.
The existing model ImageFields use shared Cloudinary storage, store public IDs,
and return HTTPS delivery URLs. API and Django admin uploads use the same backend;
failed uploads do not fall back to disk.

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the
API's private `.env` or hosting environment using your [Cloudinary console](https://console.cloudinary.com/).
Never put the API secret in frontend variables. Local uploads also require these
credentials; a separate Cloudinary product environment can isolate development.
See `.env.development.example`.

Existing files in `media/` are not automatically migrated. Upload them again through
the relevant editor to store them in Cloudinary. Existing external image URL fields
remain supported. Static assets continue to use Django's staticfiles storage.
Offline tests explicitly override storage or mock Cloudinary's upload/delete calls.

## Code quality

Install Ruff separately as a development tool with `python -m pip install ruff`.
From `perpetual-api`, run:

```bash
ruff check .
ruff format --check .
python -m pip check
python manage.py test --settings=config.local
python manage.py makemigrations --check --dry-run --settings=config.local
```

Virtual environments, migrations, generated static files, and media are excluded
from Ruff's source checks.

## Production deployment

See [the deployment guide](../PRODUCTION.md) for required environment variables,
release commands, security settings and administrator access. Staff sign in
directly at /sign-in; no authentication links appear in public navigation.

## Email delivery (Resend)

All application and Django framework email uses `config.email_backends.ResendEmailBackend`.
The backend follows PendezaConnect's Django mail adapter pattern, using Resend's fixed HTTPS
endpoint with verified TLS, a 10-second timeout, no redirects, sanitized failure logging,
and an idempotency key per message object. It supports text/HTML, reply-to, CC/BCC and attachments.
There is no SMTP fallback and no browser-side Resend key.

Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a Resend-verified sender), and `HOST_EMAIL`
(the staff inbox) in the API `.env` for local development and your hosting secret store
for production. Local runs also use Resend; Django's test runner uses an in-memory backend,
and transport tests mock HTTPS so they do not deliver mail. Never reuse another project's credentials.

Contact and newsletter notifications run after database commit. A delivery failure is logged
without message content or credentials; the submission remains saved for staff. Delivery is synchronous with persisted per-recipient records and idempotency keys. Staff can retry failures from Email deliveries in Django admin or the targeted retry_email_notifications command; there is no automatic retry worker. Contact confirmations contain
fixed text, while submitted content is sent only to the staff inbox. Duplicate newsletter requests
receive the same public response and do not trigger another notification.

API throttles ignore caller-supplied `X-Forwarded-For`. Apply per-client limits at trusted ingress,
especially when Next.js shares one API source address. Authentication payloads are bounded and
refresh attempts are throttled. Keep ingress request size limits consistent with Django and Next.js.


## Client portal

The client portal API is `GET /api/auth/portal/` and read/unread updates use
`PATCH /api/auth/notifications/<id>/` with `{"read": true}`. Both require authentication
and enforce ownership. Clients cannot access another account's messages or team email copies.
Portal notifications optionally trigger email when created by staff. Portal services support
published Available and Coming soon cards. See `PRODUCTION.md` for migration and email retry commands.

Email receipts distinguish saved inquiries from provider acceptance. A provider ID confirms
acceptance, not inbox delivery. The local test sender is Perpetual Labs at `onboarding@resend.dev`;
Resend restricts this sender to the account owner's email. Verify your own domain before sending
to arbitrary clients. Restart Django after changing mail environment variables.

## Google login environment checks

Run `python manage.py check_social_login` to display the selected environment and the exact Google Console origin and callback URL without printing credentials. See [Google setup for both environments](../perpetual-web/docs/journal-and-google-login.md).

## Deploy from GitHub to Railway

See [Railway deployment](docs/railway-deployment.md) for service roots, environment variables, PostgreSQL, migrations, health checks, and first-deployment steps.
