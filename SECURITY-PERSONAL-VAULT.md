# DreamHub 3.0 — Personal Vault predeployment security plan

**Status:** Development only. NOT certified secure or approved for production. No new providers, paid products, production database changes, or deployment authorized.

## Security model and trust boundaries
Assets: journals, financial records, medical/wellness notes, photos, routines, credentials, backups and Studio data.
Threats: stolen device/session, compromised email, credential stuffing, XSS, malicious dependencies, public preview URLs, misconfigured database grants/RLS, lost encryption keys, accidental publication, and malicious backup imports.
Boundaries: public static code is **never a secret**; app login is separate from Supabase authorization; encrypted data is separate from encryption keys; GitHub CI is separate from production infrastructure.

## Mandatory launch gates
1. **Deployment access:** verify a deployment-level access gate on production and preview domains. Determine Vercel plan support/cost before enabling. Never claim a URL is hidden merely because of robots/noindex.
2. **Authentication:** invite-only users, MFA/passkeys where supported, tested account recovery, login throttling, revocation/logout on other devices, and session expiry. Current OTP email login alone is insufficient. Account email must have strong MFA.
3. **Fail closed:** production /api/config must return 503 if private-cloud credentials are absent or invalid. Local-only bypass permitted only with DREAMHUB_ALLOW_LOCAL_DEV=true AND a localhost Host header. Never use this environment flag in production.
4. **Authorization:** verify migration database/001_private_sync.sql in an isolated staging project; test anonymous, owner and second-account access to every table, RPC and bucket. No service-role keys in browser, GitHub or logs. Existing RLS is **not verified deployed**.
5. **Sensitive data:** move care and other sensitive records out of plaintext localStorage; until then do not enter real sensitive data. Design client-side authenticated encryption (Web Crypto AES-GCM, fresh random IV per item, key derivation with an audited mechanism) and a separate key recovery process. Never use a hardcoded key or reuse a password as an encryption key without a reviewed KDF. Encryption cannot stop a compromised browser from reading decrypted data.
6. **Sessions and browser:** protect against XSS; enforce restrictive CSP with audited exceptions, HSTS over HTTPS, frame protections, no secrets in query strings, and safe import/file handling. Test all script and style resources under CSP.
7. **Backups:** encrypted, versioned exports with integrity/authentication checks, offline copy, documented key loss consequences, and a demonstrated restore. Plain JSON export is NOT an encrypted backup.
8. **Supply chain:** lockfile and dependency review, GitHub secret scanning if available without cost, Dependabot/security alerts if available, CI syntax/tests and automated audit. Do not auto-upgrade dependencies to production.
9. **Privacy:** zero advertising trackers, no default AI upload of private data, explicit per-request consent and minimum data sharing; document retention and deletion.
10. **Operations:** log only necessary security events without sensitive content; document incident response: revoke sessions, rotate credentials, review access, restore and notify as appropriate.

## Existing implementation findings
- api/config.js previously returned enabled:false if cloud env was missing, exposing a local-only experience without login. Updated to fail closed except explicit localhost development.
- cloud.mjs uses Supabase email OTP and checks membership client-side; Supabase RLS must be tested separately. It currently persists a session in browser storage.
- care-workspace.mjs stores plaintext personal care information in localStorage and exports unencrypted JSON. This is **not yet Personal Vault compliant**.
- database/001_private_sync.sql has owner RLS policies but has not been executed or independently tested in a staging database.
- vercel.json has basic CSP and anti-framing headers; verify in real browser and add HSTS only after HTTPS configuration is confirmed.
- No verified passkey/MFA enrollment, deployment gate, encrypted care sync, automated restore, or independent penetration test.

## Verification matrix (must all pass before deployment)
| Test | Expected |
|---|---|
| No cloud configuration on public host | HTTP 503, no unprotected fallback |
| Explicit local dev flag + localhost host | Local-only mode, clearly labeled |
| Anonymous database access | Denied |
| Second invited/uninvited account cross-user access | Denied |
| Anonymous/unauthorized file access | Denied |
| Logged-out direct care.html request | No private content exposed |
| Invalid session or expired token | Denied |
| Repeated login attempts | Rate limited by approved auth provider |
| Stored XSS and malicious import | No script execution or private data leak |
| Missing/wrong encryption key | Ciphertext cannot decrypt |
| Encrypted backup restore | Exact data restored with valid key |
| GitHub secret scan and dependency audit | No unresolved critical/high findings |
| Mobile browser and accessibility test | Pass |
| Production and preview access gate | Verified from logged-out browser |
| Recovery drill | Successful |

## Cost and change approvals
Do not provision Supabase, buy security products, upgrade Vercel, connect providers, modify production auth settings, publish, merge, or deploy without explicit approval. Repository changes alone do not enable hosting protections.

## Recommended implementation sequence
A. Harden local app and automated tests.
B. Build encrypted care data model and migration, **without uploading real data**.
C. Test database RLS in isolated staging after approval.
D. Configure MFA/passkeys and deployment gate after feature/cost review and approval.
E. Conduct browser, adversarial and restore testing.
F. Obtain explicit production go/no-go approval.
