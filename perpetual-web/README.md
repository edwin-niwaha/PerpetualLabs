# Perpetual Web

Next.js App Router, TypeScript, Tailwind CSS, and the existing Perpetual Labs Django API. Public content comes from Django, with reviewed company content from the previous Perpetual Labs website when a collection is empty or unavailable. See [content sources](docs/content-sources.md) for provenance and editorial decisions. No fictional projects, testimonials, or clients are seeded.

## Local setup (PowerShell)

Backend, from the repository root:

```powershell
cd perpetual-api
python -m venv .venv-web
.\.venv-web\Scripts\python.exe -m pip install -r requirements-web.lock.txt
.\.venv-web\Scripts\python.exe manage.py migrate --settings=config.local
.\.venv-web\Scripts\python.exe manage.py seed_website --settings=config.local
.\.venv-web\Scripts\python.exe manage.py createsuperuser --settings=config.local
.\.venv-web\Scripts\python.exe manage.py runserver 127.0.0.1:8000 --settings=config.local
```

The explicit local settings use SQLite and in-memory email, irrespective of database or SMTP credentials in the existing .env. Local email notifications are not delivered. The default requirements.txt now installs the tested API lock file.

In a second terminal:

```powershell
cd perpetual-web
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open http://localhost:3000. Manage real services, projects, published blog posts, team members, and testimonials at http://127.0.0.1:8000/admin/. Services, team members, and testimonials have bundled reference content; a nonempty API collection replaces that collection completely. Blog sections retain empty and unavailable states. Unpublished blog posts are excluded by Django. Article bodies are rendered as escaped plain text, preserving paragraphs; HTML is never executed.

## Environment

- API_BASE_URL: Django origin, server-only; defaults to http://127.0.0.1:8000.
- NEXT_PUBLIC_SITE_URL: canonical website origin; set the real HTTPS domain before production.

Both an accessible Django service and a Next.js Node runtime are required. This is not a static export. Private tokens never enter localStorage or browser JavaScript.

## API contracts

| Feature          | Django endpoint                  | Behavior                                                   |
| ---------------- | -------------------------------- | ---------------------------------------------------------- |
| Registration     | POST /api/auth/register/         | username, email, password; validates Django password rules |
| Sign in          | POST /api/auth/login/            | username/password → JWT pair                               |
| Refresh          | POST /api/token/refresh/         | refresh → access                                           |
| Profile          | GET/PATCH /api/auth/profile/     | authenticated current user only                            |
| Contact/feedback | POST /api/auth/contacts/         | name, email, user_message; persisted before success        |
| Services         | GET /api/services/list/          | list; detail routes resolve by slug                        |
| Projects         | GET /api/projects/list/          | list; detail routes resolve by slug                        |
| Journal          | GET /api/blog/blog-posts/        | published articles; detail routes resolve by slug          |
| Testimonials     | GET /api/testimonials/list/      | actual quotes only                                         |
| Team             | GET /api/auth/team-members/list/ | actual team records only                                   |

Profile updates support first_name, last_name, and bio. Username and email are read-only. Password reset, email verification, and email changes are outside the existing API capabilities and are not simulated.

## Security and production configuration

- Server Actions provide same-origin form handling and Next.js origin checks. Browser requests never call Django directly; keep Django CORS restricted for any other clients.
- JWTs are stored in HttpOnly, SameSite=Lax cookies; Secure is enabled in production. Access lasts 30 minutes, refresh 24 hours, matching Django. Account data and public content use no-store. Account pages verify identity through Django and recover from an expired access token using refresh.
- Sign-out clears both browser cookies. The existing API uses stateless JWTs; previously copied tokens remain valid until expiration. Server-side revocation is not implemented.
- Registration password logging was removed. Contact record reads and mutations require staff access; public clients can submit only.
- Django throttles login, registration, and contact creation. With a server-side frontend, Django sees the frontend server IP: deploy per-client rate limiting at the trusted ingress and configure the Django aggregate rates for expected traffic. Production settings use a shared database cache for throttling; run the createcachetable release command.
- Production must use config.settings, a long random SECRET_KEY, PostgreSQL, HTTPS, explicit hosts/origins, and configured SMTP/media. Never deploy config.local. Review Django deployment checks using the production configuration.
- Remote image optimization allows res.cloudinary.com only. Add other trusted media hosts to both next.config.ts and src/lib/site.ts when needed; untrusted image URLs receive a neutral fallback.
- Fonts are bundled locally. The decorative orbital artwork is CSS. No third-party trackers are installed.

## Deployment cleanup and dynamic images

Before deploying, stop local web/test servers and run `npm run build:clean`.
Railway uses this command automatically. It removes old `.next` and `.next-*`
builds, browser-test reports/results, coverage, static exports, logs, and TypeScript
build caches before generating the new production build. Keep the new `.next`
output: `npm run start` needs it. Use `npm run clean -- --dry-run` to preview
cleanup or `npm run clean` to remove generated output without rebuilding.

Content images are loaded from Django records at request time and stored in
Cloudinary in production. Staff can replace product images, team portraits,
site artwork, and journal covers without rebuilding the frontend. Keep backend
`content-assets/` (seed originals), `media/` (local uploads), and `static/`
(Django assets); these are not disposable build files.

## Verification

```powershell
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Content tests create temporary, clearly labeled service/project/article fixtures in local SQLite and remove them afterward.

Browser tests expect the local Django and Next.js development servers at ports 8000 and 3000. They create clearly named test accounts and contact records in local SQLite, and exercise desktop/mobile navigation, WCAG checks, registration errors, actual login/refresh, profile updates, logout, and contact submission. Do not run against production. Screenshots and reports are ignored by Git.

Backend:

```powershell
cd ../perpetual-api
.\.venv-web\Scripts\python.exe manage.py test api.accounts.tests api.blog.tests api.services.tests --settings=config.local
```

## Git layout

Both perpetual-api and perpetual-web are ordinary folders tracked by the PerpetualLabs repository. Commit backend and frontend changes together from the repository root. The original API Git history is preserved locally in .git/perpetual-api-history.bundle and .git/perpetual-api-history; these backups are not published.

## Current workspace preview

The local `.env.local` uses API port 8000 and website port 3000. Start Django with `python manage.py runserver 127.0.0.1:8000` and Next.js with `npm run dev`. If you change ports, update `API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` in `.env.local` to match. A stale API port causes contact submissions to report that the service is unavailable. Browser tests default to `http://localhost:3000`.

## Product catalog and galaxy media

Run `python manage.py migrate --settings=config.local` and `python manage.py seed_website --settings=config.local` from perpetual-api. This installs PendezaConnect, JobellStores, DuukaYo, FinCore, and two NASA image assets. The command preserves existing admin edits; use `--update` only to explicitly restore these defaults.

Products and Site visuals are editable in Django admin. Image files live in local `perpetual-api/media/` (ignored by Git), with paths and metadata in SQLite. Optimized originals are versioned in `perpetual-api/content-assets/` so a fresh install can reproduce them. Production uses the configured Cloudinary storage; run migrations and the content command against the intended production settings only when deploying. The frontend forwards local `/media/` requests to API_BASE_URL. Back up both database and media.

Public endpoints: `GET /api/projects/products/` and `GET /api/projects/visuals/`. Product writes require staff; unpublished products are hidden from public readers. Products have no static frontend fallback, so admin changes and publication settings remain authoritative. Homepage shows up to four featured products in sort order. Legacy Project records remain available separately.

M51 photography and NASA Earth texture include source credits in `perpetual-api/content-assets/README.md`. Planets are an artistic CSS animation, with pause/resume and reduced-motion support. PendezaConnect/JobellStores images are live-site captures; DuukaYo/FinCore images are labeled original illustrations. DuukaYo is in development, with no live-site link.

## Website content dashboard

Sign in at `/sign-in` with an existing Django staff account. Staff are redirected to `/account/content`; regular members retain their profile page. The dashboard also appears as a link on staff account pages.

Apply `python manage.py migrate --settings=config.local` for local development. The two `home` migrations create and seed Site settings, Page sections, FAQs and Features with the existing editorial copy. They preserve any existing matching records. Production deployments must apply migrations using production settings.

- Company details update the footer, contact page, home location strip, and about mission/vision.
- Page sections update the galaxy hero, home section introductions, about/contact introductions, sign-in copy, and shared contact invitation.
- FAQs and approach/values support creation, ordering, drafts and publication. An empty published collection stays empty; fallback copy is only used when the API is unavailable.
- Existing products support copy, link, availability, feature and publication edits. The dashboard links to Django admin for image uploads, new products, services, articles, team members and testimonials. Django admin has its own sign-in session.
- Set the server-only DJANGO_ADMIN_URL to the browser-accessible Django admin URL. NEXT_PUBLIC_ADMIN_URL remains a compatibility fallback. Deriving it from API_BASE_URL is limited to development, so private API origins are not exposed in production.

Public snapshot: `GET /api/content/`. Settings: `GET/PATCH /api/content/settings/`. Sections: `GET/POST/PATCH /api/content/sections/` (PATCH requires the record ID). FAQs and features: list/create at `/api/content/faqs/` and `/api/content/features/`; GET/PATCH/DELETE use `/<id>/`. All writes require staff authorization. Public FAQ/feature reads exclude drafts, including direct detail URLs. The snapshot always excludes drafts, even for staff. The current user's `is_staff` flag is read-only.

Server Actions validate fields, check the current staff identity and forward writes with HttpOnly session credentials. Django enforces staff permissions independently. Content reads bypass caching and successful dashboard writes refresh the website layout. No frontend rebuild is needed for editorial changes.

Additional checks: `python manage.py test api.home --settings=config.local` and `npx playwright test tests/admin.spec.ts`. Browser tests use temporary local staff accounts and remove their fixtures afterward.

## Avoiding an outdated Python environment

From `perpetual-api`, run `python manage_local.py createsuperuser` to create a local administrator. This standard-library launcher selects `.venv` first, falls back to `.venv-web`, and always uses `config.local`, regardless of the active shell environment. It also supports commands such as `python manage_local.py check` and `python manage_local.py migrate`. It preserves interactive username, email and password prompts.

A prompt displaying `(.venv)` does not guarantee a working environment: an old environment copied from another machine may reference a missing Python executable. Global Django 4.2 cannot run this project's Django 5.2 models and migrations. `manage.py` now reports this version mismatch before loading models. Use the supported environment rather than downgrading the constraints. For production, continue using `manage.py` with the production environment and settings.

The repaired `.venv` is also supported and contains the same locked API dependencies as `.venv-web`. In Git Bash, run `deactivate` and `source .venv/Scripts/activate` from `perpetual-api` to replace a stale shell activation. Install dependencies with `python -m pip install -r requirements.txt`; retain `--settings=config.local` for local Django commands.

## Production deployment

See [the deployment guide](../PRODUCTION.md) for required environment variables,
release commands, security settings and administrator access. Clients and staff sign in at /sign-in; the public Client portal link opens /account.

Browser fixtures use the supported .venv first, with .venv-web as a fallback, on
Windows and Unix. Set PLAYWRIGHT_PYTHON to override the interpreter. On a slow
local machine, PLAYWRIGHT_EXPECT_TIMEOUT can increase assertion timeouts without
changing the application's request timeouts; the default is 35000 milliseconds.


## Email and browser security

Website contact email is delivered by Django through Resend. Keep `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, and `HOST_EMAIL` only in the API service; no Resend secret belongs in
`NEXT_PUBLIC_*` variables. See the API README for delivery behavior and failure handling.

Production `API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` require HTTPS. Mutating requests must
carry the exact public Origin. Pages use per-request script nonces and dynamic rendering,
with private/no-store caching. Existing inline styles remain supported. Server Actions accept
at most 256 KB, and authenticated API requests are restricted to `/api/` on the configured
origin. Local media forwarding is enabled only in development.

Run `npx playwright test tests/security.spec.ts` against a running local web server to check
nonce rotation, injected-script blocking, cross-origin rejection, and same-origin sign-in.
These checks do not send email or create accounts.


## Client portal

Open `/account` through the Client portal navigation link. Clients can register at `/register`,
sign in, read and mark notifications, inspect email activity, view inquiries submitted while signed
in, and browse available/upcoming service announcements. Staff retain the website editor.
Emails marked Sent to provider have been accepted by the email provider; inbox delivery is not
confirmed. Failed delivery does not discard the inquiry, and the form explains partial failures.

Apply backend migrations before starting the frontend. Staff manage Portal notifications,
Email deliveries, and Portal services in Django admin. No historical guest messages are attached
to an account merely because its email matches. Portal browser tests use temporary local fixtures
and never send email: `npx playwright test tests/portal.spec.ts`.

## Daily journal and Google sign-in

Staff can write, preview, save drafts, schedule, and publish at `/account/journal`. Readers browse `/blog`. See [journal publishing and Google setup](docs/journal-and-google-login.md) for the workflow, OAuth client configuration, and automated/live verification steps.

## Deploy from GitHub to Railway

See [Railway deployment](docs/railway-deployment.md) for service roots, environment variables, PostgreSQL, migrations, health checks, and first-deployment steps.
