# Cursor compatibility example

Production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. Do not connect
while that route-wide hold is active; this is a post-clearance candidate example.

Merge the `wet` object from [`clients/cursor.json`](../clients/cursor.json) into the project's or user's Cursor MCP configuration. The canonical endpoint is `https://www.worldeventtrading.com/api/mcp`.

Do not replace unrelated servers. After an authorized release, reconnect, inspect the anonymous public tool list, and record the Cursor version and UTC test time. Candidate default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance.
