# MCP Inspector CLI compatibility example

Use Node.js 22.19.0 or newer, then run the official Inspector CLI against the hosted Streamable HTTP endpoint:

```bash
npx @modelcontextprotocol/inspector --cli https://www.worldeventtrading.com/api/mcp --transport http --method tools/list --strict --format json
```

The command performs a fresh connection, lists the anonymous tool inventory, and reports schema-portability findings. It is a reviewer/proof command, not a persistent client configuration and not evidence that v0.5.0 is deployed.

Record the exact Inspector package version, UTC time, exit code, endpoint, server version, and redacted output. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced or derived tools are expected to return typed `source_rights_pending`; only `wet_resolve` remains usable for caller-supplied listing text. Credentials cannot bypass the hold. A safe refusal is protocol evidence, not source-rights clearance or a useful sourced result.

Official reference: [MCP Inspector CLI](https://github.com/modelcontextprotocol/inspector/blob/main/clients/cli/README.md).
