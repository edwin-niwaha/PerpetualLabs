# Deploy Perpetual Labs from GitHub to Railway

The repository contains independent Django and Next.js applications. Deploy them as **two services in one Railway project**, plus PostgreSQL. The checked-in configs use Railpack; you do not need Docker installed locally.

## 1. Push the application source

Commit the source, migrations, lockfiles, `railway.json`, `railpack.json` (web), runtime files, and deployment docs to GitHub. This workspace already has substantial uncommitted application work; include the required new files, not just the deployment configs. Do not commit `.env`, `.env.local`, databases, media, logs, or build directories.

GitHub stores source, not your local database or uploads. Existing local content is not automatically copied to production. The database migrations seed initial site/team/service content, but journal entries, client accounts, uploads, and later edits need a deliberate data migration or can be recreated through the deployed administration tools.

## 2. Create services before the first deployment

Create a Railway project with PostgreSQL (named `Postgres` below) and two empty services named `api` and `web`. Connect both services to the same GitHub repository and deployment branch. Set these values in each service's Settings:

| Setting          | API                                        | Web                                   |
| ---------------- | ------------------------------------------ | ------------------------------------- |
| Root Directory   | `/perpetual-api`                           | `/perpetual-web`                      |
| Config File Path | `/perpetual-api/railway.json`              | `/perpetual-web/railway.json`         |
| Watch Paths      | `/perpetual-api/**`                        | `/perpetual-web/**`                   |
| Build            | `python manage.py collectstatic --noinput` | `npm run build:clean`                 |
| Start            | Gunicorn, from checked-in config           | `npm run start -- --hostname 0.0.0.0` |
| Health check     | `/health/`                                 | `/health`                             |

Build/start/health commands are already defined in the config files. The web's `railpack.json` installs from the lockfile with `npm ci --include=dev`; Node 24 and Python 3.12 are selected in the projects. Keep build dependencies enabled: TypeScript, Tailwind, and the React compiler are needed during `next build`.

If each application is in its own GitHub repository instead, use `/` as Root Directory and `/railway.json` as Config File Path, and adjust Watch Paths accordingly.

Railway's config-file path is relative to the repository, not the Root Directory. See the [official monorepo guide](https://docs.railway.com/deployments/monorepo).

Generate public Railway domains for **both** services, then configure variables below before deploying. Use the final HTTPS origins, with no path or trailing slash. You can start with Railway domains and add custom domains later.

## 3. Configure API variables

Use `perpetual-api/.env.railway.example` as a checklist; enter values in Railway Variables rather than uploading a real `.env` file.

| Variable                                                               | Value                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `DJANGO_ENV`                                                           | `production`                                                        |
| `DJANGO_SETTINGS_MODULE`                                               | `config.settings`                                                   |
| `DEBUG`                                                                | `False`                                                             |
| `SECRET_KEY`                                                           | A unique random value, at least 50 characters                       |
| `DATABASE_URL`                                                         | `${{Postgres.DATABASE_URL}}` (adjust the service name if necessary) |
| `DB_SSL_REQUIRE`                                                       | `True` for Railway's SSL-enabled PostgreSQL template                |
| `SITE_URL`                                                             | `https://perpetuallabs-production.up.railway.app`                   |
| `FRONTEND_URL`                                                         | `https://YOUR-WEB.up.railway.app`                                   |
| `ALLOWED_HOSTS`                                                        | `perpetuallabs-production.up.railway.app,healthcheck.railway.app`   |
| `TRUST_PROXY_HEADERS`                                                  | `True` behind Railway ingress                                       |
| `RESEND_API_KEY`                                                       | Your Resend API key                                                 |
| `RESEND_FROM_EMAIL`                                                    | Sender address on your verified Resend domain                       |
| `HOST_EMAIL`                                                           | Your team inbox for contact notifications                           |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Your existing Cloudinary account credentials                        |

Generate `SECRET_KEY` locally with `python -c "import secrets; print(secrets.token_urlsafe(64))"`. Paste it directly into Railway and keep it stable across deployments. Do not use the validation values from tests.

Railway supplies `PORT`; Gunicorn binds to it automatically. Health checks use the hostname `healthcheck.railway.app`, so retain that explicit host. The API health endpoint bypasses the HTTPS redirect while normal application requests stay protected. [Railway health-check documentation](https://docs.railway.com/deployments/healthchecks).

The API requires working Resend and Cloudinary settings in production and intentionally fails startup when required configuration is missing. Public media lives in Cloudinary, not the ephemeral application filesystem. No application volume is required for uploaded images; PostgreSQL retains its own managed volume.

Optional: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` together, and register `https://YOUR-WEB.up.railway.app/auth/google/callback` in Google Cloud. The callback is derived from `FRONTEND_URL`; avoid a leftover localhost `GOOGLE_REDIRECT_URI`. `PASSWORD_RESET_TIMEOUT` defaults to 3600 seconds. Leave `HSTS_INCLUDE_SUBDOMAINS` and `HSTS_PRELOAD` disabled until all your own subdomains are ready.

## 4. Configure web variables

Use `perpetual-web/.env.railway.example`:

| Variable                             | Value                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `API_BASE_URL`                       | Public API HTTPS origin: `https://perpetuallabs-production.up.railway.app` |
| `NEXT_PUBLIC_SITE_URL`               | Public web HTTPS origin: `https://YOUR-WEB.up.railway.app`                 |
| `DJANGO_ADMIN_URL`                   | `https://perpetuallabs-production.up.railway.app/admin/`                   |
| `NODE_ENV`                           | `production`                                                               |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Stable base64-encoded 32-byte random key                                   |

Generate the action key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Use the same value at build and runtime and across replicas. The web service reads `PORT` automatically. Do not set a permanent `NEXT_DIST_DIR`; the standard Railway build uses `.next`.

Origins are validated during production builds. Set these variables **before** the first build. Use the public HTTPS API domain: this application deliberately does not accept a plain-HTTP private Railway hostname as `API_BASE_URL`. API secrets, database credentials, and Resend credentials belong only on the API service, never in `NEXT_PUBLIC_*` variables.

## 5. Deploy and initialize

Deploy the API first. Its pre-deploy command applies migrations (including profile pictures) and creates the shared throttle-cache table. If migrations fail, deployment fails rather than starting against an incompatible schema. Static assets are built into the image with WhiteNoise; pre-deploy filesystem changes are not relied upon. [Railway pre-deploy lifecycle](https://docs.railway.com/deployments/pre-deploy-command).

After the API health check passes, deploy the web. In the API service's Railway shell, run `python manage.py createsuperuser` once to create your administrator. Do not store an administrator password in source or repeatedly create the account on startup.

Confirm:

- API `/health/` and web `/health` return `{"status":"ok"}`.
- `/blog` loads and topic/search links work after refresh.
- Sign-in, profile/picture updates, password change/reset, and Google login if configured work on the public web domain.
- A contact submission and password-reset request reach your inbox through your verified sender.
- Admin CSS/images load; media URLs use Cloudinary.
- The service logs contain no missing-variable, migration, origin, or storage errors.

Use Railway PostgreSQL backups before future schema changes. Health checks are deployment probes, not ongoing uptime monitoring.

## 6. Later custom domains and redeployments

Update API `SITE_URL`, `ALLOWED_HOSTS`, and `FRONTEND_URL`; update web `API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, and `DJANGO_ADMIN_URL`; update Google's authorized callback. Rebuild the web after origin changes because public values are compiled into the client bundle. `NEXT_PUBLIC_SITE_URL` must match the browser's actual origin or form submissions are rejected. Keep one canonical web origin; configure redirects for aliases.

Existing JWT sessions issued before password-revocation support require a fresh sign-in. Reset email currently uses a bounded in-process queue; an abrupt process restart can discard a pending reset request, in which case the client should request another link. See the account-management report for details.

No GitHub push, Railway resource creation, secret configuration, or live deployment is performed by the preparation work. The first hosted deployment remains yours to initiate.

## Local verification recorded

- Production Next.js build completed successfully on Node 24.
- 29 Django configuration/deployment/journal tests passed; migration drift check found no missing migrations.
- Three search/sorting/pagination tests passed.
- Desktop and mobile reader tests passed, including search, filter persistence after reload, pagination, keyboard focus, responsive overflow checks, and WCAG accessibility scans.
- Production web `/health` returned 200 for Railway's probe hostname.
- Django `collectstatic` produced a production manifest. `check --deploy` reported only the expected optional HSTS subdomain/preload warnings; these stay disabled until all custom subdomains have been verified.

A hosted Railway build, real PostgreSQL connection, real email delivery, and Cloudinary uploads still require your service variables and first deployment.

## Configured domains and private local files

The production website is `https://perpetuallabs.tech`. The API configuration uses `https://perpetuallabs-production.up.railway.app`: use the generated Railway domain for the API service, add `perpetuallabs.tech` to the web service, and configure the web domain’s DNS records as Railway directs.

- `perpetual-api/.env` remains the local development configuration, preserving existing credentials. Use `python manage_local.py runserver`.
- `perpetual-api/.env.production` is a **private Railway API import file**, containing the existing mail/storage/Google credentials and a separate generated production Django secret. Paste its contents into the API service Variables Raw Editor. Django does not automatically load this file locally. The PostgreSQL reference expects a Railway service named `Postgres`.
- `perpetual-web/.env` contains the stable private Server Actions encryption key. Copy that variable into the Railway web service.
- `perpetual-web/.env.local` selects localhost for `npm run dev`.
- `perpetual-web/.env.production.local` selects production domains for production builds; copy these three origin variables into Railway's web service too. Next.js gives this file precedence over `.env.local` in production. Set `NODE_ENV=production` on Railway, not in shared local files.

All five files are ignored by Git and excluded from deployment images. GitHub deployment therefore requires copying their variables into Railway; committing them is not part of deployment. Existing sender verification and Google credentials were preserved; register `https://perpetuallabs.tech/auth/google/callback` with that OAuth client. Real delivery and domain ownership remain to be verified on deployment.
