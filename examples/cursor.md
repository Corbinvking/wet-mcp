# Cursor compatibility example

Merge the `wet` object from [`clients/cursor.json`](../clients/cursor.json) into the project's or user's Cursor MCP configuration. The canonical endpoint is `https://www.worldeventtrading.com/api/mcp`.

Do not replace unrelated servers. Reconnect, inspect the anonymous public tool list, and record the Cursor version and UTC test time. Current default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` remains usable for caller-supplied text. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance.
