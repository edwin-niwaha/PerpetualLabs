# Perpetual Labs API

The **Django 5.2 / Django REST Framework** backend for the [Perpetual Labs web application](../perpetual-web/README.md). It manages accounts, client services and notifications, public website content, the product catalog, and journal publishing.

## Capabilities

- Username/password registration, JWT authentication, optional Google sign-in, and password-bound token revocation.
- Username-based password recovery with expiring, single-use reset links; authenticated password changes.
- Current-user profile retrieval, validated partial updates, and profile-picture upload/replacement/removal.
- A client portal with account-owned inquiries and notifications.
- Staff-managed services, projects, products, testimonials, team profiles, page sections, FAQs, and site settings.
- Journal drafts, Markdown content, cover images, publication, and scheduled public visibility.
- Resend email, Cloudinary media storage, Django admin, local API documentation, and deployment health checks.

## Runtime and integrations

| Component            | Configuration                                                                  |
| -------------------- | ------------------------------------------------------------------------------ |
| Python               | 3.12                                                                           |
| Framework            | Django 5.2, DRF, Simple JWT                                                    |
| Dependencies         | Pinned, self-contained `requirements.txt` |
| Development database | Local PostgreSQL via `config.local`                                        |
| Production database  | PostgreSQL via `DATABASE_URL`                                                  |
| Media                | Cloudinary in development and production                                       |
| Email                | Resend in development and production; tests use memory/mocks                   |
| Production server    | Gunicorn with WhiteNoise static assets                                         |

## Local setup

From the repository root in PowerShell:

```powershell
cd perpetual-api
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# First setup only: preserve existing credentials.
if (!(Test-Path .env)) { Copy-Item .env.development.example .env }
.\.venv\Scripts\python.exe manage_local.py migrate
.\.venv\Scripts\python.exe manage_local.py createsuperuser
.\.venv\Scripts\python.exe manage_local.py runserver 127.0.0.1:8000
```

Before running migrations, start PostgreSQL and create the local database named in `DB_NAME`. Set `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST=localhost`, and `DB_PORT=5432` in `.env`; leave `DATABASE_URL` empty to use those values. Use `DB_SSL_REQUIRE=False` for a local server without TLS. Configure Resend and Cloudinary credentials before testing mail or image uploads. Credentials are not included in the repository. For macOS/Linux, create the environment with `python3.12 -m venv .venv` and use `.venv/bin/python` for the remaining commands.

`manage_local.py` selects `.venv`, falling back to `.venv-web`, and forces development settings. It defaults to PostgreSQL. Use local `DB_*` credentials with an empty `DATABASE_URL`, or supply a local PostgreSQL URL. Use this launcher for local administration; use `manage.py` with production variables on the host.

| Local URL                        | Purpose               |
| -------------------------------- | --------------------- |
| `http://127.0.0.1:8000/admin/`   | Django administration |
| `http://127.0.0.1:8000/swagger/` | OpenAPI UI            |
| `http://127.0.0.1:8000/redoc/`   | API reference         |
| `http://127.0.0.1:8000/health/`  | Health response       |

Production disables the public API documentation. Start the frontend separately using its [setup instructions](../perpetual-web/README.md#local-setup).

### Optional catalog setup

After configuring Cloudinary, install the reviewed product catalog and media:

```powershell
.\.venv\Scripts\python.exe manage_local.py seed_website
```

The command preserves existing admin edits. `--update` explicitly restores catalog defaults. Versioned originals are in [content-assets](content-assets/README.md); uploaded media goes to the configured storage. Database migrations seed other initial website records. Neither migrations nor GitHub deployments copy your existing local accounts, journal entries, or database to production.

## Environment configuration

Use [.env.development.example](.env.development.example) locally and [.env.railway.example](.env.railway.example) for production. Shell/host variables take precedence over `.env`.

| Variables                                                              | Purpose                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `DJANGO_SETTINGS_MODULE=config.settings`, `DJANGO_ENV`                 | Select development or production settings                                            |
| `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`                                 | Django security configuration; production requires a strong secret and `DEBUG=False` |
| `SITE_URL`, `FRONTEND_URL`                                             | Production API/web origins                                                           |
| `SITE_URL_DEVELOPMENT`, `FRONTEND_URL_DEVELOPMENT`                     | Local origin overrides                                                               |
| `FRONTEND_URL_PRODUCTION`                                              | Optional explicit production frontend override                                       |
| `DATABASE_URL`, `DB_SSL_REQUIRE`                                       | Production PostgreSQL connection                                                     |
| `TRUST_PROXY_HEADERS`                                                  | Enable only behind the configured trusted ingress                                    |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `HOST_EMAIL`                    | Mail provider, verified sender, and staff inbox                                      |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media storage credentials                                                            |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                             | Optional OAuth client; configure both together                                       |
| `PASSWORD_RESET_TIMEOUT`                                               | Reset-link lifetime in seconds; default `3600`                                       |
| `WEB_CONCURRENCY`                                                      | Gunicorn workers; default `2`                                                        |

Production fails startup when required settings are missing or unsafe. Keep secrets out of source control. The private `.env.production` file, if present locally, is an import aid for Railway Variables; Django does not load it automatically.

Google's callback derives from the selected frontend origin: `<frontend>/auth/google/callback`. Check configuration without printing credentials:

```powershell
.\.venv\Scripts\python.exe manage_local.py check_social_login
```

## API overview

Paths below are relative to the API origin. JWT-authenticated clients send `Authorization: Bearer <access-token>`; the Next.js application handles this server-side.

| Endpoint                                                                   | Methods            | Access / purpose                                           |
| -------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| `/api/auth/register/`                                                      | POST               | Public registration                                        |
| `/api/auth/login/`                                                         | POST               | Username/password login                                    |
| `/api/token/refresh/`                                                      | POST               | Refresh an access token                                    |
| `/api/auth/forgot-password/`                                               | POST               | Generic reset-request response                             |
| `/api/auth/reset-password/`                                                | POST               | Validate reset credentials and replace password            |
| `/api/auth/profile/`                                                       | GET, PATCH         | Current user's profile                                     |
| `/api/auth/profile/picture/`                                               | PUT, DELETE        | Current user's picture                                     |
| `/api/auth/change-password/`                                               | POST               | Verify current password and change it                      |
| `/api/auth/portal/`                                                        | GET                | Current user's portal                                      |
| `/api/auth/notifications/<id>/`                                            | PATCH              | Mark an owned notification read/unread                     |
| `/api/auth/contacts/`                                                      | POST               | Public inquiry submission; record management is staff-only |
| `/api/services/list/`                                                      | GET                | Public services                                            |
| `/api/projects/list/`, `/api/projects/products/`, `/api/projects/visuals/` | GET                | Public project/catalog content                             |
| `/api/blog/blog-posts/`                                                    | GET                | Published journal entries whose publication time is due    |
| `/api/blog/journal/`                                                       | GET, POST          | Staff journal list/create                                  |
| `/api/blog/journal/<id>/`                                                  | GET, PATCH         | Staff journal retrieval/update                             |
| `/api/blog/subscribe/`                                                     | POST               | Newsletter subscription                                    |
| `/api/content/`                                                            | GET                | Public company content snapshot                            |
| `/api/manage/`                                                             | Resource-dependent | Staff content-management router                            |
| `/health/`                                                                 | GET                | Deployment health response                                 |

See local Swagger for schemas and the [account endpoint contracts](docs/client-account-management.md) for payloads and throttling. API permissions remain authoritative even when a frontend hides restricted controls.

## Media, email, and security behavior

Images accept JPEG, PNG, or WebP up to 4 MiB and 16 million pixels. The API verifies and re-encodes image contents. Cloudinary uploads use the existing storage integration with an explicit 15-second request timeout. Journal upload failures return a cover-field error and roll back the database save.

Resend is used locally too; local development is not an email sandbox. Automated tests use mocked delivery or an in-memory backend. Use a verified sender domain to mail clients. Contact/newsletter submissions persist independently of notification delivery; staff can review delivery records and retry failures through admin or the targeted `retry_email_notifications` command.

Password-reset email uses a bounded in-process queue. It is not durable across abrupt process restarts; clients can request another link. Reset responses avoid account enumeration, links expire and cannot be reused after a successful reset, and password changes invalidate existing access/refresh tokens. Sign-out clears browser cookies; it does not individually revoke copied JWTs.

Production uses explicit HTTPS origins, secure cookies, shared database-backed throttling, and no password/body logging. Configure trusted-ingress rate limits as well: server-side web requests can share one API source address. Never trust arbitrary forwarded-IP headers.

## Checks and tests

Run from `perpetual-api`:

```powershell
.\.venv\Scripts\python.exe manage_local.py check
.\.venv\Scripts\python.exe manage_local.py test --noinput
.\.venv\Scripts\python.exe manage_local.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe -m pip check
# Focused journal and storage checks:
.\.venv\Scripts\python.exe manage_local.py test api.blog api.test_cloudinary_images --noinput
```

For Python lint/format checks, install the development tool `ruff`, then run `python -m ruff check .` and `python -m ruff format --check .` inside the virtual environment. Browser tests live in [perpetual-web](../perpetual-web/README.md#browser-tests).

## Railway deployment

Follow the [full deployment guide](../perpetual-web/docs/railway-deployment.md). The checked-in [railway.json](railway.json) uses:

| Setting                    | Value                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| Service root / config path | `/perpetual-api` / `/perpetual-api/railway.json`                          |
| Build                      | `python manage.py collectstatic --noinput`                                |
| Pre-deploy                 | `python manage.py migrate --noinput && python manage.py createcachetable` |
| Start                      | `gunicorn config.wsgi:application --config gunicorn.conf.py`              |
| Health check               | `/health/`                                                                |

Configure PostgreSQL, Resend, Cloudinary, and public origins before deployment. Railway supplies `PORT`; include `healthcheck.railway.app` in `ALLOWED_HOSTS`. The configured API domain is `perpetuallabs-production.up.railway.app`, paired with `perpetuallabs.tech` for the web service; use the generated API domain and connect the custom website domain with the DNS records Railway provides.

Run `python manage.py createsuperuser` once in the deployed API service. Run `python manage.py check --deploy` against production settings. Static files are generated during build; uploads remain in Cloudinary. Back up PostgreSQL before future schema changes.

## Project structure and guides

```text
api/accounts/     Authentication, profiles, portal, and notifications
api/blog/         Journal and newsletter
api/home/         Company settings, sections, FAQs, and features
api/projects/     Projects, products, site visuals, and catalog seeding
api/services/     Service catalog
api/testimonials/ Testimonials
api/storage.py    Cloudinary upload timeout configuration
config/           Environment-specific settings, mail backend, and health endpoint
content-assets/   Seed artwork and image credits
static/           Source static assets; staticfiles/ is generated output
docs/             Account, deployment, and email guides
```

- [Client account management](docs/client-account-management.md)
- [Railway deployment](docs/railway-deployment.md)
- [Resend domain setup](docs/resend-domain.md)
- [Frontend and staff workspace](../perpetual-web/README.md)

## Choosing a database

`config.database.database_config(ssl_require=False)` prefers a non-empty `DATABASE_URL`. If absent, it uses `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` (default `5432`). Both PostgreSQL paths use a 600-second connection lifetime and connection health checks.

- **Isolated SQLite:** use `LOCAL_DATABASE=sqlite` only when explicitly needed, such as isolated browser tests. The old `db.sqlite3` is retained but is not the development default.
- **Local PostgreSQL (default):** use `LOCAL_DATABASE=postgresql`. Provide a local `DATABASE_URL`, or leave it empty and configure the `DB_*` values. Set `DB_SSL_REQUIRE=False` only if your local PostgreSQL server does not support TLS.
- **Railway production:** set `DJANGO_ENV=production`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`, and `DB_SSL_REQUIRE=True`. `LOCAL_DATABASE` does not affect production. Without a URL, production requires explicit non-empty `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_HOST` instead of accepting development defaults.

Run `python manage.py migrate --noinput` in the deployed API to apply the schema. This does **not** copy records from local SQLite/PostgreSQL to production. Moving existing data requires a separate export/import and backups of both databases; seeded production records must be reconciled before importing. No existing data is transferred by changing these settings.
