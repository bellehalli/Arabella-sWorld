# Audit 1 — Universal Records, Data & Recovery
Date: 2026-10-22. Scope: development branch only. Sources: Master Bible v5 pp. 61–65; inspected core.mjs, cloud.mjs, offline-drafts.mjs, record-backup.mjs, record-restore.mjs, record-search.mjs and existing test inventory.
**Verdict: NOT BIBLE-COMPLIANT / NOT RELEASE-READY.** Code inspection, not browser, security or two-device certification. Proposed staging setup remains deferred.

## Bible requirement evidence
| Bible reference | Requirement | Evidence | Result | Priority |
|---|---|---|---|---|
| p61, invariants | Stable owner-scoped records and links | Typed IDs/version in core; owner-based cloud snapshot; link references are strings, inspectLinks only reports broken links | PARTIAL | High |
| p61, invariants | Sensitive content never leaks in search/snippets/cache | record-search excludes sensitive body/data, but still indexes title/tags; device draft storage is plaintext | PARTIAL | Critical privacy review |
| p61, time/money | Timezone-consistent timestamps; integer money | ISO createdAt/updatedAt, timezone preference, moneyToMinor integer helper; event recurrence/DST unproven | PARTIAL | High |
| p63, migration | Inventory every device; preserve original data; dry-run migration and restore | Legacy migration + verified JSON archive; no actual device inventory or nonproduction restore drill | BLOCKED | Critical |
| p63–64, security | RLS/identity, private media, safe uploads, sanitization | Supabase owner gate and proposed private-bucket SQL; not applied/tested in isolated environment | BLOCKED | Critical |
| p64 F-001/F-002 | Anonymous/other-user access denied | No real adversarial account/API test | BLOCKED | Critical |
| p64 F-003 | Journal across devices, versions consistent | Optimistic cloud RPC and conflict error; no live two-device test | BLOCKED | High |
| p64 F-004 | Mixed moods retained | Existing core tests | PARTIAL (automated only) | Medium |
| p64 F-005 | Offline draft/reconnect without silent loss | offline-drafts queue implemented but not wired into app; no reconnect UI/state | MISSING | Critical |
| p64 F-009 | Exact money | moneyToMinor and test for cents; comprehensive finance cases pending | PARTIAL | High |
| p64 F-010 | Export and restore preserves counts/links | checksum/inventory and backup tests; no complete restore drill; no media manifest | PARTIAL | Critical |
| p64 F-011 | Delete and recovery | soft delete and restore regression tests; expiry/undo behavior not established | PARTIAL | Medium |
| p64 F-012–014 | Mobile, keyboard, screen reader, reduced motion | UI route tests only; no actual device/accessibility test | BLOCKED | High |
| p64 F-015 | Quota failure, no data loss or charge | local storage write rollback test; media quota monitoring/guards not demonstrated | PARTIAL | High |
| p64 F-017 | Unsafe rich text/attachments | Basic UI escape and MIME/size policy; no hostile file/browser penetration tests | PARTIAL | Critical |
| p64 F-018 | Sensitive search | automated metadata-only filtering; actual UI and permission tests incomplete | PARTIAL | High |
| p65 E03/E05 | Import/export and universal records exit gates | Shared record store, typed search, archive functions; acceptance gate not met | PARTIAL | High |

## Beyond-the-Bible capability assessment
- **Depth — PARTIAL:** generic typed record CRUD exists; richer schema-specific editors, bulk operations, saved views, and linked-record repair need design and implementation.
- **Intelligence — PROPOSED:** duplicate detection, broken-link repair suggestions, contextual relationship discovery, actionable but explainable recovery guidance.
- **Interoperability — PARTIAL:** links are strings; no fully verified referential enforcement, permission-safe relationship graph or atomic cross-app updates.
- **Resilience — FAIL / BLOCKED:** offline queue not integrated; cloud saves require connectivity; conflict resolution stops on conflict rather than offering guided merge; full restore unproven.
- **Privacy/control — BLOCKED:** real RLS and storage authorization untested; sensitive plaintext local drafts and exported archives need threat-model decision.
- **Accessibility/performance — BLOCKED:** no real mobile/screen reader tests or large-data performance benchmarks.
- **Cost/ownership — PARTIAL:** JSON portability and no new paid dependency; quota meter/limits and cost monitoring unproven.

## Prioritized repair order
1. P0: Preserve existing data; implement visible offline draft pending/sync/reconciliation without silent overwrites, with sensitive-data storage risk decision.
2. P0: Build actual nonproduction restore drill for verified backups; media manifests; conflict preview and non-destructive restore.
3. P0: Validate cross-account RLS/private attachments in isolated staging WHEN owner resumes that deferred activity; cannot certify beforehand.
4. P1: Enforce/repair record-link integrity, safe merges, idempotent imports, history and audit trail.
5. P1: Wire advanced search filters, saved views, bulk actions, safe sensitive metadata and universal editors to UI.
6. P1: Real phone/desktop accessibility, quota, failure, concurrent editing, offline/reconnect and performance scenarios.
7. P2: Optional capability upgrades after Bible gates: graph explorer, guided repair center, provenance, reusable saved smart collections.

## Gate
Do not mark Audit 1 PASS until applicable Bible v5 criteria are supported by source, tests, and browser/security evidence. No production deployment or migration authorized.
