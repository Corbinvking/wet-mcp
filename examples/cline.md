# Cline compatibility example

Merge the `wet` object from [`clients/cline.json`](../clients/cline.json) into Cline's MCP configuration. Preserve the exact `streamableHttp` transport spelling, the endpoint `https://www.worldeventtrading.com/api/mcp`, and the empty `autoApprove` array.

Reconnect, inspect the anonymous public tool list, and record the Cline version and UTC test time. Current default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` remains usable for caller-supplied text. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance. Use [`assets/cline-icon-400.png`](../assets/cline-icon-400.png) only for a marketplace submission after its release gates pass.
