# Staging handoff · October 24, 2026

## Environment boundary

Use only the separate Supabase project **Arabella’s World Staging**. The existing Arabella’s World project is production and must not be used for these steps. The staging scripts reject the known production project ref and accept only an HTTPS Supabase URL plus a modern `sb_publishable_` key. Never use a secret or service-role key in Terminal.

## Completed staging check

The owner reports that `database/001_private_sync.sql` was applied, the invited owner row was inserted, and the owner/non-owner/anonymous smoke test passed from a Mac Terminal on October 24, 2026. The reported output was:

> PASS staging owner, non-owner, anonymous RLS and RPC checks; state was not modified.

This confirms the `dreamhub_owners`, `dreamhub_state`, and `dreamhub_save` authorization checks passed for the tested staging project. It does not test attachment storage or the attachment page.

## Attachment vault staging steps

1. In the **Arabella’s World Staging** Supabase SQL Editor, run `database/002_private_attachments.sql` after `001_private_sync.sql`. It creates the private `dreamhub-attachments` bucket, owner-scoped metadata table, and Storage RLS policies. Do not run it in production.
2. From the downloaded repository root on the Mac, run:

   ```bash
   npm run staging:attachments
   ```

3. Enter the staging Project URL and `sb_publishable_` key. When prompted, use the owner and non-owner email addresses and the newest email codes. The script uploads a harmless text probe, checks owner read/download and non-owner/anonymous denial, then removes the probe file and metadata row.
4. Expected final output:

   ```text
   PASS staging private attachment upload, metadata, owner download, non-owner/anonymous denial, and cleanup; probe file and metadata were removed.
   ```

5. After the script passes, use `npm run staging:preview` from the downloaded project root to run a loopback-only local preview. Enter the staging URL and publishable key when prompted. Sign in using the owner email and the fresh code, then manually confirm uploads, previews, downloads, and deletion. No Vercel environment or deployment is required for this local check.

The attachment acceptance script temporarily writes one test object and metadata row, then cleans both up. If interrupted before it prints PASS, check the private bucket for `DreamHub staging probe.txt` and remove any test object and matching row as the staging owner.

## Attachment limits and privacy

- Private bucket; no public URLs. Object keys use `<owner UUID>/<random file UUID>.<extension>`.
- RLS restricts metadata and file operations to an invited owner account whose UID matches the first storage path segment.
- Allowed file types: PDF, JPG/JPEG, PNG, WebP, UTF-8 TXT, and DOCX. Maximum 15 MB and 10 attachments per record.
- Upload code checks file signatures; Storage also applies MIME and size limits. SVG, HTML, and executables are rejected. Images/PDF/text can preview; DOCX downloads without rendering.
- Deletion removes the Storage object before deleting metadata. A failed cleanup keeps the row visible for retry.
- Cloud file bytes are not end-to-end encrypted. Supabase’s service can access stored files. Avoid uploading files that should remain device-only.
- File bytes are not included in workspace JSON backups. Backup manifests and complete attachment restore are not implemented.

## Current gates

| Gate | Status |
|---|---|
| Existing staging project and owner/non-owner accounts | Owner reports completed |
| `001_private_sync.sql` authorization/RPC smoke | Owner reports PASS; state unchanged |
| Apply `002_private_attachments.sql` to staging | Owner reports success |
| Attachment upload/download/denial/delete acceptance script | Owner reports PASS; probe and metadata removed |
| Browser page acceptance with staging configuration | Pending |
| Production migration or deployment | Not performed |

No production migration, production auth change, Vercel environment change, or deployment has been performed by this work.
