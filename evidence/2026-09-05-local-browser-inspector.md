# Local browser and MCP Inspector candidate evidence

- **Observed:** 2026-09-05T10:18:45Z
- **Candidate base commit:** `b09697d72d7b68b4b892b862d80af3c7a42c2838` plus the then-uncommitted launch candidate
- **Endpoint tested:** `http://127.0.0.1:3017/api/mcp`
- **Browser:** fresh isolated `agent-browser` session, no W.E.T. credential
- **Inspector:** `@modelcontextprotocol/inspector@2.5.0`, CLI mode, Streamable HTTP

This is local release-candidate evidence only. It does not establish production deployment, source
rights, live source coverage, seven-day reliability, a successful directory install, or launch
readiness.

## Rendered owned pages

The following pages rendered from the candidate with their expected titles and landmark structure:

- `/mcp` — “W.E.T. MCP — indexes and prediction-market research”; seven public tools, client-guide
  navigation, index-led framing, rights hold, and trust links were visible.
- `/mcp/goose` — “Install the W.E.T. MCP server in Goose”; install, public inventory, optional account
  boundary, safe-first-check, and related records were visible.
- `/mcp/mcp-inspector` — “Install the W.E.T. MCP server in MCP Inspector CLI”; install and proof
  instructions were visible.
- `/mcp/scanner-template` — a missing template produced the explicit “Template unavailable” state.
- `/mcp/scanner-template?template=…` — the canonical available September 2026 Fed template decoded
  into “Template preview”, “Post-clearance preview before creating”, and future create arguments. The
  page did not create or mutate a scanner on open, and the browser reported no page error.

Captures:

- [`2026-09-05-local-mcp-page.png`](2026-09-05-local-mcp-page.png)
- [`2026-09-05-local-goose-page.png`](2026-09-05-local-goose-page.png)
- [`2026-09-05-local-inspector-page.png`](2026-09-05-local-inspector-page.png)
- [`2026-09-05-local-scanner-template-page.png`](2026-09-05-local-scanner-template-page.png)
- [`2026-09-05-local-scanner-template-valid.png`](2026-09-05-local-scanner-template-valid.png)

## Strict Inspector discovery

Command shape:

```powershell
npx --yes @modelcontextprotocol/inspector@2.5.0 --cli http://127.0.0.1:3017/api/mcp --transport http --method tools/list --strict --format json
```

Result: exit `0`; exactly seven anonymous tools; zero schema errors and zero schema warnings. The
first strict pass found two nullable-type portability warnings in the caller-supplied resolver. The
candidate replaced the legal-but-less-portable type arrays with `anyOf` string/null branches, and the
recorded final pass was clean.

## Inspector tool calls

Every anonymous tool was called through the Inspector CLI. The final results were:

| Tool | Exit | Observed contract |
|---|---:|---|
| `wet_benchmark_value` | 0 | typed `source_rights_pending`, no value-bearing field |
| `wet_search_events` | 0 | typed `source_rights_pending`, combined venue/headline chain |
| `wet_screen_markets` | 0 | typed `source_rights_pending`, no value-bearing field |
| `wet_event_markets` | 0 | typed `source_rights_pending`, no value-bearing field |
| `wet_cross_venue` | 0 | typed `source_rights_pending`, no inferred comparison |
| `wet_event_headlines` | 0 | typed `source_rights_pending`, combined venue/headline chain |
| `wet_resolve` | 0 | useful result from explicitly caller-supplied synthetic listing text; `provenance=caller-supplied`; no W.E.T. source read |

An initial concurrent burst also produced the expected bounded HTTP `429` request-budget response
for three calls. Retrying them serially after the response's reset interval succeeded. No credential
or rate-limit bypass was used.

## Local clean-client verifier boundary

`verify-live.mjs` run `8d172e38-82ab-4d0d-9336-18377fe8e398` attempted all seven tools in explicit
candidate mode. It reported `protocolConformant=true`, 7/7 protocol-safe tool responses, six typed
rights holds, and a useful caller-supplied resolver result. It correctly reported
`gate4LaunchReady=false`: localhost is not the canonical advertised host; the cold development server
caused four owned-page timeouts; local health had no current rights-approved source set; and all
source-rights gates remained closed. Those failures are retained as blockers, not rewritten as a
production success.
