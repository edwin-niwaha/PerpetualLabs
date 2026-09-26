# Perpetual Labs

The Perpetual Labs public website, client portal, staff workspace, and Django REST API share this repository. Deploy the API and web as separate Railway services.

| Project | Stack | Directory |
| --- | --- | --- |
| API | Python 3.12, Django 5.2, Django REST Framework | [perpetual-api](perpetual-api/) |
| Web | Node.js 24, Next.js 16, React 19, TypeScript, Tailwind CSS 4 | [perpetual-web](perpetual-web/) |
| Integrations | PostgreSQL, Cloudinary media, Resend email, optional Google sign-in | Configured per service |

Production website: [perpetuallabs.tech](https://perpetuallabs.tech). API origin: `https://perpetuallabs-production.up.railway.app`.

## Getting started

1. Follow [API local setup](#api-local-setup), including creating a local PostgreSQL database.
2. Start the frontend in a second terminal using [web local setup](#web-local-setup).
3. For production, configure separate Railway services with roots `/perpetual-api` and `/perpetual-web`, using the [API deployment settings](#api-railway-deployment) and [web deployment settings](#web-railway-deployment).

This README covers both projects. Commands below state which directory to use. These are regular folders, not Git submodules.

- [API endpoints](#api-overview)
- [API environment configuration](#environment-configuration)
- [Database configuration and data migration](#choosing-a-database)
- [Web environment variables](#environment-variables)
- [Pages and workspaces](#pages-and-workspaces)
- [API checks](#checks-and-tests) and [browser tests](#browser-tests)

## API

The **Django 5.2 / Django REST Framework** backend for the [Perpetual Labs web application](#web). It manages accounts, client services and notifications, public website content, the product catalog, and journal publishing.

### Capabilities

- Username/password registration, JWT authentication, optional Google sign-in, and password-bound token revocation.
- Username-based password recovery with expiring, single-use reset links; authenticated password changes.
- Current-user profile retrieval, validated partial updates, and profile-picture upload/replacement/removal.
- A client portal with account-owned inquiries and notifications.
- Staff-managed services, projects, products, testimonials, team profiles, page sections, FAQs, and site settings.
- Journal drafts, Markdown content, cover images, publication, and scheduled public visibility.
- Resend email, Cloudinary media storage, Django admin, local API documentation, and deployment health checks.

### Runtime and integrations

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

### API local setup

From the repository root in PowerShell:

```powershell
cd perpetual-api
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# Configure perpetual-api/.env as described below before running migrations.
.\.venv\Scripts\python.exe manage_local.py migrate
.\.venv\Scripts\python.exe manage_local.py createsuperuser
.\.venv\Scripts\python.exe manage_local.py runserver 127.0.0.1:8000
```

Create `perpetual-api/.env` if it does not already exist, preserving any existing credentials. Set these local variables and fill in your database credentials and a generated secret:

```dotenv
# Local runtime
DJANGO_ENV=development
DEBUG=True
SECRET_KEY=<generated-secret>
# Local PostgreSQL
LOCAL_DATABASE=postgresql
DATABASE_URL=
DB_NAME=<local-database-name>
DB_USER=<local-database-user>
DB_PASSWORD=<local-database-password>
DB_HOST=localhost
DB_PORT=5432
DB_SSL_REQUIRE=False
```

Before running migrations, start PostgreSQL and create the local database named in `DB_NAME`. Set `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST=localhost`, and `DB_PORT=5432` in `.env`; leave `DATABASE_URL` empty to use those values. Use `DB_SSL_REQUIRE=False` for a local server without TLS. Configure Resend and Cloudinary credentials before testing mail or image uploads. Credentials are not included in the repository. For macOS/Linux, create the environment with `python3.12 -m venv .venv` and use `.venv/bin/python` for the remaining commands.

`manage_local.py` selects `.venv`, falling back to `.venv-web`, and forces development settings. It defaults to PostgreSQL. Use local `DB_*` credentials with an empty `DATABASE_URL`, or supply a local PostgreSQL URL. Use this launcher for local administration; use `manage.py` with production variables on the host.

| Local URL                        | Purpose               |
| -------------------------------- | --------------------- |
| `http://127.0.0.1:8000/admin/`   | Django administration |
| `http://127.0.0.1:8000/swagger/` | OpenAPI UI            |
| `http://127.0.0.1:8000/redoc/`   | API reference         |
| `http://127.0.0.1:8000/health/`  | Health response       |

Production disables the public API documentation. Start the frontend separately using its [setup instructions](#web-local-setup).

#### Optional catalog setup

After configuring Cloudinary, install the reviewed product catalog and media:

```powershell
.\.venv\Scripts\python.exe manage_local.py seed_website
```

The command preserves existing admin edits. `--update` explicitly restores catalog defaults. Versioned originals are in [content-assets](perpetual-api/docs/image-credits.md); uploaded media goes to the configured storage. Database migrations seed other initial website records. Neither migrations nor GitHub deployments copy your existing local accounts, journal entries, or database to production.

### Environment configuration

Use `perpetual-api/.env` locally and configure production variables directly in the Railway API service. The private `perpetual-api/.env.production`, when present, can be used as an import aid. Shell/host variables take precedence over `.env`. See the [deployment guide](perpetual-web/docs/railway-deployment.md) for production configuration.

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

### API overview

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

See local Swagger for schemas and the [account endpoint contracts](perpetual-api/docs/client-account-management.md) for payloads and throttling. API permissions remain authoritative even when a frontend hides restricted controls.

### Media, email, and security behavior

Images accept JPEG, PNG, or WebP up to 4 MiB and 16 million pixels. The API verifies and re-encodes image contents. Cloudinary uploads use the existing storage integration with an explicit 15-second request timeout. Journal upload failures return a cover-field error and roll back the database save.

Resend is used locally too; local development is not an email sandbox. Automated tests use mocked delivery or an in-memory backend. Use a verified sender domain to mail clients. Contact/newsletter submissions persist independently of notification delivery; staff can review delivery records and retry failures through admin or the targeted `retry_email_notifications` command.

Password-reset email uses a bounded in-process queue. It is not durable across abrupt process restarts; clients can request another link. Reset responses avoid account enumeration, links expire and cannot be reused after a successful reset, and password changes invalidate existing access/refresh tokens. Sign-out clears browser cookies; it does not individually revoke copied JWTs.

Production uses explicit HTTPS origins, secure cookies, shared database-backed throttling, and no password/body logging. Configure trusted-ingress rate limits as well: server-side web requests can share one API source address. Never trust arbitrary forwarded-IP headers.

### Checks and tests

Run from `perpetual-api`:

```powershell
.\.venv\Scripts\python.exe manage_local.py check
.\.venv\Scripts\python.exe manage_local.py test --noinput
.\.venv\Scripts\python.exe manage_local.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe -m pip check
# Focused journal and storage checks:
.\.venv\Scripts\python.exe manage_local.py test api.blog api.test_cloudinary_images --noinput
```

For Python lint/format checks, install the development tool `ruff`, then run `python -m ruff check .` and `python -m ruff format --check .` inside the virtual environment. Browser tests live in [perpetual-web](#browser-tests).

### API Railway deployment

Follow the [full deployment guide](perpetual-web/docs/railway-deployment.md). The checked-in [railway.json](perpetual-api/railway.json) uses:

| Setting                    | Value                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| Service root / config path | `/perpetual-api` / `/perpetual-api/railway.json`                          |
| Build                      | `python manage.py collectstatic --noinput`                                |
| Pre-deploy                 | `python manage.py migrate --noinput && python manage.py createcachetable` |
| Start                      | `gunicorn config.wsgi:application --config gunicorn.conf.py`              |
| Health check               | `/health/`                                                                |

Configure PostgreSQL, Resend, Cloudinary, and public origins before deployment. Railway supplies `PORT`; include `healthcheck.railway.app` in `ALLOWED_HOSTS`. The configured API domain is `perpetuallabs-production.up.railway.app`, paired with `perpetuallabs.tech` for the web service; use the generated API domain and connect the custom website domain with the DNS records Railway provides.

If `collectstatic` fails with an invalid `SECRET_KEY`, set a unique random production secret of at least 50 characters in the API service Variables, then redeploy. Keep `DJANGO_ENV=production` and `DEBUG=False`. Private environment files are not uploaded from GitHub, and Django does not automatically load `.env.production`.

Run `python manage.py createsuperuser` once in the deployed API service. Run `python manage.py check --deploy` against production settings. Static files are generated during build; uploads remain in Cloudinary. Back up PostgreSQL before future schema changes.

### API structure and guides

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

- [Client account management](perpetual-api/docs/client-account-management.md)
- [Railway deployment](perpetual-api/docs/railway-deployment.md)
- [Resend domain setup](perpetual-api/docs/resend-domain.md)
- [Frontend and staff workspace](#web)

### Choosing a database

`config.database.database_config(ssl_require=False)` prefers a non-empty `DATABASE_URL`. If absent, it uses `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` (default `5432`). Both PostgreSQL paths use a 600-second connection lifetime and connection health checks.

- **Isolated SQLite:** use `LOCAL_DATABASE=sqlite` only when explicitly needed, such as isolated browser tests. The old `db.sqlite3` is retained but is not the development default.
- **Local PostgreSQL (default):** use `LOCAL_DATABASE=postgresql`. Provide a local `DATABASE_URL`, or leave it empty and configure the `DB_*` values. Set `DB_SSL_REQUIRE=False` only if your local PostgreSQL server does not support TLS.
- **Railway production:** set `DJANGO_ENV=production`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`, and `DB_SSL_REQUIRE=True`. `LOCAL_DATABASE` does not affect production. Without a URL, production requires explicit non-empty `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_HOST` instead of accepting development defaults.

Run `python manage.py migrate --noinput` in the deployed API to apply the schema. This does **not** copy records from local SQLite/PostgreSQL to production. Moving existing data requires a separate export/import and backups of both databases; seeded production records must be reconciled before importing. No existing data is transferred by changing these settings.

## Web

The public website, client portal, and staff content workspace for Perpetual Labs. Built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**, backed by the [Django API](#api).

### What the application includes

- Responsive company, services, projects, about, and contact pages, with published FAQs and editable company information.
- A product catalog for PendezaConnect, JobellStores, DuukaYo, and FinCore, with publication controls and image fallbacks.
- A public journal with search, topic filters, sorting, pagination, share links, and Markdown articles. Search settings persist in the URL.
- Username/password registration and sign-in, optional Google sign-in, password recovery, profile editing, profile pictures, and password changes.
- A client portal with services, inquiries, and account notifications.
- Staff workspaces for website content and journal entries, including drafts, preview, scheduled publication, and cover uploads.

Django is the source of truth for published records. Empty collections stay empty; availability failures display appropriate states. Shared company copy can use bundled defaults when its API snapshot is unavailable. Staff changes do not require a frontend rebuild.

### Architecture

```text
Browser → Next.js pages, Server Actions and Route Handlers → Django REST API
                                                            ├─ PostgreSQL locally and in production
                                                            ├─ Cloudinary media
                                                            └─ Resend email
```

JWT access and refresh tokens stay in HTTP-only cookies. Authenticated API calls run on the Next.js server. Django independently enforces permissions. Production uses secure cookies, explicit origins, and HTTPS. Password changes and resets invalidate password-bound JWTs.

The web application requires a Node.js runtime and a reachable API; it is not a static export.

### Web local setup

Requirements: **Node.js 24**, npm, and the API running on `http://127.0.0.1:8000`. Follow the [API setup](#api-local-setup) first.

From the repository root, in a second PowerShell terminal:

```powershell
cd perpetual-web
npm ci
# First setup only: preserve an existing .env.local.
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open [localhost:3000](http://localhost:3000). Sign in at `/sign-in`. Staff accounts open `/account/content`; clients open `/account`.

#### Environment variables

| Variable                             | Purpose                                                              | Local value                    |
| ------------------------------------ | -------------------------------------------------------------------- | ------------------------------ |
| `API_BASE_URL`                       | Server-only Django origin                                            | `http://127.0.0.1:8000`        |
| `NEXT_PUBLIC_SITE_URL`               | Canonical browser origin                                             | `http://localhost:3000`        |
| `DJANGO_ADMIN_URL`                   | Browser-accessible Django admin                                      | `http://127.0.0.1:8000/admin/` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Stable base64-encoded 32-byte key for production builds and replicas | Optional locally               |

Use `.env.local` for local origins and `.env.production.local` for local production-build overrides. Shared private settings may live in `.env`. Next.js gives `.env.production.local` precedence over `.env.local` for production; hosting environment variables take precedence over files.

Copy production settings from [.env.railway.example](perpetual-web/.env.railway.example) into Railway Variables. The configured production origins are `https://perpetuallabs.tech` and `https://perpetuallabs-production.up.railway.app`; use the generated Railway API domain and configure the custom website domain’s DNS. Never put API credentials into `NEXT_PUBLIC_*` variables or commit private environment files.

### Pages and workspaces

| Route                                               | Purpose                            |
| --------------------------------------------------- | ---------------------------------- |
| `/`, `/about`, `/services`, `/projects`, `/contact` | Public website and inquiries       |
| `/blog`, `/blog/[slug]`                             | Journal archive and article reader |
| `/sign-in`, `/register`                             | Account access                     |
| `/forgot-password`, `/reset-password`               | Username-based password recovery   |
| `/account`                                          | Client portal and profile          |
| `/account/change-password`                          | Authenticated password change      |
| `/account/content`                                  | Staff website content management   |
| `/account/journal`                                  | Staff journal list                 |
| `/account/journal?edit=new`                         | New journal entry                  |
| `/account/journal?edit=<id>`                        | Edit an existing entry             |
| `/health`                                           | Deployment health endpoint         |

#### Journal editing

A title, short introduction, and entry body are required for drafts and publication. The editor validates text limits, dates, Cloudinary URLs, and JPEG/PNG/WebP covers up to 4 MiB. The API also validates and re-encodes image contents.

Save a draft, then publish or schedule the same entry without leaving the editor. New saves retain their entry ID. Preview renders Markdown without executing raw HTML. Future publication dates keep entries out of the public journal until due.

The browser sends saves through `POST /api/journal`, which verifies staff access and forwards the request to Django. Saves have a 45-second browser deadline; failed saves retain the current writing and show errors. If a save cannot be confirmed, check All entries before retrying. Unsaved writing is not automatically persisted across reloads or closed tabs.

### Development commands

Run from `perpetual-web`:

| Command                      | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `npm run dev`                | Local development server                            |
| `npm run lint`               | ESLint checks                                       |
| `npm run typecheck`          | Generate route types and check TypeScript           |
| `npm run build`              | Production build; requires valid production origins |
| `npm run start`              | Serve the completed production build                |
| `npm run clean -- --dry-run` | Preview generated-file cleanup                      |
| `npm run build:clean`        | Clean generated files, then build                   |
| `npm run test:e2e`           | Standard Playwright suite                           |
| `npm run test:account`       | Isolated account-management browser suite           |

Stop development/test servers before cleanup. Cleanup removes generated builds, reports, caches, and logs; the newly built `.next` directory is required by `npm run start`.

#### Browser tests

```powershell
npx playwright install chromium
npm run test:e2e
# Focused journal coverage:
npx playwright test tests/journal.spec.ts tests/journal-validation.spec.ts
# Isolated account features:
npm run test:account
```

The standard suite expects API/web servers on ports **8000/3000** and creates temporary fixtures in the local PostgreSQL development database. Do not target production. Fixtures select the API `.venv`, then `.venv-web`; use `PLAYWRIGHT_PYTHON` to override. `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_EXPECT_TIMEOUT` are available for local test configuration.

The account suite starts isolated services on **8002/3002**, uses a separate SQLite database and build directory, and disables real email delivery. See [account testing details](perpetual-web/docs/client-account-management.md).

### Web Railway deployment

Deploy the API and web as separate services from this repository, with PostgreSQL for the API. Follow the [complete Railway guide](perpetual-web/docs/railway-deployment.md) for variables, custom domains, migrations, and first-deployment checks.

The web [railway.json](perpetual-web/railway.json) specifies:

- Service root: `/perpetual-web`; config path: `/perpetual-web/railway.json`.
- Build: `npm run build:clean`; [railpack.json](perpetual-web/railpack.json) installs locked dependencies with `npm ci --include=dev`.
- Start: `npm run start -- --hostname 0.0.0.0`; Railway supplies `PORT`.
- Health check: `/health`.

Set production variables before building. Private `.env` files are ignored by Git and excluded from deployment images, so a GitHub push does not configure Railway secrets or transfer local data/uploads.

### Web structure

```text
src/app/           Pages, layouts, styles, and Route Handlers
src/components/    Shared UI, forms, content cards, and editors
src/lib/           API/session helpers, validation, and server-side operations
src/proxy.ts       Origin checks and security headers
scripts/           Local fixtures and generated-file cleanup
tests/             Playwright flows, validation, and accessibility checks
docs/              Feature and deployment guides
```

### Further documentation

- [API setup and endpoint overview](#api)
- [Railway deployment](perpetual-web/docs/railway-deployment.md)
- [Client account management](perpetual-web/docs/client-account-management.md)
- [Website content management](perpetual-web/docs/web-content-management.md)
- [Journal and Google login](perpetual-web/docs/journal-and-google-login.md)
- [Content sources](perpetual-web/docs/content-sources.md) and [image credits](perpetual-api/docs/image-credits.md)
