# Gemini CLI compatibility example

Production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. The Gemini CLI
gallery auto-indexed the public repository without an intentional submission; its cached entry is
not approval or release evidence. Do not connect or submit while the route-wide hold is active.

Merge the `wet` object from [`clients/gemini-cli.json`](../clients/gemini-cli.json) into the project or user Gemini CLI settings. Preserve the `httpUrl` field, timeout, and endpoint `https://www.worldeventtrading.com/api/mcp`.

The future installable extension uses [`gemini-extension.json`](../gemini-extension.json). After an authorized release, reconnect, inspect the anonymous public tool list, and record the Gemini CLI version and UTC test time. Candidate default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance.
