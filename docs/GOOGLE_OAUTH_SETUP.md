# Google authorization — staged implementation

Project: `arabellasworld`. Origin: `https://belle-dreamhub.vercel.app`.

This branch adds a server-side authorization start route and a fail-closed callback that validates CSRF state. It intentionally **does not exchange codes or store tokens**. Do not use this as a completed integration.

## Before enabling

1. Establish and verify DreamHub owner authentication on the server. Current Supabase browser auth and owner membership checks are not enough to secure a standalone API route.
2. Add encrypted, owner-bound refresh-token storage and revocation, with least-privilege access and audit controls.
3. Add `GOOGLE_OAUTH_STATE_SECRET` as a random 32+ byte secret in Vercel; do not reuse the OAuth client secret.
4. Register `https://belle-dreamhub.vercel.app/api/auth/google/callback` as an authorized redirect URI **only after** the secure flow is complete.
5. Complete token exchange, Google API access, refresh, sync, and explicit write approvals, with tests. Then redeploy.

The current callback returns HTTP 503 after validating state; it never exchanges the code. Google credentials must remain in Vercel, never committed to the repository.
