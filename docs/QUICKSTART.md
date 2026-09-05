# Quickstart

W.E.T. Research is a hosted, keyless Streamable HTTP server. Connect to:

```text
https://www.worldeventtrading.com/api/mcp
```

No package, venue credential, wallet, or API key is needed for the seven public research tools.

## Verify the endpoint

A normal browser request returns a JSON service description:

```bash
curl -H "Accept: application/json" https://www.worldeventtrading.com/api/mcp
```

An MCP client should connect over HTTP and negotiate a supported MCP protocol version. Do not treat a browser description as an MCP session.

## First research chain

1. Ask the client to call `wet_search_events` for the subject and date range.
2. If the question concerns individual outcomes or a probability band, call `wet_screen_markets`.
3. Choose an event id and call `wet_event_markets` for a live venue read.
4. If the question asks about venue differences, call `wet_cross_venue`; never subtract rows from ordinary event search.
5. Cite the returned event or index URL, observation time, venue, named outcome, quote basis, quality, and volume unit.

Example:

```text
Find outcomes below 15% that close in the next seven days. Keep each venue's
volume unit separate, then refresh the events I choose before calling any
price current. Flag any value W.E.T. withholds and repeat the refusal reason.
```

## Optional account authorization

Compatible clients can discover W.E.T. OAuth from the protected-resource metadata after an account-scoped tool returns `401`. Authorize only the scopes you need. The public research tools remain usable without signing in.

OAuth does not grant access to a venue or wallet. It can only read or change scanner and alert state inside the signed-in W.E.T. account. See [`AUTHENTICATION.md`](AUTHENTICATION.md).

## Troubleshooting

- If a source is degraded, inspect [service status](https://www.worldeventtrading.com/status); do not describe another healthy feed as down.
- If a result is refused, read the refusal code and `wants` field. Do not retry unchanged.
- If a tool is missing, reconnect and inspect the authenticated tool list; public and account-specific lists are intentionally different.
- If a browser client fails preflight, use the W.E.T.-owned install guide for that client. Browser origins are allowlisted and raw API keys are not accepted cross-origin.
- Send a secret-free reproduction to [support](https://www.worldeventtrading.com/support).
