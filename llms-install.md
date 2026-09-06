# W.E.T. MCP post-clearance installation reference — release held

The future authorized service is designed to use the hosted Streamable HTTP endpoint.
Do not install, configure, connect to, or call this package now, and do not invent a local server
package.

```text
https://www.worldeventtrading.com/api/mcp
```

**Current status:** production returns HTTP `503`/`mcp_release_held` before discovery or calls, and
the full v0.7.0 candidate is not authorized or shipped. Owner authorization, legal review, and
source-rights clearance remain required before any setup or call. The examples below are retained
for a future post-clearance release only.

The candidate anonymous seven-tool inventory is keyless. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced/derived tools return typed `source_rights_pending`; `wet_resolve` is the candidate exception for caller-supplied listing text. Do not ask the user for a W.E.T. API key, venue credential, wallet, or payment method, and do not attempt to connect them while the release is held.

Only after every owner, legal, and source-rights gate clears and a final release is authorized: for
Cline, set `type` to the exact camelCase value `streamableHttp`; for VS Code use a top-level
`servers` object; for Gemini CLI use `httpUrl`; for Claude Code use `type: http`; and for Cursor a
remote `url` entry is sufficient. Until then, do not copy the matching example from
[`clients/`](clients/) into any client configuration. After clearance, merge it without deleting
other configured servers.

Only after a future authorized release, initiate browser OAuth if the user asks to access their W.E.T. scanners or alerts. Request the least scope needed and explain that authorization changes W.E.T. account state only. Fourteen source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending`; scanner execution also requires venue and headline-source rights. Alert pause and deletion, notification mark-read, scanner pause, and two-step scanner deletion remain source-neutral controls. Never paste a token into chat.

After a future authorized connection, verify that seven anonymous tools appear. Call `wet_resolve` only with caller-supplied listing text; its structural grouping does not prove contract equivalence. A held-tool `source_rights_pending` response is protocol-safe, not a useful sourced result or launch-readiness pass. While production is route-wide held, the correct result is `mcp_release_held`, not tool discovery.

An API key, OAuth grant, paid tier, readable or enabled adapter, or environment setting cannot approve rights or bypass the hold; environment controls may only disable sources. Phase 1 is coarse `coarse-all-rights-protected-sources` enforcement, so partial approval cannot produce a partial sourced answer.

Do not auto-approve deletion tools. Do not represent W.E.T. as an execution, wagering, order-routing, or advice service.
