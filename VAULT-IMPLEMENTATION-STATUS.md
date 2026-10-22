# Personal Vault — implementation and launch checklist

## Implemented in this branch
- Encrypted care localStorage envelope (AES-256-GCM, PBKDF2-SHA256, random salt and nonce), unlocked with a user-entered passphrase of at least 16 characters.
- No passphrase persisted in localStorage, GitHub, or the server. The passphrase is held in memory while the care page is open.
- Explicit opt-in migration of existing plaintext care records: encrypt and persist first, then delete the original localStorage key. If writing fails, preserve the original.
- Wrong passphrase and invalid backup envelope fail without overwriting data.
- Encrypted care exports/imports already implemented; tests cover recovery and tampering.
- CI now checks main and vault branches, syntax and environment file leakage.
- Existing Vercel Authentication remains the outer gate. No new services or costs.

## Important limitations
- A browser password prompt protects **care content** at rest, not the static JavaScript/HTML assets. The existing Vercel Authentication protection must remain enabled until server-side authentication is fully implemented and verified.
- This is NOT a site-wide custom login yet. Do not replace Vercel Authentication with a JavaScript-only password screen.
- DreamHub main schema 2 still stores unencrypted data when in device-only mode. It must be migrated to encrypted storage separately, with a recovery plan and data-loss tests.
- Browser memory contains decrypted care records while unlocked; malware, XSS, and browser extensions may access them.
- If the passphrase is lost, encrypted care data cannot be recovered. Use an encrypted backup and store its passphrase safely. Encrypted local care does not yet sync across devices.
- Password-entry currently uses a native browser prompt. A themed unlock screen can replace the prompt after accessibility and security tests.
- Production /api/config requires valid Supabase configuration; do not set DREAMHUB_ALLOW_LOCAL_DEV on production.

## Still required before calling Personal Vault complete
1. Reconcile unmerged PR #8 Art of Living and PR #9 architecture with main.
2. Server-validated site-wide authentication and session cookies (or keep verified Vercel SSO); server-side rate limiting, session revocation and MFA.
3. Verify production and preview protection with an unauthenticated browser, including static assets, APIs, and care.html.
4. Encrypt main DreamHub records and any drafts, local photos and sensitive caches; preserve backups and explicit migrations.
5. Set up approved Supabase staging; test owner/anonymous/cross-account RLS, RPC and storage bucket access.
6. Browser, mobile, accessibility, XSS/import, backup recovery and offline failure tests.
7. Audit dependencies, update old README/staging claims, and document incident response.
8. Obtain explicit approval before any further production deployment, provider provisioning or paid services.

## Deployment decision
**Do not deploy this branch automatically.** Keep Vercel SSO enabled and retain the current production deployment while remaining security work is reviewed.
