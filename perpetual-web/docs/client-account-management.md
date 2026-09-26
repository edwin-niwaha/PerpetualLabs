# Client account management

The existing `/account` profile editor now includes date of birth and profile-picture upload/change/removal. Names and biography retain their existing validation. Username/email remain fixed. The sidebar displays the stored picture or initials, and links to `/account/change-password`.

`/forgot-password` is linked from sign-in and accepts the existing username identifier. `/reset-password` reads the emailed link's fragment, removes it from the URL, and validates new-password confirmation. Both use the existing galaxy authentication layout and form styles. Successful reset/change clears the HTTP-only session cookies and redirects to a sign-in success notice. Invalid, expired, and used links offer a new reset request.

New forms reuse the existing field, status, submit, API error, and session helpers. File uploads are checked before submission and on the server; the API performs actual content validation and re-encoding. The existing 5 MB Server Action body limit accommodates the 4 MiB image limit.

## Configuration and migration

No new web environment variables or dependencies. Existing `API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` apply. Deploy the API migration `0007_user_profile_picture` and restart both applications before using these screens. Password-bound JWTs require previously signed-in clients to sign in again at deployment.

See `perpetual-api/docs/client-account-management.md` for endpoint contracts, throttling, optional reset expiry, and email queue limitations. Google-only accounts continue using Google sign-in; the password forms do not silently create credentials for them.

## Tests

```text
npm run typecheck
npm run lint
npm run test:account
```

`test:account` starts an isolated API on port 8002 and web app on port 3002, using the existing API virtual environment (or `PLAYWRIGHT_PYTHON`). It uses `perpetual-api/account-e2e.sqlite3`, `perpetual-api/media/account-e2e`, and `.next-account-e2e`, and an in-memory email backend that cannot send real mail. Fixture accounts are removed after each test. It does not touch the existing development database. Ports must be available or already serving these exact test servers. The normal browser suite excludes this isolated suite.

Six scenarios run on desktop and mobile: forgot-password confirmation, profile and picture lifecycle, image validation, password-change errors and session clearing, reset-link errors/success/reuse, and unauthenticated page redirects. The API suite separately covers expiry, security, permission boundaries, and mail delivery.

## Recorded verification results

All six desktop scenarios passed, including a focused re-run of the picture lifecycle after correcting the PNG fixture. All six mobile scenarios passed. TypeScript and ESLint passed. The account screenshot was visually reviewed, test servers were stopped, and generated test-server entries were removed from `tsconfig.json`.

The API's full account suite passed 65 tests, including 25 new security/feature tests; Django checks, migration drift, and scoped Ruff checks passed.

## Web files changed for this task

- `src/app/forgot-password/page.tsx` (new)
- `src/app/reset-password/page.tsx` (new)
- `src/app/account/change-password/page.tsx` (new)
- `src/components/account-auth-panel.tsx` (new)
- `src/components/account-forms.tsx` (new)
- `src/lib/account-actions.ts` (new)
- `src/app/account/page.tsx`
- `src/app/account/account.module.css`
- `src/app/sign-in/page.tsx`
- `src/components/forms.tsx`
- `src/lib/actions.ts`
- `src/lib/types.ts`
- `next.config.ts`
- `package.json`
- `playwright.config.ts`
- `playwright.account.config.ts` (new)
- `scripts/e2e-account.py` (new)
- `tests/account-management.spec.ts` (new)
- `docs/client-account-management.md` (this file)

Pre-existing changes were retained. Generated build, browser report, log, and test-data artifacts remain inside the two requested projects.
