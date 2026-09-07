# Reviewer guide

This package connects to a hosted proprietary implementation. Review can be completed without a venue account, wallet, payment method, or W.E.T. account.

**Current production status:** emergency containment is active. The canonical endpoint returns HTTP
`503`/`mcp_release_held` before discovery or calls. Do not perform the release review below against
production, publish a directory result, or treat containment as a v0.5.0 conformance pass. The steps
below resume only after the owner and source-rights gates authorize an exact candidate deployment.

## Public review

1. After release authorization and containment clearance, connect `https://www.worldeventtrading.com/api/mcp` as Streamable HTTP.
2. Confirm the server identifies as version `0.7.0` and lists seven anonymous tools.
3. From the repository root, run `node scripts/verify-live.mjs > wet-live-proof.ndjson`. It must preflight `GET /api/mcp`, trusted and rejected CORS, the protected OAuth challenge and three discovery documents, every owned trust/client/eval URL and content type, service/feed health, and the 30 KiB anonymous `tools/list` ceiling before completing the seven public tool calls. Default launch readiness must fail if Gate 4 fails, health is not current and rights-aligned, or any required sourced tool returns `source_rights_pending` or otherwise lacks a useful sourced result.
4. If reviewing release-candidate protocol safety before rights clearance, run `node scripts/verify-live.mjs --candidate-allow-source-rights-pending > wet-candidate-proof.ndjson`. Confirm `preflightConformant: true` and `protocolConformant: true` are reported separately from `gate4LaunchReady`, `healthLaunchReady`, and `launchReady: false`; do not publish it as live-data, health, rights, or production evidence.
5. Run one positive research chain only after source rights are cleared and the relevant tool returns a useful sourced result. Use the [`../assets/demo/positive-55s-storyboard.md`](../assets/demo/positive-55s-storyboard.md) truth guards if recording it.
6. Run one refusal case and confirm no prohibited value is filled in. The [`../assets/demo/negative-refusal-storyboard.md`](../assets/demo/negative-refusal-storyboard.md) supplies the false-comparison review flow.
7. Inspect [service and feed health](https://www.worldeventtrading.com/api/wet/v1/health), [benchmark publication status](https://www.worldeventtrading.com/status), [coverage](https://www.worldeventtrading.com/coverage), [security](https://www.worldeventtrading.com/security), [privacy](https://www.worldeventtrading.com/privacy), and [terms](https://www.worldeventtrading.com/terms).

The proof script sends no authentication or cookies. Its sole account-tool request is an intentionally unauthenticated challenge probe that must be rejected before dispatch; it performs no account mutation. Summaries omit response bodies, market values, and protected source names while hashing complete observed JSON results, so a reviewer can retain timing and integrity without turning volatile or identifying data into repository fixtures. A typed refusal can be protocol-safe but is not a useful sourced result. A malformed trust/OAuth/health contract, JSON-RPC error, `isError`, missing structured result, unsafe annotation, version mismatch, or missing tool fails both modes.

The candidate six-tool hold is default-deny policy `mcp-source-rights/2026-09-05.phase1`, refusal code `source_rights_pending`, with `wet_resolve` as the sole candidate caller-supplied-text exception. Credentials cannot bypass it. Production's current route-wide `mcp_release_held` supersedes that behavior. Local fixtures, structural/runtime checks, and candidate protocol proof do not establish rights clearance, venue coverage, freshness, reliability, or a post-deploy clean-client pass.

## Account review

Only after release authorization and containment clearance, use a W.E.T. test account and the client's normal OAuth flow. Request only `wet.scanners.read` first and confirm write tools are absent. Authorized inventory is not proof of executability: 14 source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending`, even if the six-tool public source hold later clears. Scanner evaluation and delivery also require the combined venue and headline-source rights chains. A credential cannot bypass either hold.

### Current candidate safety review

For a candidate-phase safety review, verify the typed hold on one authorized sourced account tool, then exercise only a scanner pause or the server-enforced two-step scanner deletion flow against an owner-approved disposable record. Those stop controls remain available because they do not reactivate or return sourced evaluation data. Do not create a fixture solely to test them while creation is held.

### Post-clearance full lifecycle review

After public venue and headline-source rights clear, the separate account-output contract is approved and pinned, and migration `0033_scanner_lifecycle` is present, run the full lifecycle against one disposable test-account fixture: preview, create with an idempotency key, read, non-persisting test, persisted run-now, revision-guarded update, status/history inspection, pause, resume, and two-step delete. Treat that sequence as post-clearance evidence, not current candidate capability.

Expected boundaries:

- In an enabled candidate environment, public inventory remains callable after account authorization; six sourced public tools remain held by `source_rights_pending`, while 14 source-derived account tools remain independently held by `account_output_contract_pending` for v0.7.0. Production currently exposes neither inventory.
- A protected call without authorization returns `401` with protected-resource metadata.
- An insufficient scope returns `403` without executing the tool.
- No tool or scope can access a venue account, wallet, or order flow.
- Account mutations affect only the authorized W.E.T. account.
- Testing a saved scanner creates no notification and changes no stored evaluation state.
- A persisted run records bounded revision, match, outcome, and delivery evidence; scanner status returns that bounded run history rather than inferring it from notification receipts.
- Pause and two-step scanner deletion remain rights-safe; resume is held because it reactivates sourced evaluation.

## Support

Send the UTC time, client/version, tool name, request id, and secret-free reproduction to [W.E.T. support](https://www.worldeventtrading.com/support). Security findings belong in the private process described in [`../SECURITY.md`](../SECURITY.md).
