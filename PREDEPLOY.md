# Perpetual Labs: pre-deploy checklist

Git Bash commands. Use Python 3.12 and Node.js 24.x. Resolve failed checks before deploying.

## 1. API

```bash
cd "/d/PERPETUAL PROJECTS/PerpetualLabs/perpetual-api"
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe -m pip check
./.venv/Scripts/python.exe -m ruff check .
./.venv/Scripts/python.exe -m ruff format --check .
python manage_local.py check
python manage_local.py makemigrations --check --dry-run
python manage_local.py test
```

**If models changed**, create, review, and apply migrations locally before rerunning the checks:

```bash
python manage_local.py makemigrations
python manage_local.py migrate --plan
python manage_local.py migrate
```

Commit the migration files with the model changes. Do not generate migrations on Railway.

Keep `requirements.txt` project-specific; do not overwrite it with `pip freeze` from a global Python installation.

## 2. Web

Stop the web development server first:

```bash
cd "/d/PERPETUAL PROJECTS/PerpetualLabs/perpetual-web"
npm ci
npm run lint
npm run typecheck
npm run build
npm run test:account
```

Install the browser once or after a Playwright update: `npx playwright install chromium`.
For `npm run test:e2e`, first start `python manage_local.py runserver` in the API folder and `npm run dev` in the web folder, in separate terminals. Run browser tests against localhost only.

## 3. Review and push

```bash
cd "/d/PERPETUAL PROJECTS/PerpetualLabs"
git diff --check
git status --short
git diff
git diff --cached
```

Commit migrations, source images, and dependency/lockfile changes. Exclude secrets, `.env`, databases, backups, logs, and generated files. Push the reviewed commit to the branch connected to Railway.

## 4. Railway: migrations and static files

Confirm service roots are `/perpetual-api` and `/perpetual-web`, using their respective `railway.json` files. Back up PostgreSQL before schema changes. Keep production variables configured in Railway: API production settings and database connection; web production HTTPS API and site URLs.

**Already automated by the API deployment:**

```bash
# Build: Django static files
python manage.py collectstatic --noinput

# Pre-deploy: apply committed migrations and create the cache table
python manage.py migrate --noinput && python manage.py createcachetable
```

The web automatically runs `npm run build` and starts the production server. Watch both deployment logs; release a dependent web change after the API succeeds.

**To verify or apply migrations manually:** connect using the production API service's Railway SSH command. Confirm the container contains the intended commit, then run from the directory containing `manage.py`:

```bash
python manage.py check --deploy --settings=config.settings
python manage.py migrate --plan --settings=config.settings
python manage.py migrate --noinput --settings=config.settings
python manage.py migrate --check --settings=config.settings
```

Do not run manual migrations while automatic migrations are active. A failed deployment may leave SSH connected to the previous release; fix and redeploy the intended commit instead.

**Database target:** Django settings determine which database is changed, wherever the command runs. A local `manage.py` command can update Railway if configured with its reachable database connection. This project's `manage_local.py` uses local settings, currently selecting SQLite. Use `manage.py` with production settings on Railway.

**Static files:** keep `collectstatic` in the API build, not pre-deploy. For static changes, commit the source and redeploy. Web images in `public/images` ship with the web build. Uploaded media uses Cloudinary; local records and media are not transferred by Git or migrations.

## 5. After deployment

Confirm the intended commit is live, migration/build logs succeeded, and API `/health/` and web `/health` respond. Check home, projects, journal images, password/Google login, staff access, and contact/email delivery. Code rollback does not undo database migrations.

References: [Railway pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command) · [Railway SSH](https://docs.railway.com/cli/ssh).
