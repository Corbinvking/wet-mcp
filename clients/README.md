# Client configuration

Every example connects directly to the same hosted Streamable HTTP endpoint. Merge the relevant object into the client file named below; do not overwrite unrelated server entries.

| Example | Typical location or flow |
|---|---|
| `claude-code.json` | Project `.mcp.json`, or `claude mcp add --transport http wet https://www.worldeventtrading.com/api/mcp` |
| `cursor.json` | Project `.cursor/mcp.json` or user `~/.cursor/mcp.json` |
| `vscode.json` | Workspace `.vscode/mcp.json` or **MCP: Open User Configuration** |
| `cline.json` | Cline MCP Servers → Configure, or CLI `~/.cline/mcp.json` |
| `windsurf.json` | `~/.codeium/windsurf/mcp_config.json` |
| `gemini-cli.json` | Project or user Gemini `settings.json`; the installable extension uses `gemini-extension.json` at repository root |
| `goose.yaml` | Merge the `extensions.wet` entry into the Goose `config.yaml`, or run `goose session --with-streamable-http-extension "https://www.worldeventtrading.com/api/mcp"` for one session |

MCP Inspector is a proof client rather than a persisted configuration. Use the exact strict Streamable HTTP command in [`examples/mcp-inspector.md`](../examples/mcp-inspector.md).

The public seven-tool inventory needs no credential. Six W.E.T.-sourced/derived tools currently return typed `source_rights_pending` under default-deny policy `mcp-source-rights/2026-09-05.phase1`; `wet_resolve` remains usable for caller-supplied listing text. Do not add an API key to these shared examples. Credentials, paid access, adapter state, and environment settings cannot bypass the hold. If the client supports W.E.T. OAuth, initiate authorization from its MCP connection panel only when account scanner or alert tools are needed. Authorization can add scoped inventory, but 14 source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending`; scanner execution also requires venue and headline-source rights. Scanner pause, alert deletion, and two-step scanner deletion remain source-neutral stop controls.

Client formats change independently. The W.E.T.-owned guides at [worldeventtrading.com/mcp](https://www.worldeventtrading.com/mcp) are the supported installation record.
