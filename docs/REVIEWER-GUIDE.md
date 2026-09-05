# Reviewer guide

This package connects to a hosted proprietary implementation. Review can be completed without a venue account, wallet, payment method, or W.E.T. account.

## Public review

1. Connect `https://www.worldeventtrading.com/api/mcp` as Streamable HTTP.
2. Confirm the server identifies as version `0.5.0` and lists seven anonymous tools.
3. From the repository root, run `node scripts/verify-live.mjs > wet-live-proof.ndjson`. Confirm the final NDJSON row reports seven attempted and successful tools, no failures, and the deployed package version.
4. Run one positive research chain from [`../evals/cases.json`](../evals/cases.json), using the [`../assets/demo/positive-55s-storyboard.md`](../assets/demo/positive-55s-storyboard.md) truth guards if recording it.
5. Run one refusal case and confirm no prohibited value is filled in. The [`../assets/demo/negative-refusal-storyboard.md`](../assets/demo/negative-refusal-storyboard.md) supplies the false-comparison review flow.
6. Inspect [status](https://www.worldeventtrading.com/status), [coverage](https://www.worldeventtrading.com/coverage), [security](https://www.worldeventtrading.com/security), [privacy](https://www.worldeventtrading.com/privacy), and [terms](https://www.worldeventtrading.com/terms).

The proof script sends no authentication or cookies and never calls an account tool. Its summaries omit market values while hashing the complete observed result, so a reviewer can retain timing and result integrity without turning volatile prices into repository fixtures. A typed refusal is a valid tool result; a JSON-RPC error, `isError`, missing structured result, unsafe annotation, version mismatch, or missing tool fails the run.

## Account review

Use a W.E.T. test account and the client's normal OAuth flow. Request only `wet.scanners.read` first; confirm write tools are absent. Add `wet.scanners.write`, preview a scanner before creating it, and mutate only the created fixture. Read it with `wet_get_scanner`, test it with `wet_test_scanner`, pause and resume it, make one previewed update, inspect `wet_scanner_status`, then delete it.

Expected boundaries:

- Public research remains usable after account authorization is cleared.
- A protected call without authorization returns `401` with protected-resource metadata.
- An insufficient scope returns `403` without executing the tool.
- No tool or scope can access a venue account, wallet, or order flow.
- Account mutations affect only the authorized W.E.T. account.
- Testing a saved scanner creates no notification and changes no stored evaluation state.
- Scanner status identifies notification receipts as partial activity, never a complete per-run log.

## Support

Send the UTC time, client/version, tool name, request id, and secret-free reproduction to [W.E.T. support](https://www.worldeventtrading.com/support). Security findings belong in the private process described in [`../SECURITY.md`](../SECURITY.md).
