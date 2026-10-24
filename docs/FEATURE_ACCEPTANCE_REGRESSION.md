# Product workflow acceptance regression

Run the automated checks with `npm test`. The UI suite also renders all routes with empty data, verifies native named controls, edits every record type, checks privacy preservation, and exercises the Studio, Finance, and Home workflows. The browser simulator does not reproduce an actual device or screen reader; complete the manual keyboard and touch steps on a phone or tablet before calling device acceptance done.

## Keyboard and touch sweep

1. Open every navigation destination with no records. Confirm the page gives a next step, there is no stuck loading/error overlay, and available actions have a spoken/visible name.
2. With a keyboard, tab through navigation, forms, dialogs, menus, and checklist controls. Activate native buttons with Enter and Space, use Escape for dismissible dialogs, and verify focus remains visible and returns to the initiating control after a dialog closes.
3. On a touch device, tap navigation links, form controls, checklist toggles, menu/dialog actions, save, edit, trash, restore, export, and approval buttons. Verify one tap produces one action and scrolling does not accidentally trigger a neighboring control.
4. Repeat in narrow portrait and landscape. Zoom the page and confirm forms and confirmation dialogs remain operable without horizontal scrolling.

## High-risk workflow regression

### Private writing and data recovery

1. Create a private journal entry, close it as a draft, reopen it, save, edit, and confirm the previous version is retained.
2. Search for a phrase from the body. Confirm private body text is absent from results; enable private-title search and confirm only the title can match.
3. Export JSON and encrypted backup. Confirm the JSON contains the expected record and sensitivity flag; confirm the encrypted artifact does not expose its plaintext and can be restored with the correct passphrase.
4. Import a backup with a new record, an identical record, and a conflicting record. Confirm conflicts are reviewed, current versions remain, and sensitive incoming titles are concealed.
5. Trash and restore a record. Confirm the record returns without losing its contents.

### Studio quote to collected payment

1. Add a client, draft a quote with at least two line items, and verify exact-cent totals and saved scope/assumptions.
2. Confirm the quote appears as an estimate, not an invoice or received income. Mark it accepted and approve starting delivery; verify the linked project copies the accepted amount.
3. Attempt a milestone plan above the accepted total and confirm it is rejected without partial writes. Save a valid plan and verify every milestone remains within the accepted scope.
4. Add a payment expectation. Confirm it is not counted as cash. Explicitly record receipt, then verify exactly one sensitive Studio income transaction is created and duplicate activation cannot create another.
5. Log a scope change, deliverable, outreach record, and launch checklist. Toggle a QA item and verify the completion state survives a reload.

### Finance

1. Enter a manual account snapshot and revise it. Confirm it updates the matching account instead of duplicating it.
2. Add confirmed and expected income, a bill, an envelope, and a sinking fund. Compare a forecast with expected income on and off; confirm these plans do not change account balances.
3. Preview a statement containing a duplicate already in the workspace and a duplicate within the file. Confirm both are unselected; import only reviewed rows and reimport the same file.
4. Mark a bill paid for a selected period. Confirm it creates one private expense record, does not send money, and cannot be duplicated for that period.
5. Add a sinking-fund contribution. Confirm it updates the fund ledger and does not claim a bank transfer.

### Home and moving administration

1. Add two apartment options with different monthly and move-in costs. Confirm the comparison uses only the entered figures.
2. Draft a moving timeline. Confirm the preview writes no tasks until approval; approve it and verify each task date is derived from the chosen move date.
3. Add inventory with a warranty date, a recurring maintenance item, and a document checklist. Mark a due review complete and verify recurring maintenance advances to the next valid date, including month-end clamping.
4. Toggle checklist items, edit the checklist, trash it, restore it, and include it in a full export.

### Day Director

1. Add a confirmed shift with start/end, commute, preparation, and recovery time; add a tentative shift, timed appointment, caregiving event, all-day event, due task, and dependency-blocked task.
2. Preview a day with a chosen awake window, energy, focus-minute cap, and rest protection. Confirm tentative shifts do not block time, confirmed commitments and travel do, due tasks rank ahead appropriately, blocked tasks are called out, and impossible work remains unscheduled.
3. Move a proposed block into a conflict and confirm approval is blocked with a clear explanation. Adjust it or uncheck it; approve the valid plan and verify only private linked calendar blocks and an audit record are added. Original shift/event times and task due dates must not change.
4. Approve a revised plan. Confirm earlier generated blocks move to Trash and can be restored. Simulate a failed save and confirm no plan is reported as saved.

### Career preparation and offer review

1. Save a resume/portfolio version, career contact, and source. Confirm private records remain private after editing and survive export/restore.
2. Save an interview prep note linked to an active application. Confirm it is private and the follow-up draft is not sent.
3. Add a due follow-up date to an application. Create the linked task twice and confirm only one task exists; verify its date and application backlink.
4. Compare salary and hourly examples with paid and unpaid weeks. Confirm gross totals use entered assumptions and benefit notes are not assigned a dollar value.

### Care, relationships, Grimoire, and Estate

1. In My Care Concierge, unlock the encrypted vault; create a product and optional routine, log a dated step, export an encrypted backup, and verify a failed save does not claim success. Keep care entries optional and non-diagnostic.
2. Add an occasion without reminder opt-in and confirm it is absent from the reminder list. Opt in and confirm it appears only in the in-app date range. Edit/trash/restore the occasion and a pet-care plan.
3. Add an experience wish, mark a visit complete, and verify the visited/wished counts. Add and edit a media item and verify its user-entered source and progress persist.
4. Save a custom spread, record a manual reversed card entry, save a personal correspondence, and search symbols. Confirm sensitive and deleted entries remain excluded from symbol previews.
5. Open every visible Estate room with keyboard and touch. Confirm arrow-key focus movement and the plain-dashboard link work; no route requires animation.

### Statement reconciliation

1. Import a CSV with an exact existing manual transaction, a new transaction, and two equally plausible matches. Confirm the exact match is only suggested, the new row is selectable, and ambiguous rows remain unchecked.
2. Approve the exact match and the new row. Confirm the saved transaction is marked reconciled, the new row is imported once with its fingerprint, and a repeat import does not duplicate either entry.
3. Confirm no account connection or payment permission is requested. A live bank feed requires a separately approved provider and security review.

## Failure checks

1. Simulate storage failure during a save. Confirm an error is visible, no successful save is claimed, and the editor retains the entered text.
2. Submit invalid dates, malformed CSV rows, an over-budget Studio milestone plan, and duplicate checklist entries. Confirm each shows a useful error and writes nothing.
3. Repeat the date/time tests around a daylight-saving gap and fold. Confirm nonexistent times are rejected and repeated times require an explicit choice.


### Automation, approvals, reminders, work income, and Studio prospects

1. Create an enabled rule for a supported record-created, record-updated, status-changed, date-arrived, or scheduled-review trigger. Confirm preview makes no record changes, duplicate polling does not duplicate proposals, pause-all stops new proposals, and generated actions remain pending in Approval Inbox.
2. Edit a proposal, snooze it, undo the snooze, dismiss it, and approve another. Confirm each decision is logged. Cause a failed approval and confirm retry count/backoff and the visible error are bounded.
3. Save quiet hours, lead time, and Calendar timezone. Opt in to browser notifications. Confirm a reminder is suppressed during quiet hours and delivered only while the app remains open; closed-app delivery is not claimed.
4. Add an overnight/timed shift with commute, prep, recovery, and unpaid break. Enter statement wages, cash/card tips, tip-out, withholding, and Expected status; confirm it appears as expected only. Record actual received net pay and confirm exactly one linked Personal income transaction is created.
5. Add a Studio prospect with a verified source URL and score. Confirm duplicate websites are blocked, low-score or contact-suppressed prospects cannot create follow-up tasks, and a qualified prospect produces one private linked task draft without sending anything.
6. Verify manual ICS preview/import remains review-first. Live OAuth calendar/task sync, provider conflict review, safe provider disconnect, and closed-app notifications require provider credentials and backend infrastructure and are not covered by local UI acceptance.


### Everyday administration and travel planning

1. Save meals for different dates, add a prep task, and verify that only the linked task enters Day Director. Add meal ingredients to the grocery list and confirm duplicate active items are not copied.
2. Add a grocery item with stock and a reorder threshold. Confirm low stock is called out, a shopping task is optional and idempotent, and marking the item bought removes it from the active list without deleting history.
3. Add confirmed caregiving coverage and a Healthcare event. Confirm coverage and appointments become fixed planner commitments. Add healthcare/dental prep, transport, and follow-up tasks and verify the task links, due dates, and deduplication.
4. Add a renewal or paperwork follow-up and verify the linked task enters Day Director. Attach travel time and a fallback plan to an appointment; preview the day and verify the travel buffer is fixed with the event.
5. Add Freyja supplies with quantities, reorder points, costs, and a date. Confirm the record is private, low-stock state is visible, and an optional restock task is linked and dated.
6. Add each named trip draft. Enter dates and category budgets; verify totals and the linked savings fund use only entered amounts. Update the fund amount and verify the savings gap changes. Add an astrocartography line/location supplied by the user, view prompts, and add one as an editable itinerary task. Confirm no live chart calculation, booking, or price claim is implied.
7. Edit, trash, restore, export, and reimport new meal, grocery, care, pet, admin, and trip records. Test invalid dates, negative money/stock values, repeated task creation, and failed persistence.
