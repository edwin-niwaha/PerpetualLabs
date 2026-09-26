# Daily journal and Google login

## Posting an entry

1. Sign in with a staff account and select **Journal & daily posts** in the website workspace, or visit `/account/journal`.
2. Select **Write an entry**. Add a title, a short introduction and the body. Topic and Cloudinary cover image are optional.
3. Use Markdown (`## Heading`, `**bold**`, `- List`, `[link](https://...)`). The Preview tab renders the same safe Markdown readers see. Raw HTML is ignored.
4. **Save draft** keeps the entry private. **Publish entry** makes it public immediately. Enter a future local date/time to schedule it instead. Scheduled entries become visible at that time without a background worker.
5. Return to the desk to edit. Titles can change without breaking existing links. Saving a published entry as a draft removes it from the public journal.

There is no automatic draft saving: save before leaving the page. Public readers can search titles, introductions, authors and topics, filter by topic, sort, and page through the archive. Existing posts retain their dates and links. No sample articles are seeded into the real journal.

## Google Cloud setup for local and production

Create an OAuth client of type **Web application**. In Google Auth Platform / Clients, register each URL as a separate entry (no quotes, markdown, or spaces).

Assuming the production frontend is `https://perpetuallabs.tech`:

| Google Console field | Local | Production |
| --- | --- | --- |
| Authorized JavaScript origins | `http://localhost:3000` | `https://perpetuallabs.tech` |
| Authorized redirect URIs | `http://localhost:3000/auth/google/callback` | `https://perpetuallabs.tech/auth/google/callback` |

The server-side flow uses the redirect URI; JavaScript origins are not needed for this implementation, but the origins above are valid if you populate that field. An origin never includes the callback path. If the actual website uses `www`, use `https://www.perpetuallabs.tech` consistently instead. Do not use the Django API URL as this app's callback: the callback is served by Next.js.

Google supports `http://localhost` for development. Avoid computer names, private LAN IP addresses, `.local` domains, missing `http://`, wildcard domains, and email addresses. Put the localhost callback in the OAuth client's **Authorized redirect URIs**, not in the consent screen's **Authorized domains**. The consent screen domain, if requested, is `perpetuallabs.tech` without a scheme/path. While the consent app is in Testing, add your Google account as a test user.

### API configuration

In `perpetual-api/.env`:

```dotenv
DJANGO_SETTINGS_MODULE=config.settings
DJANGO_ENV=development
FRONTEND_URL_DEVELOPMENT=http://localhost:3000
FRONTEND_URL_PRODUCTION=https://perpetuallabs.tech
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret
```

For production, use `DJANGO_ENV=production` and configure the database, secret key, API origin, allowed hosts and other required deployment settings from `.env.production.example`. Changing this flag does not provision hosting or production secrets. `config.settings` chooses local SQLite/development settings or the strict production settings; an omitted flag defaults to production, and invalid values fail startup. `manage_local.py` deliberately remains a local-only launcher.

The callback is derived from the selected frontend URL. Normally **remove `GOOGLE_REDIRECT_URI`**; a stale explicit localhost override will correctly prevent production startup. A single `FRONTEND_URL` is also supported for deployments that use separate environment files. The environment-specific value takes precedence.

You may use one OAuth client with both redirects registered. For separate Google clients, use `GOOGLE_CLIENT_ID_DEVELOPMENT` / `GOOGLE_CLIENT_SECRET_DEVELOPMENT` and `GOOGLE_CLIENT_ID_PRODUCTION` / `GOOGLE_CLIENT_SECRET_PRODUCTION`. These override shared credential names for their respective environments. Keep all secrets on the API.

### Frontend configuration

Next.js is a separate process and uses its own environment. Do not set `NODE_ENV` manually.

Local `perpetual-web/.env.local`:

```dotenv
API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production hosting environment:

```dotenv
API_BASE_URL=https://YOUR-ACTUAL-API-HOST
NEXT_PUBLIC_SITE_URL=https://perpetuallabs.tech
```

Use the real API hostname. Run `npm run dev` locally; build and start/deploy Next.js for production. Do not ship the local `.env.local` file to production. `NEXT_PUBLIC_SITE_URL` must equal the selected API frontend origin, including `www` and ports. The web rejects a mismatched Google redirect instead of dropping the browser's login cookie on another host.

Restart Django and Next.js after changing environment values. Check the selected configuration without printing credentials:

```powershell
python manage.py check_social_login
```

This prints the environment, exact Google Console URLs, and whether both credentials are present. Production migrations must also be applied before using login.

## Behavior and security

- New Google identities create ordinary client accounts with unusable local passwords. Google cannot grant staff access.
- Returning users are identified by Google's immutable subject, not email.
- An email already used by a password account is not automatically linked. The user must use that existing username/password. An explicit account-linking workflow is not included.
- Google OAuth uses PKCE, random state and nonce, a 10-minute attempt, and a random HttpOnly browser verifier. Attempts are atomically consumed once. Google signatures, issuer, audience, expiry, verified email and nonce are checked.
- Provider credentials and tokens stay server-side. App JWTs use existing HttpOnly session cookies, Secure in production. Callbacks have no-store/no-referrer responses; JWTs never appear in redirect URLs.
- Missing configuration disables Google login with an honest message. Cancellation and failed verification return useful sign-in messages.

## Verification

API: `python manage.py test api.blog api.accounts config --noinput`.
Browser: `npx playwright test tests/journal.spec.ts` (running local API and web required).
Isolated Google boundary test in PowerShell:

```
$env:RUN_SOCIAL_FIXTURE='1'
npx playwright test tests/social-flow.spec.ts --project=desktop
```

This test starts a separate Next server on port 3105 and a local provider-boundary fixture. It checks redirects, verifier binding, HttpOnly cookies, staff routing and replay failure. It does not contact Google. API tests independently verify real RSA signatures and reject altered tokens, wrong audience/issuer, expired tokens, wrong nonce, unverified email and callback replay.

Live acceptance still requires your Google client: click **Continue with Google**, complete consent, verify the portal and sign out, then repeat sign-in. Also cancel once. Never substitute mocked results for this live verification.

References: [Google web server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Google ID token verification](https://google-auth.readthedocs.io/en/latest/reference/google.oauth2.id_token.html).
