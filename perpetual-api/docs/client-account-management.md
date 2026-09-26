# Client account management

Clients use the existing `accounts.User` model and username login. Profile editing remains on `/account`; no parallel profile or authentication system was introduced.

## API contract

All paths are under the existing `/api/auth/` namespace and appear in Swagger v1.

| Method | Path | Body / behavior |
| --- | --- | --- |
| POST | `forgot-password/` | `username`. Same generic 200 response for eligible, unknown, inactive, and passwordless accounts. |
| POST | `reset-password/` | `uid`, `token`, `new_password`, `confirm_password`. Invalid, expired, or used links return 400. |
| POST | `change-password/` | Authenticated. `current_password`, `new_password`, `confirm_password`. |
| GET | `profile/` | Current authenticated user's profile, including `date_of_birth` and `profile_picture`. |
| PATCH | `profile/` | Partial changes to `first_name`, `last_name`, `bio`, `date_of_birth` only. |
| PUT | `profile/picture/` | Authenticated multipart upload in `profile_picture`. Returns the updated profile. |
| DELETE | `profile/picture/` | Removes current user's picture; idempotent 204. |

`/api/token/refresh/` now rejects password-revoked and deleted/inactive-account refresh tokens. Profile URLs never accept an account ID. Protected fields retain the existing read-only/ignored behavior, including username, email, roles, account status, permissions, password, and picture paths submitted through the profile endpoint.

Images use the existing configured storage and `RasterImageField`: JPEG/PNG/WebP, maximum 4 MiB and 16 million pixels, decoded and re-encoded as WebP under a generated filename. Replacement/removal deletes the old object after the database commit. Storage deletion failures are logged without file or account details and do not undo the successful profile update.

## Password and reset security

- Django's password validators remain authoritative; confirmation is checked, passwords are not trimmed, and inputs are capped at 128 characters.
- Django signed reset tokens expire after `PASSWORD_RESET_TIMEOUT` (default 3600 seconds). Changing the password invalidates every outstanding reset link. An atomic comparison against the previous password hash prevents simultaneous token consumption from succeeding twice.
- Reset links use the configured frontend origin, never the request Host header. Credentials are carried in a URL fragment and removed from the browser URL after opening, so they do not enter HTTP access logs or referrers. Refreshing the reset page requires reopening the email link.
- Lookup and email delivery run in a bounded queue (two workers, maximum 32 outstanding jobs per API process), so account existence and mail-provider latency do not change HTTP response work. All syntactically valid usernames are queued equally. Full/shutdown queues return the same 503 response regardless of account existence.
- The queue uses the existing Django email backend, including Resend. It is in-process and **not durable across an abrupt process restart**. Delivery failures are sanitized in logs; a client can request another link. Reset credentials are never persisted in the client-visible email history.
- JWTs are bound to the current password hash. Reset/change revokes access and refresh tokens; the web app clears its existing HTTP-only session cookies and returns to sign-in. This also means sessions issued before deployment without the revocation claim must sign in again.
- Password-only recovery deliberately excludes accounts with unusable passwords (e.g. Google-only accounts); those clients continue using Google sign-in.

Throttles reuse DRF and the configured cache: reset requests 10/hour per IP plus 5/hour per hashed username, reset confirmation 20/hour per IP, password changes 10/hour per authenticated user, picture mutations 20/hour per user, and profile access 120/hour per user. Existing proxy/IP trust rules apply. Production's shared database cache requires the already documented `createcachetable` setup.

## Deployment

1. Apply `accounts/0007_user_profile_picture.py` with the normal deployment settings: `python manage.py migrate`.
2. Keep the existing mail and media configuration. Set `FRONTEND_URL` (or the existing environment-specific frontend override) to the web application's public origin. Mail uses `EMAIL_BACKEND`, `DEFAULT_FROM_EMAIL`, and the existing Resend/SMTP settings.
3. Optionally set `PASSWORD_RESET_TIMEOUT=3600`. No new required environment variables or dependencies.
4. Restart API and web processes together. Existing sessions must sign in again.

The migration was exercised in isolated test databases; the existing local development database and production database were not migrated by this task.

## Verification

From `perpetual-api`, use the project's supported Python environment:

```text
.venv/Scripts/python.exe manage_local.py test api.accounts --noinput
.venv/Scripts/python.exe manage_local.py makemigrations --check --dry-run
.venv/Scripts/python.exe manage_local.py check
```

New coverage in `api/accounts/test_account_management.py` includes generic reset responses, mail failures and safe logging, queue saturation, no account lookup in the request, throttling, malformed payloads, expiry/invalid/reused tokens, concurrent/stale password mutations, revoked access/refresh tokens, profile isolation and protected fields, partial updates and validation, picture lifecycle and invalid files, password policy/confirmation/current-password checks, and Swagger.

Browser setup and commands are documented in `perpetual-web/docs/client-account-management.md`.

## Recorded verification results

- Full account suite: **65 tests passed**, including 25 new account-management/security tests.
- Django system checks: passed; migration drift check: no changes detected.
- Scoped Ruff and whitespace checks: passed.
- Browser coverage: all six desktop scenarios passed (picture lifecycle re-run after correcting the PNG fixture), and all six mobile scenarios passed.
- Frontend TypeScript and ESLint checks: passed.
- The profile/picture screenshot was visually reviewed. Test servers were stopped and test-generated TypeScript configuration changes were removed.

## Backend files changed for this task

- `api/accounts/account_management.py` (new)
- `api/accounts/password_reset_mail.py` (new)
- `api/accounts/test_account_management.py` (new)
- `api/accounts/migrations/0007_user_profile_picture.py` (new)
- `api/accounts/models.py`
- `api/accounts/serializers.py`
- `api/accounts/token_serializers.py`
- `api/accounts/views.py`
- `api/accounts/urls.py`
- `config/base.py`
- `.env.example`, `.env.development.example`, `.env.production.example`
- `.gitignore`
- `docs/client-account-management.md` (this file)

Pre-existing changes in these files and elsewhere were retained.
