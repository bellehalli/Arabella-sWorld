# Master Bible alignment check — October 23, 2026

Scope: read-only comparison of the repository's default `main` source and project notes against **DreamHub Master Bible v5**, followed by one local, reversible code change on `codex/bible-alignment-2026-10-23`. No provider, hosting, production, billing, or user-data settings were changed.

## Current alignment

| Bible area | Current state | Evidence / next gate |
|---|---|---|
| Manual-first product and visual direction | Broadly implemented | 32 routes and 32 typed record forms, three modes, theme options, reduced-motion support, and no paid AI or bank connection in this milestone. |
| Core life modules | Broadly represented, with varying depth | Journaling, mixed moods, grimoire, tasks, money, career, studio, home, wellness/beauty, wardrobe, relationships, pets, travel, and memories exist in the review build. Several advanced systems remain outside the milestone. |
| Data portability | Partial; improved in this branch | Existing readable JSON/CSV/Markdown/ICS exports and merge import remain. This branch adds encrypted full-state backup and explicit replacement restore with schema validation and persistence-failure safety tests. |
| Privacy and security | Release blocker | Main workspace data and drafts remain plaintext in browser storage. Only the separate care vault is encrypted at rest. A concealed search preview is not access control. |
| Identity, authorization, cross-device sync | Not verified | Supabase adapter and owner-scoped SQL migration exist, but there is no configured staging project, applied migration, real owner/second-account RLS test, or verified two-device sync. |
| Offline reliability and reminders | Partial | Draft persistence and local reminders while the app is open exist. There is no tested offline sync queue or guaranteed closed-browser delivery. |
| Accessibility and device acceptance | Source support exists; acceptance is pending | Skip link, visible focus styling, reduced-motion support, and touch-oriented layout exist. Live keyboard, screen-reader, mobile, contrast, and visual acceptance checks remain outstanding. |
| Automated validation | Passing in local worktree | Baseline on `main`: 103/103. After encrypted backup/restore changes: 106/106. `npm audit --omit=dev` found 0 known production dependency vulnerabilities. Tests are unit and simulated-DOM tests, not real browser, database, or deployment acceptance. |

## Change made in this branch

- Added encrypted full-app backup export using the existing Web Crypto AES-GCM/PBKDF2 helper.
- Added encrypted backup import that validates the full DreamHub schema before prompting to replace current data.
- Kept readable JSON export and safe, conflict-stopping merge import available.
- Added tests for plaintext exclusion, exact state round-trip, wrong passphrases, tampering, foreign vault files, invalid backups, and failed persistence.

## Gates still requiring an isolated environment or further security review

1. Design and review main-record encryption and key recovery before migration; do not treat encrypted backups as encryption of localStorage.
2. Provision approved staging infrastructure only after cost and data-term review; apply the migration there and test anonymous, owner, and second-account access to every table and RPC.
3. Verify sign-in, session expiry/revocation, deployment access protection, and fail-closed behavior from logged-out browsers.
4. Run real cross-device save/conflict, export/restore, quota/network failure, offline, and migration tests with synthetic data.
5. Complete mobile, keyboard, screen-reader, contrast, reduced-motion, XSS/import, dependency, and backup-recovery acceptance.
6. Update this status only after each gate has evidence; production remains outside this work branch.
