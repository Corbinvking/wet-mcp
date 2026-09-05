# Authentication and authorization

The seven W.E.T. Research tools are keyless. Authentication is requested only for optional account-scoped scanner and alert actions.

## OAuth flow

W.E.T. exposes OAuth 2.1-style authorization-code flow metadata for MCP clients:

- Protected resource: `https://www.worldeventtrading.com/.well-known/oauth-protected-resource/api/mcp`
- Authorization server: `https://www.worldeventtrading.com/.well-known/oauth-authorization-server`
- Dynamic client registration: `https://www.worldeventtrading.com/oauth/register`
- Authorization: `https://www.worldeventtrading.com/oauth/authorize`
- Token: `https://www.worldeventtrading.com/oauth/token`
- Revocation: `https://www.worldeventtrading.com/oauth/revoke`
- Resource audience: `https://www.worldeventtrading.com/api/mcp`

Authorization code clients are public clients and must use PKCE `S256`. Redirect URIs are exactly matched, except that registered loopback redirects may use an ephemeral local port. Authorization responses include the RFC 9207 `iss` parameter.

Dynamic registrations are self-asserted, not W.E.T.-verified identities. The consent screen therefore identifies the client as unverified and shows both its exact client ID and callback URI; confirm that you initiated the connection and recognize those values before allowing access. Valid registrations are admitted through durable per-source and service-wide hourly ceilings. A registration that never completes a grant expires after seven days and is removed by the scheduled retention purge.

OAuth form endpoints accept at most 16 KiB of unencoded `application/x-www-form-urlencoded` data. Dynamic registration accepts at most 32 KiB of unencoded `application/json`. Compressed or otherwise content-encoded request bodies are refused.

## Scopes

```text
wet.research.read
wet.scanners.read
wet.scanners.write
wet.alerts.write
```

Request the smallest set needed. There is deliberately no trading, venue-account, wallet, order, routing, or execution scope.

An authorization request may select only a subset of the scopes recorded at client registration; it cannot widen the client's registered permission envelope.

## Token handling

- Authorization codes expire after five minutes and are single-use.
- Access tokens expire after one hour.
- Refresh tokens expire after 30 days and rotate on use.
- Reuse of a rotated refresh token revokes its token family.
- Tokens and authorization codes are stored by W.E.T. only as SHA-256 hashes.
- Revoke access through the client or the revocation endpoint when an integration is no longer used.

Never place an authorization code, access token, refresh token, API key, session cookie, or one-time email code in a prompt, URL, repository, screenshot, or support request.

## Legacy API keys

Server-side and CLI integrations may continue to present a scoped W.E.T. API key in `Authorization: Bearer …` or `x-wet-api-key`. Browser CORS deliberately does not allow `x-wet-api-key`. OAuth is the supported browser-client path for account tools.

API-key access may include legacy watchlist and saved-view tools that are not part of the OAuth product boundary. Their presence must not be interpreted as broader OAuth authority.

## Error behavior

- A protected tool without credentials returns `401` plus `WWW-Authenticate` protected-resource metadata.
- An invalid, expired, or wrong-audience OAuth token returns `401`.
- A valid token without the required scope returns `403` with `insufficient_scope` and the required scope.
- A mixed batch containing an unauthorized protected call is rejected before any member executes, preventing partial mutation.

Public research calls remain available without a token even when account authorization is not configured.
