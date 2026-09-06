# Claude compatibility example

Production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. Do not connect
while that route-wide hold is active; the configuration below is a post-clearance candidate example.

The packaged configuration targets Claude Code. Merge the `wet` object from [`clients/claude-code.json`](../clients/claude-code.json), or run:

```bash
claude mcp add --transport http wet https://www.worldeventtrading.com/api/mcp
```

Reconnect, confirm the anonymous public tool inventory, and record the Claude client version and UTC test time. Do not infer compatibility with a different Claude surface from this Claude Code artifact.

In the candidate, default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. A held response is protocol-safe, not useful live-data evidence.
