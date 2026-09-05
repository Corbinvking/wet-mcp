# W.E.T. Scanners

A scanner is a saved research filter inside a user's W.E.T. account. It is not a recommendation, signal, trading bot, or venue automation.

Current MCP scanner actions can list public templates, list or get the signed-in user's scanners, preview a proposed definition, test a saved scanner without changing it, create or update it, pause or resume it, inspect available status/activity, and delete it. Alert actions can list, create, and delete W.E.T. alert state when the matching OAuth scope is granted.

The creation flow should be:

1. Translate the user's question into explicit structured criteria.
2. Call `wet_preview_scanner` and show the normalized filter and current matches.
3. Ask the user to authorize creation.
4. Call `wet_create_scanner` once.
5. Return the immutable scanner id and stored criteria from the mutation receipt.

For an existing scanner, call `wet_get_scanner` before changing it. Preview a replacement definition with `wet_preview_scanner`; `wet_update_scanner` validates and tests that definition again against the cached board before storing it. A real definition change clears the old definition's match memory, so the next scheduled evaluation arms without reporting every standing match as new. An identical retry is a no-op.

`wet_test_scanner` is the supported run-now action. It evaluates the saved definition against the current cached W.E.T. board but does not send a notification, update firing memory, stamp the scanner's last-evaluated fields, or create a history row. It is safe to use on a paused scanner.

`wet_scanner_status` returns the status the backend actually retains: pause state, last stored match count, last evaluation time, last fire time, and recent in-app notification receipts. W.E.T. does not retain one row for every quiet evaluation, so this is not a complete run history. Receipts are not linked to definition revisions and can predate the scanner's current definition. Receipt output is field-whitelisted and contains no delivery destination or notification credential.

Pause and resume preserve firing memory. Repeating either operation in its already-achieved state changes nothing. They do not alter prior notification receipts.

Deletion is destructive. Name the scanner id and obtain clear confirmation immediately before `wet_delete_scanner`.

Never put venue credentials, wallets, order actions, or notification secrets in scanner criteria. Never describe a matching event as a recommendation. A match means only that it satisfied the saved filter at the stated observation time.

Scheduling controls, timezone configuration, notification-destination management, outbound email delivery, and complete per-run history are not exposed by the current authenticated tool list and must not be invented by a client.
