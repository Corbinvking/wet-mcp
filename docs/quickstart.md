# Quickstart

W.E.T. Research is a hosted, keyless Streamable HTTP server. Connect to:

```text
https://www.worldeventtrading.com/api/mcp
```

The anonymous seven-tool inventory needs no package, venue credential, wallet, or API key. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced/derived tools currently return typed `source_rights_pending`; `wet_resolve` remains usable for caller-supplied listing text.

## Verify the endpoint

A normal browser request returns a JSON service description:

```bash
curl -H "Accept: application/json" https://www.worldeventtrading.com/api/mcp
```

An MCP client should connect over HTTP and negotiate a supported MCP protocol version. Do not treat a browser description as an MCP session.

For the full release preflight, run `node scripts/verify-live.mjs`. It verifies the public status document, trusted and rejected CORS, OAuth challenge/discovery, owned trust/client/eval URLs and content types, service/feed health, then every anonymous tool. Default exit zero means the complete Gate 4 and sourced launch-readiness checks passed. The explicit `--candidate-allow-source-rights-pending` mode may accept the current typed hold for candidate protocol evidence, but it still reports health and rights blockers and must retain `launchReady: false` while they remain.

## First safe call

Call `wet_resolve` with listing text supplied by the user. This is the sole public tool not held because it reads no W.E.T. board, corpus, ledger, or venue source. Treat its result as structural parsing only, never proof of contract equivalence.

Example:

```text
Parse these caller-supplied listings into structural candidates. Explain every
field used, preserve any typed refusal, and do not claim that shared wording
proves the contracts have identical settlement terms.
```

Calls to `wet_benchmark_value`, `wet_search_events`, `wet_screen_markets`, `wet_event_markets`, `wet_cross_venue`, and `wet_event_headlines` currently return `source_rights_pending` with policy and exclusion metadata and no market or index value fields. That response is protocol-safe, but it is not a useful sourced result or evidence of current coverage, freshness, or reliability.

Phase 1 is coarse `coarse-all-rights-protected-sources` enforcement: mixed-source filtering is not implemented and partial approval cannot emit a partial answer. Disabled audited sources remain rights-protected because historical derived material may persist.

## Optional account authorization

Compatible clients can discover W.E.T. OAuth from the protected-resource metadata after an account-scoped tool returns `401`. Authorize only the scopes you need. Anonymous calls do not require sign-in, but authorization does not change the six-tool source-rights hold.

OAuth does not grant access to a venue or wallet. It can only authorize scanner and alert state inside the signed-in W.E.T. account; 14 source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending`, even if public rights later clear. Scanner execution also requires venue and headline-source rights. Alert pause and deletion, notification mark-read, scanner pause, and server-enforced two-step scanner deletion remain source-neutral controls, while scanner resume is held. An API key, OAuth grant, paid tier, adapter state, or environment setting cannot approve rights or bypass either hold; environment controls may only disable sources. See [`authentication.md`](authentication.md).

## Troubleshooting

- The keyless [service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health) describes operational state. Service or feed health does not prove source-rights clearance; health and rights are separate gates. The [status page](https://www.worldeventtrading.com/status) reports benchmark publication only.
- If a result is refused, read the refusal code and `wants` field. Do not retry unchanged.
- If a tool is missing, reconnect and inspect the authenticated tool list; public and account-specific lists are intentionally different.
- If a browser client fails preflight, use the W.E.T.-owned install guide for that client. Browser origins are allowlisted and raw API keys are not accepted cross-origin.
- Send a secret-free reproduction to [support](https://www.worldeventtrading.com/support).
