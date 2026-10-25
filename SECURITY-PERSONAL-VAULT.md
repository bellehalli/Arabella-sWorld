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
4. **Authorization:** validate every table, RPC, and storage bucket in isolated staging; no service-role keys in browser, GitHub or logs. The owner reports that the `001_private_sync.sql` RLS/RPC smoke passed in staging on October 24, 2026, and later reports that `002_private_attachments.sql` applied successfully and the attachment acceptance script passed, including cleanup. These are user-reported results, not independently rerun in this review.
5. **Sensitive data:** device-only main and Care workspaces now encrypt data at rest in the browser. Review the local vault cryptography independently and validate supported devices before entering real sensitive data. Cloud payloads are not end-to-end encrypted. Encryption cannot stop a compromised browser from reading decrypted data.
6. **Sessions and browser:** protect against XSS; enforce restrictive CSP with audited exceptions, HSTS over HTTPS, frame protections, no secrets in query strings, and safe import/file handling. Test all script and style resources under CSP.
7. **Backups:** encrypted, versioned exports with integrity/authentication checks, offline copy, documented key loss consequences, and a demonstrated restore. Plain JSON export is NOT an encrypted backup.
8. **Supply chain:** lockfile and dependency review, GitHub secret scanning if available without cost, Dependabot/security alerts if available, CI syntax/tests and automated audit. Do not auto-upgrade dependencies to production.
9. **Privacy:** zero advertising trackers, no default AI upload of private data, explicit per-request consent and minimum data sharing; document retention and deletion.
10. **Operations:** log only necessary security events without sensitive content; document incident response: revoke sessions, rotate credentials, review access, restore and notify as appropriate.

## Existing implementation findings
- `api/config.js` fails closed when cloud configuration is missing or invalid, except for the explicit localhost-only development flag. This source behavior has automated tests; deployed headers and routing still need a staging/production-host check.
- `cloud.mjs` uses Supabase email OTP and checks membership client-side; that membership check is only a UX guard. The RLS policies are the authorization boundary and have not been live-tested. Supabase sessions persist in browser storage.
- **Main workspace:** device-only snapshot data and local record drafts now use a versioned AES-256-GCM envelope in localStorage. A random data key is wrapped by a PBKDF2-SHA256 passphrase key and a separate high-entropy recovery code. Startup requires unlock; setup migrates existing records and drafts using staged, verified writes; settings provides explicit lock, 15-minute idle lock, passphrase rotation, and recovery-code rotation. Focused automated tests cover recovery and metadata-write rollback. The cloud snapshot remains in Supabase and is not end-to-end encrypted. This local change has focused automated tests but still needs independent cryptographic review and real-device/browser validation before using sensitive records.
- **Personal Care vault:** the current `care.html` uses `encryptedCareStore` and AES-256-GCM encrypted local storage with a passphrase-derived key; plaintext legacy migration is explicit and removes the legacy copy only after successful encrypted persistence. Care data does not sync. A legacy plaintext adapter remains in `care-workspace.mjs` for migration/tests and is not used by the current care page.
- Care backup import now rejects files above 35 MB before reading them, and the decryptor checks encoded field sizes before base64 decoding. The bounded-input regression is local only; browser memory behavior still needs device testing.
- `database/001_private_sync.sql` has owner-scoped RLS. The revision checks now reject NULL/missing revision values using NULL-safe comparisons and a JSON numeric-type check. The migration has not been executed or independently tested in isolated staging.
- `database/002_private_attachments.sql` adds a private Storage bucket, owner-scoped metadata table, and owner-path Storage policies. Files are restricted to PDF/JPG/JPEG/PNG/WebP/TXT/DOCX and 15 MB. Client upload checks signatures; image/PDF/text previews are supported, DOCX is download-only, and file deletion precedes metadata deletion. Cloud attachments are not end-to-end encrypted, and attachment bytes are not part of workspace backups. The migration and acceptance script have not yet been run in staging.
- Money CSV export now neutralizes spreadsheet formula prefixes in text cells. Regression tests cover formula characters, control/space prefixes, CSV quoting, and numeric amount preservation.
- `vercel.json` sets CSP, `nosniff`, referrer and anti-framing headers. An authenticated fetch of the current Preview API returned HSTS, CSP, `nosniff`, frame denial, strict referrer policy, no-store, and noindex headers. Static assets and an unauthenticated external access check still need direct verification.
- No verified passkey/MFA enrollment, device-level sign-in/revocation drill, encrypted care sync, supported-device recovery drill, or independent penetration test. Vercel reports SSO protection for environments, but an unauthenticated external access-denial test remains open.

## Main-workspace encryption design
- The device-only encryption and recovery design plus current implementation limits are recorded in `docs/MAIN_WORKSPACE_ENCRYPTION_DESIGN.md`.
- Main-workspace encryption is implemented in `local-vault.mjs`, integrated into startup and storage writes, with focused round-trip, wrong-key, tamper, and failed-migration tests. The design and known limits are recorded in `docs/MAIN_WORKSPACE_ENCRYPTION_DESIGN.md`.
- Local plaintext migration is automatic after the user creates a passphrase, confirms saving the separately displayed recovery code, and confirms setup. Do not use this build for sensitive records until independent review and supported-device testing are complete. The app now locks the local vault after 15 minutes of inactivity and provides passphrase and recovery-code rotation. These flows have focused automated tests but still need supported-device testing and an independent cryptographic review. Existing Supabase auth tokens remain managed by Supabase JS in browser storage; cloud payloads remain readable to the configured cloud service and authorized application.
- Supabase account inspection initially found one project (`Arabella’s World`), treated as production. The owner reports creating a separate `Arabella’s World Staging` project and two test accounts. The owner reports that `scripts/staging-authorization-smoke.mjs` passed: owner, non-owner, anonymous, RLS, and RPC checks succeeded and state was not modified. This result is user-reported, not independently inspected from the dashboard. No production configuration was changed.
- `scripts/staging-attachments-acceptance-interactive.mjs` gathers short-lived owner and non-owner OTP sessions locally. `scripts/staging-attachments-acceptance.mjs` is designed to exercise upload, metadata read, owner download, non-owner/anonymous denial, and cleanup in staging only. It hard-rejects the known production project ref. The owner reports the migration and staging acceptance passed, including upload, owner access, denied non-owner/anonymous access, and cleanup. This report has not been independently rerun.

## Source audit snapshot — 2026-10-25
- Reviewed storage/auth boundaries, the API config endpoint, sync migration, import/export code, browser security headers, care-vault crypto, automation engine and related tests. No dedicated Codex Security scan/preflight tool was exposed in this workspace, so this is a source review and test run, not a certified or independent security scan.
- `npm audit --offline` reported 0 known dependency advisories across the lockfile from the local npm cache. This is not a fresh registry audit. A repository scan for high-confidence AWS/Supabase secret-key patterns found none; it is not a full history or entropy-based secret scan.
- Verified source fixes: SQL revision null/type checks; CSV formula neutralization; care backup import size bounds. They do not substitute for independent cryptographic review or staging authorization tests.
- Prior verification: full local suite passed 270/270 on the earlier bundle; this local ZIP is not a git checkout, so repository history and `git diff --check` are unavailable. Current verification results are recorded below after the latest focused changes. The GitHub workflow requests read-only repository permissions and runs `npm audit --audit-level=high`; its latest remote run and full-history secret scan have not been inspected.

### Data-path inventory
| Data | Current path | Protection and limits |
|---|---|---|
| Main records, preferences, task/focus state, rule and approval history | Device-only mode stores an AES-GCM envelope at `arabella-dreamhub-v2`; cloud mode stores one owner-scoped JSONB snapshot in Supabase | Device-only local data is encrypted while locked. Cloud data is not end-to-end encrypted; cloud RLS and two-device conflict behavior still need live staging tests. |
| Unsaved drafts, recent places, reminder opt-in | Drafts use AES-GCM envelopes in localStorage; recent places and reminder opt-in use plain localStorage keys | Draft text is encrypted at rest while locked. Recent places store route IDs only. Reminder opt-in is a browser flag. |
| Care products, routines, completion history | `arabella-dreamhub-care-vault-v1` localStorage key | AES-GCM encrypted envelope; passphrase remains in memory while unlocked; no sync. Legacy plaintext key is used only for explicit migration. |
| Photos | Compressed data URLs embedded in selected main-workspace records | Local record data, so encrypted at rest with the main snapshot while the local vault is locked; input/compressed-size caps exist. |
| Cloud attachments | Private `dreamhub-attachments` Storage bucket with `dreamhub_attachments` metadata | Invited-owner RLS and owner-prefixed random object keys; 15 MB and MIME allowlist; no public bucket. Cloud provider can access file bytes; no end-to-end encryption or backup manifest/restore. Staging migration and live acceptance are pending. |
| Backups/imports | User-downloaded JSON or passphrase-encrypted files; imports read by the browser | Full workspace file import is capped at 30 MB; care encrypted import capped at 35 MB; restore/merge asks for explicit review. |
| Automation executions and approvals | Main workspace records in the same local/cloud snapshot | No separate telemetry service. Private titles are masked in selected summaries; main storage protection remains open. |

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
| Missing/wrong local vault key | Ciphertext cannot decrypt and source bytes remain intact |
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


## Security verification update — 2026-10-25

- Local changes in this review add a per-record attachment-count boundary test, auth-session invalidation/sign-out draft cleanup, local-vault idle locking and credential rotation, plus focused sanitizer coverage. These are source-level regressions, not live provider tests.
- Existing tests cover import conflict preview and rollback, encrypted restore validation, stale-device conflicts, reconnect queue behavior, storage quota failure, failed local-vault migration, and interrupted migration resume. These use test data and mocks; they do not prove browser/device or live staging behavior.
- The current hosted Vercel Preview `/api/config` returned HTTP 200 with `{"enabled":false}`. It is not wired to staging, so hosted staging login, authorization, sync, restore, and failure cases cannot pass on this deployment. No production or hosting configuration was changed.
- Dependency audit was attempted offline because no secret scanner binary is installed. An offline audit is limited by the local npm advisory cache. Full secret scanning, repository-history scanning, hosted bundle/log inspection, and fresh registry audit remain to be completed.
- The Vercel authenticated Preview response showed CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, strict referrer policy, `Cache-Control: no-store`, and `X-Robots-Tag: noindex`. This checks only the fetched API response; static files and externally unauthenticated access denial remain open.
- The automated local-vault idle lock and credential-rotation tests do not count as independent cryptographic review. Recovery and interrupted migration have simulated storage tests only.
- No security approval or production go-live is implied by this review.

- Current verification on 2026-10-25: `npm test` passes 289/289; 20 focused security tests pass; all `.mjs` and `api/*.js` files pass `node --check`; online `npm audit --audit-level=high` reports 0 known vulnerabilities. See `docs/SECURITY-ACCEPTANCE-2026-10-25.md` for hosted checks and remaining gates.
