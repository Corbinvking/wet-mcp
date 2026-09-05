# Client configuration examples

This `examples/` view exists for directories and reviewers that expect client instructions as Markdown. The typed files in [`clients/`](../clients/) are authoritative; merge the relevant `wet` object without replacing unrelated client settings.

| Client | Authoritative configuration | Configuration note |
|---|---|---|
| Claude Code | [`claude-code.json`](../clients/claude-code.json) | Project `.mcp.json`, or use the documented HTTP add command. |
| Cline | [`cline.json`](../clients/cline.json) | Keep the exact `streamableHttp` transport value and an empty auto-approval list. |
| Cursor | [`cursor.json`](../clients/cursor.json) | Merge into the project or user MCP configuration. |
| Gemini CLI | [`gemini-cli.json`](../clients/gemini-cli.json) | Keep the `httpUrl` field and timeout. |
| Goose | [`goose.yaml`](../clients/goose.yaml) | Merge the `extensions.wet` entry. |
| MCP Inspector CLI | [`mcp-inspector.md`](mcp-inspector.md) | Run a fresh strict Streamable HTTP inventory check; no persisted config is required. |
| VS Code | [`vscode.json`](../clients/vscode.json) | Use the top-level `servers` object. |
| Windsurf | [`windsurf.json`](../clients/windsurf.json) | Keep the remote `serverUrl` field. |

All examples connect to the hosted Streamable HTTP endpoint:

```text
https://www.worldeventtrading.com/api/mcp
```

The anonymous seven-tool inventory requires no credential. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced/derived tools return typed `source_rights_pending`; `wet_resolve` remains usable for caller-supplied listing text. No API key, OAuth grant, paid tier, adapter state, or environment setting can approve rights or bypass the hold. Do not add an API key, browser cookie, third-party account credential, wallet permission, or automatic write approval to a shared example. Optional OAuth begins in a compatible client's connection flow only when the user requests account-scoped W.E.T. scanner or alert functionality. It can add authorized inventory, but 14 source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending`; scanner execution also requires venue and headline-source rights. Alert pause and deletion, notification mark-read, scanner pause, and two-step scanner deletion remain source-neutral controls.

Follow [`llms-install.md`](../llms-install.md) for the common install boundary and the maintained [W.E.T. client guides](https://www.worldeventtrading.com/mcp) for current UI steps. A configuration file is not evidence of a successful clean-client test; record that evidence separately with the client version, UTC time, server version, and result.
