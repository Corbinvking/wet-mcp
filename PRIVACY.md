# MCP privacy summary

The hosted [W.E.T. privacy policy](https://www.worldeventtrading.com/privacy) is canonical and governs the service. This summary highlights MCP-specific behavior.

## Keyless research

Public MCP telemetry records client name/version, protocol version, tool name, outcome or refusal code, argument key names/count, matched or returned counts, duration, and whether a credential was presented. Search text is not stored. W.E.T. records its length, token count, and a salted hash used to count repeated shapes. Raw IP addresses, authorization headers, API keys, and token values are not included in product analytics.

Venue titles, rules, prices, news, and other third-party source data are not personal account data supplied by the MCP caller.

## OAuth account access

OAuth authorization is optional and used only for scanner and alert state inside the signed-in W.E.T. account. W.E.T. stores the client id, user id, granted scopes, resource audience, issuance/expiry/use/revocation times, and only SHA-256 hashes of authorization codes and tokens. It does not request a venue login, wallet, order, or trading permission.

Authorization codes expire in five minutes, access tokens in one hour, and rotating refresh tokens in 30 days. Spent and expired authentication records are removed by the scheduled retention pass. Account deletion removes that user's OAuth authorizations and W.E.T. account automation state.

## Requests

Email **privacy@worldeventtrading.com** to request access, deletion, or correction. Do not send a credential in the request.
