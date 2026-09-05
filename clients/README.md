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

The public seven-tool research surface needs no credential. Do not add an API key to these shared examples. If the client supports W.E.T. OAuth, initiate authorization from its MCP connection panel only when account scanner or alert tools are needed.

Client formats change independently. The W.E.T.-owned guides at [worldeventtrading.com/mcp](https://www.worldeventtrading.com/mcp) are the supported installation record.
