# Perpetual Web

Next.js App Router, TypeScript, Tailwind CSS, and the existing Perpetual Labs Django API. Public content is read from Django; no fictional projects, testimonials, or clients are seeded.

## Local setup (PowerShell)

Backend, from the repository root:

```powershell
cd perpetual-api
python -m venv .venv-web
.\.venv-web\Scripts\python.exe -m pip install -r requirements-web.lock.txt
.\.venv-web\Scripts\python.exe manage.py migrate --settings=config.local
.\.venv-web\Scripts\python.exe manage.py createsuperuser --settings=config.local
.\.venv-web\Scripts\python.exe manage.py runserver 127.0.0.1:8000 --settings=config.local
```

The explicit local settings use SQLite and in-memory email, irrespective of database or SMTP credentials in the existing .env. Local email notifications are not delivered. The older .venv and requirements.txt are preserved.

In a second terminal:

```powershell
cd perpetual-web
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open http://localhost:3000. Manage real services, projects, published blog posts, team members, and testimonials at http://127.0.0.1:8000/admin/. Empty sections show an honest empty state. Unpublished blog posts are excluded by Django. Article bodies are rendered as escaped plain text, preserving paragraphs; HTML is never executed.

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
- Django throttles login, registration, and contact creation. With a server-side frontend, Django sees the frontend server IP: deploy per-client rate limiting at the trusted ingress and configure the Django aggregate rates for expected traffic. A shared Django cache is required for consistent throttling across workers.
- Production must use config.settings, a long random SECRET_KEY, PostgreSQL, HTTPS, explicit hosts/origins, and configured SMTP/media. Never deploy config.local. Review Django deployment checks using the production configuration.
- Remote image optimization allows res.cloudinary.com only. Add other trusted media hosts to both next.config.ts and src/lib/site.ts when needed; untrusted image URLs receive a neutral fallback.
- Fonts are bundled locally. The decorative orbital artwork is CSS. No third-party trackers are installed.

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

This workspace uses API port 8100 and website port 3100 to avoid another running project. The ignored .env.local is configured accordingly. Start Django with runserver 127.0.0.1:8100 and Next.js with npm run dev -- --port 3100. Set $env:PLAYWRIGHT_BASE_URL="http://localhost:3100" before running browser tests.
