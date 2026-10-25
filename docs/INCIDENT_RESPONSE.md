# DreamHub incident response

**Scope:** suspected account takeover, unintended data exposure, lost device, malicious import, leaked credential, public deployment exposure, or data corruption. This is an operational checklist for the owner; it does not replace provider incident processes or legal advice.

## First response

1. Record the time, affected account/device/deployment, observed behavior, and actions already taken. Preserve relevant provider request IDs and sanitized logs. Do not copy private record contents, OTPs, access tokens, passphrases, recovery codes, or service-role keys into tickets or chat.
2. If an account or session may be compromised, use Supabase Auth to revoke sessions or disable the affected account, then verify that the app returns to sign-in. Revoke any exposed service credentials in the provider dashboard. Never paste secrets into SQL, issue comments, or browser developer console history.
3. If a deployment is exposed, restrict its access in Vercel, identify the deployment and aliases, and stop routing users to it. Do not promote a replacement until its configuration and access gate are checked.
4. If a device is lost, lock or erase it through the device OS where possible. A locked local vault protects encrypted browser storage; an already-unlocked or compromised device may expose data.

## Containment and recovery

1. From a known-clean device, change the Supabase account password and email-provider password when either may be compromised; re-enroll MFA where available. In DreamHub, rotate the local-vault passphrase and recovery code if either may be exposed. A recovery code can unlock that device vault, so treat it as a credential.
2. Review Supabase Auth users and recent Auth/database/storage activity for unexpected accounts, sessions, queries, or objects. Review Vercel deployments, environment-variable changes, and access logs. Record findings without copying sensitive payloads.
3. For suspected data loss or corruption, stop writes to the affected test/staging workspace, preserve a copy of current data, inspect an encrypted backup, and restore only after previewing the target and conflicts. Never use an unverified backup to overwrite production.
4. Validate that revoked sessions fail, unauthorized reads/writes fail, and any exposed key has been rotated. Record which checks were performed and by whom.

## Notification and closure

- Notify affected users and provider support when investigation confirms exposure or service compromise. Follow applicable contractual and legal notification timelines with qualified counsel.
- Record the incident timeline, affected data categories, exposure window, containment, recovery, and follow-up fixes. Keep credentials and personal record content out of the report.
- Close only after access is contained, credentials are rotated, recovery is verified, and a follow-up owner/date is assigned for every unresolved action.

## Readiness gaps

This procedure has not been exercised as a live incident drill. Supabase session revocation, external Vercel access denial, hosted staging restore, provider log review, and notification workflow still require an owner-led exercise.
