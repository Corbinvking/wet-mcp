# Cline compatibility example

Production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. Do not connect
or submit while that route-wide hold is active; this is a post-clearance candidate example.

Merge the `wet` object from [`clients/cline.json`](../clients/cline.json) into Cline's MCP configuration. Preserve the exact `streamableHttp` transport spelling, the endpoint `https://www.worldeventtrading.com/api/mcp`, and the empty `autoApprove` array.

After an authorized release, reconnect, inspect the anonymous public tool list, and record the Cline version and UTC test time. Candidate default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance. Use [`assets/cline-icon-400.png`](../assets/cline-icon-400.png) only for a marketplace submission after its release gates pass.
