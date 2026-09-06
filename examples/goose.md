# Goose compatibility example

Production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. Do not connect
while that route-wide hold is active; this is a post-clearance candidate example.

Merge the `extensions.wet` entry from [`clients/goose.yaml`](../clients/goose.yaml) into the Goose configuration, or use a one-session Streamable HTTP connection to `https://www.worldeventtrading.com/api/mcp`.

Do not replace unrelated extensions. After an authorized release, reconnect, inspect the anonymous public tool list, and record the Goose version and UTC test time. Candidate default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance.
