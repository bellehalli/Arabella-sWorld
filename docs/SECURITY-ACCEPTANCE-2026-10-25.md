# Security acceptance checklist — 2026-10-25

**Scope:** local source bundle and the current hosted Vercel Preview. This is an engineering review, not an independent penetration test or production approval. No production data, Supabase production settings, or production deployment settings were changed. The staging URL was added to Preview for the review branch only.

## 1. Attachment upload validation

- Local tests reject unsupported SVG, mislabeled content, empty files, invalid text, and files above the 15 MB limit.
- A regression test verifies the per-record limit rejects the eleventh attachment before storage upload.
- A metadata-write failure test verifies that the just-uploaded object is removed.
- The owner previously reported that the staging SQL migration and upload, owner download, denied non-owner/anonymous access, and cleanup acceptance passed. This report did not rerun it against Supabase.

## 2. Session, import, sync, restore, and migration failures

- Automated tests cover auth sign-out/revocation event handling, successful sign-out draft cleanup, failed sign-out preserving drafts, rich-text script/event/unsafe-link sanitization, import preview and conflicts, stale-device conflict review, offline reconnect queue, encrypted restore validation, storage quota errors, and interrupted local-vault migration recovery.
- These results use local test data and mocked auth/storage. Live Supabase token expiry/revocation, live browser sign-out, network interruption, and production browser storage quota behavior still need testing.

## 3. Local-vault encryption

- Source review covers AES-GCM envelopes, PBKDF2 passphrase wrapping, separate recovery-code wrapping, staged migration, and metadata rotation writes.
- Automated tests cover unlock by passphrase and recovery code, wrong-secret/tamper failure, interrupted migration resume, failed metadata commit, passphrase rotation, recovery-code rotation, and a deterministic 15-minute idle-lock timer.
- An independent cryptographic review and recovery/rotation/idle/interrupted-migration testing on supported phones, tablets, and desktop browsers remain open.

## 4. Hosted headers, access, bundles, and logs

- Authenticated Vercel fetches of the new Preview `/` and `/api/config` showed CSP, HSTS, `nosniff`, frame denial, strict referrer policy, and noindex headers. API config uses `Cache-Control: no-store`. The initial Preview was stale; the current Preview is the review branch deployment.
- Current Preview `/api/config` returns HTTP 503 because `SUPABASE_PUBLISHABLE_KEY` is not configured. It correctly fails closed. The staging `SUPABASE_URL` is set for this branch only.
- Vercel reports SSO protection enabled across environments. An external unauthenticated browser check was not available here, so the actual access-denial response remains unverified.
- The new Preview had no runtime logs in the checked 50-minute window. A recursive scan of its JavaScript import graph fetched 53 modules (about 958 KB) and found no high-confidence AWS, Supabase service-role, JWT, or private-key patterns. It contains the current local-vault idle-lock code. This scan does not cover every possible secret format or Git history; the extracted source is not a Git checkout.

## 5. Dependency and secret review; incident process

- `npm audit --audit-level=high` returned zero known vulnerabilities. The offline audit also returned zero; a registry-backed audit was able to complete in this environment.
- `gitleaks` and `trufflehog` are not installed. The source-only pattern scan is not an equivalent secret scanner.
- `docs/INCIDENT_RESPONSE.md` now contains containment, credential/session revocation, recovery, review, notification, and closure steps. No live incident drill has been performed.
- The written security review and encryption design were updated with this status and known limits.

## 6. Hosted Vercel Preview against staging

- **Waiting on one Preview setting:** add `SUPABASE_PUBLISHABLE_KEY` for the staging project to the `security-review-preview` branch in Vercel Preview settings. Then redeploy and verify `/api/config` reports enabled before running hosted login, access-denial, two-device, conflict, export/restore, and failure checks.
- The owner previously reported that separate staging owner/non-owner authorization and attachment acceptance checks passed from local scripts. That does not substitute for the requested hosted Preview flow.

## 7. Device and accessibility checks

- Automated UI checks exercise native buttons, keyboard/touch activation paths, rendered views, and app states.
- Phone/tablet behavior, keyboard-only completion on real browsers, screen-reader output, contrast, zoom/reflow, and reduced-motion behavior have not been manually verified on supported devices.

## Verification result

- `node --check` passed for all `.mjs` files and `api/*.js` files in the bundle.
- `npm test` passed all 289 tests (0 failed). The 20 focused security tests also passed. All `.mjs` files and `api/*.js` files passed `node --check`. A Node-specific optional `unref()` was added to the idle timer after the first full-suite run showed that the browser timeout kept Node alive after tests; this does not change browser timer behavior.
