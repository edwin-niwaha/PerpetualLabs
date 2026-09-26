# Perpetual Labs Web

The public website, client portal, and staff content workspace for Perpetual Labs. Built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**, backed by the [Django API](../perpetual-api/README.md).

## What the application includes

- Responsive company, services, projects, about, and contact pages, with published FAQs and editable company information.
- A product catalog for PendezaConnect, JobellStores, DuukaYo, and FinCore, with publication controls and image fallbacks.
- A public journal with search, topic filters, sorting, pagination, share links, and Markdown articles. Search settings persist in the URL.
- Username/password registration and sign-in, optional Google sign-in, password recovery, profile editing, profile pictures, and password changes.
- A client portal with services, inquiries, and account notifications.
- Staff workspaces for website content and journal entries, including drafts, preview, scheduled publication, and cover uploads.

Django is the source of truth for published records. Empty collections stay empty; availability failures display appropriate states. Shared company copy can use bundled defaults when its API snapshot is unavailable. Staff changes do not require a frontend rebuild.

## Architecture

```text
Browser → Next.js pages, Server Actions and Route Handlers → Django REST API
                                                            ├─ SQLite locally / PostgreSQL in production
                                                            ├─ Cloudinary media
                                                            └─ Resend email
```

JWT access and refresh tokens stay in HTTP-only cookies. Authenticated API calls run on the Next.js server. Django independently enforces permissions. Production uses secure cookies, explicit origins, and HTTPS. Password changes and resets invalidate password-bound JWTs.

The web application requires a Node.js runtime and a reachable API; it is not a static export.

## Local setup

Requirements: **Node.js 24**, npm, and the API running on `http://127.0.0.1:8000`. Follow the [API setup](../perpetual-api/README.md#local-setup) first.

From the repository root, in a second PowerShell terminal:

```powershell
cd perpetual-web
npm ci
# First setup only: preserve an existing .env.local.
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open [localhost:3000](http://localhost:3000). Sign in at `/sign-in`. Staff accounts open `/account/content`; clients open `/account`.

### Environment variables

| Variable                             | Purpose                                                              | Local value                    |
| ------------------------------------ | -------------------------------------------------------------------- | ------------------------------ |
| `API_BASE_URL`                       | Server-only Django origin                                            | `http://127.0.0.1:8000`        |
| `NEXT_PUBLIC_SITE_URL`               | Canonical browser origin                                             | `http://localhost:3000`        |
| `DJANGO_ADMIN_URL`                   | Browser-accessible Django admin                                      | `http://127.0.0.1:8000/admin/` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Stable base64-encoded 32-byte key for production builds and replicas | Optional locally               |

Use `.env.local` for local origins and `.env.production.local` for local production-build overrides. Shared private settings may live in `.env`. Next.js gives `.env.production.local` precedence over `.env.local` for production; hosting environment variables take precedence over files.

Copy production settings from [.env.railway.example](.env.railway.example) into Railway Variables. The configured production origins are `https://perpetuallabs.tech` and `https://perpetuallabs-production.up.railway.app`; use the generated Railway API domain and configure the custom website domain’s DNS. Never put API credentials into `NEXT_PUBLIC_*` variables or commit private environment files.

## Pages and workspaces

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

### Journal editing

A title, short introduction, and entry body are required for drafts and publication. The editor validates text limits, dates, Cloudinary URLs, and JPEG/PNG/WebP covers up to 4 MiB. The API also validates and re-encodes image contents.

Save a draft, then publish or schedule the same entry without leaving the editor. New saves retain their entry ID. Preview renders Markdown without executing raw HTML. Future publication dates keep entries out of the public journal until due.

The browser sends saves through `POST /api/journal`, which verifies staff access and forwards the request to Django. Saves have a 45-second browser deadline; failed saves retain the current writing and show errors. If a save cannot be confirmed, check All entries before retrying. Unsaved writing is not automatically persisted across reloads or closed tabs.

## Development commands

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

### Browser tests

```powershell
npx playwright install chromium
npm run test:e2e
# Focused journal coverage:
npx playwright test tests/journal.spec.ts tests/journal-validation.spec.ts
# Isolated account features:
npm run test:account
```

The standard suite expects API/web servers on ports **8000/3000** and creates temporary fixtures in the local development database. Do not target production. Fixtures select the API `.venv`, then `.venv-web`; use `PLAYWRIGHT_PYTHON` to override. `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_EXPECT_TIMEOUT` are available for local test configuration.

The account suite starts isolated services on **8002/3002**, uses a separate SQLite database and build directory, and disables real email delivery. See [account testing details](docs/client-account-management.md).

## Railway deployment

Deploy the API and web as separate services from this repository, with PostgreSQL for the API. Follow the [complete Railway guide](docs/railway-deployment.md) for variables, custom domains, migrations, and first-deployment checks.

The web [railway.json](railway.json) specifies:

- Service root: `/perpetual-web`; config path: `/perpetual-web/railway.json`.
- Build: `npm run build:clean`; [railpack.json](railpack.json) installs locked dependencies with `npm ci --include=dev`.
- Start: `npm run start -- --hostname 0.0.0.0`; Railway supplies `PORT`.
- Health check: `/health`.

Set production variables before building. Private `.env` files are ignored by Git and excluded from deployment images, so a GitHub push does not configure Railway secrets or transfer local data/uploads.

## Project structure

```text
src/app/           Pages, layouts, styles, and Route Handlers
src/components/    Shared UI, forms, content cards, and editors
src/lib/           API/session helpers, validation, and server-side operations
src/proxy.ts       Origin checks and security headers
scripts/           Local fixtures and generated-file cleanup
tests/             Playwright flows, validation, and accessibility checks
docs/              Feature and deployment guides
```

## Further documentation

- [API setup and endpoint overview](../perpetual-api/README.md)
- [Railway deployment](docs/railway-deployment.md)
- [Client account management](docs/client-account-management.md)
- [Website content management](docs/web-content-management.md)
- [Journal and Google login](docs/journal-and-google-login.md)
- [Content sources](docs/content-sources.md) and [image credits](../perpetual-api/content-assets/README.md)
