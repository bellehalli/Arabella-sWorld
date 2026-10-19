# Arabella’s Dreamhub · 2.0 review build

A blush/lavender personal life workspace with heart controls, illustrated reading nook, subtle motion, Dream/Command/Gentle modes, mobile bottom navigation, and an optional CSS dream estate. This is a staging milestone based on Master Bible v5, not a claim that all vision features have shipped.

## Working in this build

- 32 navigable spaces, 32 typed record forms, common IDs, labels, favorites, links/backlinks, ten previous edit snapshots.
- Journals, diary, mixed moods/intensities/custom feelings, dreams, grimoire rituals and readings.
- Original 78-card tarot reference, random reflective three-card spreads, saved reading drafts.
- Today’s Three pinned tasks, Now/Next/Later/Done board, projects, calendar with agenda and ICS export.
- Persistent focus timer, completion history, distraction inbox, daily/weekly/ongoing trackers with retained logs.
- Exact-cent financial records, separate Personal/Studio labels, month-specific budget limits, savings, bills, debt what-if.
- Career and studio pipelines, gross compensation calculator, learning, home, beauty, wardrobe, people, pet care, travel, memories, wishes, reviews, seasons and decisions.
- Manually enabled/run application-follow-up recipe with preview, per-record deduplication and run history. No outward actions.
- Draft recovery, same-record conflict detection, save failure retention, trash/undo, JSON merge import, CSV/Markdown/ICS exports.
- Compressed optional photo cards in selected modules; all records remain browser-local until cloud is configured.

## Run and test

`npm ci --ignore-scripts`, then `npm test`.

Deploy to Vercel with framework Other, no build command, and project root as output. `/api/config` is a Node function. A generic static server alone needs to serve `/api/config` as `{ "enabled": false }` for device-only mode. No preview server was launched in the managed workspace.

The application itself is browser-native ES modules. The pinned Supabase client is bundled in vendor/supabase.mjs. `npm run build:sdk` rebuilds it from the pinned lockfile. Linkedom is only a test dependency, not a browser dependency. Google Fonts is optional with local system-font fallbacks.

## Storage and privacy

Device-only state: `arabella-dreamhub-v2` in localStorage. Drafts: `dreamhub-draft:local:<record or type>` or account-scoped draft keys in cloud mode. The old `belle-dreamhub-v1` key is never changed. Export format is versioned JSON `{format, exportedAt, state}`. Import validates first, previews counts and merges new IDs; conflicting IDs stop the entire import. Legacy v1 migration preserves raw source fields and ledger provenance. It does not invent missing dates or habit history. Local multi-tab writes use Web Locks when supported; fallback is best effort and should not be treated as a distributed database lock.

Trash is retained until manually purged. Deleted or old snapshots may also exist in exported backups. Writing history is bounded to ten prior versions. Photos consume localStorage capacity; a failed storage write leaves the editor and draft available, never claims a committed save.

A concealed search preview is not a device lock or encryption. Data is not end-to-end encrypted. No bank feed, analytics provider, AI API, outbound messages, purchases or financial transactions are connected.

## Managed auth / cloud activation (coded, NOT provisioned or live-tested)

1. Review current provider free-tier limits, data terms, storage requirements, quotas and email delivery before provisioning. No paid tier is required by the code; perpetual $0 operation is not promised.
2. Provision a dedicated staging Supabase project. Disable public signups. Configure email OTP template to provide Token, not only a magic link; verify delivery for the owner. Invite the one intended owner through the managed Auth UI. Do not invent auth or cryptography.
3. Apply database/001_private_sync.sql in staging. As an administrator, insert the verified invited auth.users.id into dreamhub_owners. Never ship an owner UUID based on an email guess.
4. Set Vercel Preview environment SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (modern `sb_publishable_…` key only). NEVER put service-role/secret keys in the client or public config endpoint. No server service-role key is needed.
5. Redeploy Preview. Test owner email-code login, anonymous denial, other-account denial, save on two devices, conflict retention, sign-out, export, backup restore, and quota/network failure. Snapshot writes use an atomic, owner-scoped RPC with expected revision. This is a foundation snapshot store, not the final normalized v5 per-record database schema.
6. Import any local review data manually after exporting it. There is no automatic upload of browser-local content. Cloud saves do not keep an offline replica; local drafts remain explicit. Failure to check cloud configuration blocks access rather than silently falling back to local mode.
7. Enable production only after reviewing this exact staged candidate and passing the real authorization and restore tests.

## Still outside this milestone

Live cloud provisioning/owner setup and real cross-device tests; GitHub remote creation/linking; live browser visual/accessibility testing; fully normalized cloud schema; full offline service worker; attachments vault; advanced recurrence; drag/resize dashboards; rich-text editor; full custom workflow builder; notification infrastructure; CSV/ICS imports; bank integrations; sophisticated wardrobe/room canvases; full v5 automation engine.

No database, hosting plan, external account, billing setting, or production deployment is changed automatically by this source.
