# Main workspace encryption and recovery design

**Status: implemented in the source; not production-approved.** `local-vault.mjs` encrypts the device-only workspace snapshot and local record drafts. Startup requires unlock, migration stages and verifies encrypted copies before replacing plaintext, and settings offers manual lock, 15-minute idle lock, passphrase rotation, and recovery-code rotation. Automated tests cover recovery, credential rotation, migration interruption, and metadata-write rollback. Independent cryptographic review and supported-device validation remain required.

## Security goal

Protect the main DreamHub snapshot and unsaved record drafts from someone who can inspect browser storage or a copied browser profile while the vault is locked. This does not protect data while the app is unlocked, defend against a compromised browser or device, encrypt user-requested readable exports, or replace cloud authorization.

## Key model

- Generate a random 256-bit data-encryption key (DEK) for each local vault.
- Encrypt the DEK twice: once with a passphrase-derived wrapping key, and once with a separately generated high-entropy recovery code. Store only the wrapped DEK values and KDF metadata.
- Derive the passphrase wrapping key with a vetted, versioned KDF. Select parameters after benchmarking supported iPhones, tablets, and desktops. Do not reuse the care-vault format by assumption and do not write custom cryptography.
- Derive the recovery wrapper from the recovery code using a reviewed, versioned key-derivation step. Display the recovery code once during setup and require the user to confirm they saved it outside the device.
- Keep the DEK only in memory while unlocked. Never persist the passphrase or unwrapped key in localStorage, IndexedDB, URLs, logs, analytics, or backups.

## Encrypted storage format

Use versioned AES-GCM envelopes with a fresh random 96-bit nonce per write. Authenticate the format version, storage key, and record identifier as additional authenticated data. Reject unknown versions, invalid nonce/tag lengths, malformed envelopes, and over-limit data without replacing existing bytes.

Encrypt the complete main workspace snapshot and every local unsaved record draft. Keep only non-sensitive UI preferences such as recent route IDs outside the vault. Do not leave plaintext draft keys behind after migration. The existing separate care vault remains a separate key domain.

## Unlock, lock, and recovery

- On startup, render a locked screen before loading any local workspace data. Unlock with either the passphrase or recovery code.
- Provide explicit and inactivity lock controls. The implementation locks after 15 minutes without pointer, keyboard, touch, click, or input activity; it flushes the local store and reloads to clear the UI and JavaScript references. Supported-browser idle behavior still needs device testing.
- The implementation supports recovery-code unlock plus passphrase and recovery-code rotation. Rotation stages new metadata, verifies the wrapped data key, then commits with rollback on failed persistence. Never transmit either secret to a service. These mechanics still require independent cryptographic review and device testing.
- Missing or invalid key material must fail closed. Do not silently fall back to plaintext local mode.

## Migration and failure safety

1. Preserve current plaintext state and drafts until the user explicitly starts migration.
2. Require the user to create and confirm a passphrase and save the recovery code. Recommend a separate readable export before migration.
3. Encrypt every existing state and draft entry, write the new envelopes, read them back, and decrypt/validate the complete set.
4. Only after successful verification, ask the user to authorize deleting the old plaintext keys. If any write, read-back, or validation fails, keep the original keys and report that migration did not finish.
5. Make migration resumable and idempotent. Never infer that a partially encrypted set is complete.

## Required acceptance before rollout

- Implemented tests: correct passphrase and recovery code unlock the same state; wrong passphrases and tampered ciphertext fail without replacing stored bytes.
- Snapshot, drafts, attachments, and migration backups have no plaintext storage copies after the user completes migration.
- Implemented test: staging quota failure preserves source data and does not commit vault metadata. Browser shutdown, general storage denial, and interrupted-device migration still need supported-browser tests.
- Lock removes visible plaintext and blocks editor, export, search, and automation actions until re-unlock.
- Test key rotation, recovery-code rotation, schema upgrades, backup restore, idle lock, and browser storage loss on supported devices. Current automated coverage uses deterministic test storage and does not replace device testing.
- Perform an independent cryptographic review before using real private records.

## Scope boundary

This proposal covers device-only storage. Cloud mode still requires live staging proof for RLS, owner isolation, session expiry/revocation, and restore. If client-side encryption is later required for cloud payloads, design its multi-device key recovery and SQL envelope separately; do not treat provider-managed database encryption as end-to-end encryption.
