# Client configuration

Every example targets the same hosted Streamable HTTP endpoint, but production currently returns HTTP
`503`/`mcp_release_held` before discovery or calls. Do not install or merge these examples into a
client configuration while the hold is active. They are retained only for a future authorized release.

| Example | Typical location or flow |
|---|---|
| `claude-code.json` | Project `.mcp.json`, or `claude mcp add --transport http wet https://www.worldeventtrading.com/api/mcp` |
| `cursor.json` | Project `.cursor/mcp.json` or user `~/.cursor/mcp.json` |
| `vscode.json` | Workspace `.vscode/mcp.json` or **MCP: Open User Configuration** |
| `cline.json` | Cline MCP Servers → Configure, or CLI `~/.cline/mcp.json` |
| `windsurf.json` | `~/.codeium/windsurf/mcp_config.json` |
| `gemini-cli.json` | Project or user Gemini `settings.json`; the installable extension uses `gemini-extension.json` at repository root |
| `goose.yaml` | Merge the `extensions.wet` entry into the Goose `config.yaml`, or run `goose session --with-streamable-http-extension "https://www.worldeventtrading.com/api/mcp"` for one session |

The candidate seven-tool research inventory needs no credential. Do not add an API key to these shared
examples or retry the held endpoint with OAuth. After a future authorized release, initiate W.E.T.
OAuth only when account scanner or alert tools are needed.

Client formats change independently. Check [support](https://www.worldeventtrading.com/support) before
any future setup; [benchmark publication status](https://www.worldeventtrading.com/status) is a
separate index-desk record and is not evidence that the MCP release hold was lifted.
