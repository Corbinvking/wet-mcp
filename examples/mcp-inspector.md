# MCP Inspector CLI compatibility example

Production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. Do not expect
the command below to list tools until emergency containment is explicitly cleared after all release
gates pass.

Use Node.js 22.19.0 or newer, then run the official Inspector CLI against the hosted Streamable HTTP endpoint:

```bash
npx @modelcontextprotocol/inspector --cli https://www.worldeventtrading.com/api/mcp --transport http --method tools/list --strict --format json
```

After a future authorized release, the command performs a fresh connection, lists the anonymous tool inventory, and reports schema-portability findings. It is a reviewer/proof command, not a persistent client configuration and not evidence that the full v0.7.0 candidate was authorized or deployed.

Record the exact Inspector package version, UTC time, exit code, endpoint, server version, and redacted output. In the candidate, default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six W.E.T.-sourced or derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. A safe refusal is protocol evidence, not source-rights clearance or a useful sourced result.

Official reference: [MCP Inspector CLI](https://github.com/modelcontextprotocol/inspector/blob/main/clients/cli/README.md).
