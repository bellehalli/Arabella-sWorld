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

## Failure checks

1. Simulate storage failure during a save. Confirm an error is visible, no successful save is claimed, and the editor retains the entered text.
2. Submit invalid dates, malformed CSV rows, an over-budget Studio milestone plan, and duplicate checklist entries. Confirm each shows a useful error and writes nothing.
3. Repeat the date/time tests around a daylight-saving gap and fold. Confirm nonexistent times are rejected and repeated times require an explicit choice.
