# W.E.T. MCP installation reference — release held

The future authorized service uses the hosted Streamable HTTP endpoint. Do not install, configure, or
connect this package now.

```text
https://www.worldeventtrading.com/api/mcp
```

**Current status:** production returns HTTP `503`/`mcp_release_held` before discovery or calls. The
v0.5.0 package is an unreleased candidate pending source-rights, legal, and release review. A cached
or crawler-created listing is not approval, and credentials cannot bypass the hold.

The candidate defines seven keyless research tools. Do not ask the user for a W.E.T. API key, venue
credential, wallet, or payment method to connect them.

Only after a future authorized release: for Cline, set `type` to the exact camelCase value
`streamableHttp`; for VS Code use a top-level `servers` object; for Gemini CLI use `httpUrl`; for
Claude Code use `type: http`; and for Cursor a remote `url` entry is sufficient. Until then, do not
copy the examples in [`clients/`](clients/) into any client configuration.

Only after a future authorized release, initiate browser OAuth if the user asks to access their W.E.T.
scanners or alerts. Request the least scope needed and explain that authorization changes W.E.T.
account state only. Never paste a token into chat.

After a future authorized connection, verify the documented inventory. While the release hold is
active, the only correct production result is `mcp_release_held`; do not retry with credentials or
count that response as a launched research service.

Do not auto-approve deletion tools. Do not represent W.E.T. as an execution, wagering, order-routing, or advice service.
