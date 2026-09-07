# Windsurf compatibility example

Production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. Do not connect
while that route-wide hold is active; this is a post-clearance candidate example.

Merge the `wet` object from [`clients/windsurf.json`](../clients/windsurf.json) into the Windsurf MCP configuration. Preserve the remote `serverUrl` value `https://www.worldeventtrading.com/api/mcp`.

Do not replace unrelated servers. After an authorized release, reconnect, inspect the anonymous public tool list, and record the Windsurf version and UTC test time. Candidate default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance.
