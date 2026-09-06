# Quickstart

The W.E.T. Research candidate is designed as a hosted, keyless Streamable HTTP server. Its held
endpoint, reserved for possible post-clearance use, is:

```text
https://www.worldeventtrading.com/api/mcp
```

**Current status:** production is deliberately unavailable and returns HTTP
`503`/`mcp_release_held` before discovery or calls. Do not install, configure, connect to, or call
the endpoint. Owner authorization, legal review, and source-rights clearance remain required before
a final release action. This quickstart is retained for a future authorized release of the held
v0.7.0 candidate.

The candidate anonymous seven-tool inventory needs no package, venue credential, wallet, or API key. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced/derived tools return typed `source_rights_pending`; `wet_resolve` is the candidate exception for caller-supplied listing text.

## Verify the endpoint

Only after the owner, legal, and source-rights gates clear and a final release is authorized, a
normal browser request should return a JSON service description:

```bash
curl -H "Accept: application/json" https://www.worldeventtrading.com/api/mcp
```

After that future authorization, an MCP client should connect over HTTP and negotiate a supported
MCP protocol version. Do not treat a browser description as an MCP session.

After those gates clear against an authorized preview or deployment, run `node scripts/verify-live.mjs`
for the full release preflight. It verifies the public status document, trusted and rejected CORS,
OAuth challenge/discovery, owned trust/client/eval URLs and content types, service/feed health, then
every anonymous tool. Default exit zero means the complete Gate 4 and sourced launch-readiness checks
passed. The explicit `--candidate-allow-source-rights-pending` mode may accept a typed hold for
candidate protocol evidence, but it still reports health and rights blockers and must retain
`launchReady: false` while they remain; it does not authorize production setup or calls.

## Post-clearance first safe call

After a future authorized release, call `wet_resolve` with listing text supplied by the user. This is the candidate's sole public tool-level exception because it reads no W.E.T. board, corpus, ledger, or venue source. Treat its result as structural parsing only, never proof of contract equivalence.

Example:

```text
Parse these caller-supplied listings into structural candidates. Explain every
field used, preserve any typed refusal, and do not claim that shared wording
proves the contracts have identical settlement terms.
```

In the candidate, calls to `wet_benchmark_value`, `wet_search_events`, `wet_screen_markets`, `wet_event_markets`, `wet_cross_venue`, and `wet_event_headlines` return `source_rights_pending` with policy and exclusion metadata and no market or index value fields. That response is protocol-safe, but it is not a useful sourced result or evidence of current coverage, freshness, or reliability. Production currently returns the route-wide `mcp_release_held` response instead.

Phase 1 is coarse `coarse-all-rights-protected-sources` enforcement: mixed-source filtering is not implemented and partial approval cannot emit a partial answer. Disabled audited sources remain rights-protected because historical derived material may persist.

## Optional account authorization

Only after a future authorized release, compatible clients can discover W.E.T. OAuth from the
protected-resource metadata after an account-scoped tool returns `401`. Authorize only the scopes
you need. The proposed anonymous calls do not require sign-in, but authorization does not change the
six-tool source-rights hold.

OAuth does not grant access to a venue or wallet. It can only authorize scanner and alert state inside the signed-in W.E.T. account; 14 source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending`, even if public rights later clear. Scanner execution also requires venue and headline-source rights. Alert pause and deletion, notification mark-read, scanner pause, and server-enforced two-step scanner deletion remain source-neutral controls, while scanner resume is held. An API key, OAuth grant, paid tier, adapter state, or environment setting cannot approve rights or bypass either hold; environment controls may only disable sources. See [`authentication.md`](authentication.md).

## Troubleshooting

- The keyless [service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health) describes operational state. Service or feed health does not prove source-rights clearance; health and rights are separate gates. The [status page](https://www.worldeventtrading.com/status) reports benchmark publication only.
- If a result is refused, read the refusal code and `wants` field. Do not retry unchanged.
- While production returns `mcp_release_held`, do not reconnect, configure a client, or retry with credentials. After a future authorized release, if a tool is missing, reconnect and inspect the authenticated tool list; public and account-specific lists are intentionally different.
- Only after a future authorized release, if a browser client fails preflight, use the W.E.T.-owned client guide. Browser origins are allowlisted and raw API keys are not accepted cross-origin.
- Send a secret-free reproduction to [support](https://www.worldeventtrading.com/support).
