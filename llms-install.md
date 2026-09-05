# Install W.E.T. MCP

Use the hosted Streamable HTTP endpoint. Do not install or invent a local server package.

```text
https://www.worldeventtrading.com/api/mcp
```

The anonymous seven-tool inventory is keyless. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, the six W.E.T.-sourced/derived tools return typed `source_rights_pending`; `wet_resolve` remains usable for caller-supplied listing text. Do not ask the user for a W.E.T. API key, venue credential, wallet, or payment method to connect them.

For Cline, set `type` to the exact camelCase value `streamableHttp`. For VS Code use a top-level `servers` object. For Gemini CLI use `httpUrl`. For Claude Code use `type: http`. For Cursor a remote `url` entry is sufficient. Copy the matching example from [`clients/`](clients/) and merge it without deleting other configured servers.

Only initiate browser OAuth if the user asks to access their W.E.T. scanners or alerts. Request the least scope needed and explain that authorization changes W.E.T. account state only. Fourteen source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending`; scanner execution also requires venue and headline-source rights. Scanner pause, alert deletion, and two-step scanner deletion remain source-neutral stop controls. Never paste a token into chat.

After connection, verify that seven anonymous tools appear. Call `wet_resolve` only with caller-supplied listing text; its structural grouping does not prove contract equivalence. A held-tool `source_rights_pending` response is protocol-safe, not a useful sourced result or launch-readiness pass.

An API key, OAuth grant, paid tier, readable or enabled adapter, or environment setting cannot approve rights or bypass the hold; environment controls may only disable sources. Phase 1 is coarse `coarse-all-rights-protected-sources` enforcement, so partial approval cannot produce a partial sourced answer.

Do not auto-approve deletion tools. Do not represent W.E.T. as an execution, wagering, order-routing, or advice service.
