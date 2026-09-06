# Quickstart

The W.E.T. Research candidate is designed as a hosted, keyless Streamable HTTP server. Its held
endpoint is:

```text
https://www.worldeventtrading.com/api/mcp
```

**Current status:** do not configure or connect a client. Production returns HTTP
`503`/`mcp_release_held` before discovery or calls, and the v0.5.0 candidate is pending source-rights,
legal, and release review. No credential can bypass the route-wide hold. This quickstart is retained
only for a future authorized release.

The candidate inventory needs no package, venue credential, wallet, or API key.

## Verify the endpoint

Only after the release hold is explicitly cleared, a normal browser request should return a JSON
service description:

```bash
curl -H "Accept: application/json" https://www.worldeventtrading.com/api/mcp
```

An MCP client should connect over HTTP and negotiate a supported MCP protocol version. Do not treat a browser description as an MCP session.

## First research chain

1. Only after a future authorized release, ask the client to call `wet_search_events` for the subject and date range.
2. If the question concerns individual outcomes or a probability band, call `wet_screen_markets`.
3. Choose an event id and call `wet_event_markets`; call its result live only when the venue supports drill-down, otherwise preserve the typed refusal.
4. If the question asks about venue differences, call `wet_cross_venue`; never subtract rows from ordinary event search.
5. Cite the returned event or index URL, observation time, venue, named outcome, quote basis, quality, and volume unit.

Example:

```text
Find outcomes below 15% that close in the next seven days. Keep each venue's
volume unit separate, then refresh the events I choose before calling any
price current. Flag any value W.E.T. withholds and repeat the refusal reason.
```

## Optional account authorization

After a future authorized release, compatible clients can discover W.E.T. OAuth from the
protected-resource metadata after an account-scoped tool returns `401`. Authorize only the scopes you
need. OAuth is not a way around the current release hold.

OAuth does not grant access to a venue or wallet. It can only read or change scanner and alert state inside the signed-in W.E.T. account. See [`AUTHENTICATION.md`](AUTHENTICATION.md).

## Troubleshooting

- If a source is degraded, inspect the keyless [service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health); do not describe another healthy feed as down. The [status page](https://www.worldeventtrading.com/status) reports benchmark publication only.
- If a result is refused, read the refusal code and `wants` field. Do not retry unchanged.
- While production returns `mcp_release_held`, do not reconnect or retry with credentials. After a future release, public and account-specific tool lists may intentionally differ.
- If a browser client fails preflight, use the W.E.T.-owned install guide for that client. Browser origins are allowlisted and raw API keys are not accepted cross-origin.
- Send a secret-free reproduction to [support](https://www.worldeventtrading.com/support).
