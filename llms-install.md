# Install W.E.T. MCP

Use the hosted Streamable HTTP endpoint. Do not install or invent a local server package.

```text
https://www.worldeventtrading.com/api/mcp
```

The seven public research tools are keyless. Do not ask the user for a W.E.T. API key, venue credential, wallet, or payment method to connect them.

For Cline, set `type` to the exact camelCase value `streamableHttp`. For VS Code use a top-level `servers` object. For Gemini CLI use `httpUrl`. For Claude Code use `type: http`. For Cursor a remote `url` entry is sufficient. Copy the matching example from [`clients/`](clients/) and merge it without deleting other configured servers.

Only initiate browser OAuth if the user asks to access their W.E.T. scanners or alerts. Request the least scope needed and explain that authorization changes W.E.T. account state only. Never paste a token into chat.

After connection, verify that seven anonymous tools appear and run `wet_benchmark_value` with no arguments or a bounded `wet_search_events` query. Treat a typed refusal as a successful safety response.

Do not auto-approve deletion tools. Do not represent W.E.T. as an execution, wagering, order-routing, or advice service.
