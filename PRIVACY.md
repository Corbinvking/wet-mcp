# MCP privacy summary

The hosted [W.E.T. privacy policy](https://www.worldeventtrading.com/privacy) is canonical and governs the service. This summary highlights MCP-specific behavior.

## Keyless research

Under current default-deny policy `mcp-source-rights/2026-09-05.phase1`, six sourced/derived tools return typed `source_rights_pending`; `wet_resolve` remains usable for caller-supplied listing text. Credentials cannot bypass that hold.

Public MCP telemetry records bounded client name/version, protocol version, a known-tool bucket, outcome or refusal code, argument count, matched or returned counts, duration, whether any credential header was presented (not its value or validity), and whether account tools were actually available. It also records four citation-readiness booleans: whether the result contains a source URL, venue, timestamp, and all three together. Those flags do not copy the URL, venue, timestamp, market title, source text, or value into analytics. Rejections before normal dispatch record only a bounded stage, method category, HTTP status, and reason. Caller-defined argument key names, request bodies, raw method/tool strings on rejected requests, Origin, error text, and search text are not stored. For a search query, W.E.T. records only its length, token count, and a salted same-day digest used to count repeated shapes. Raw IP addresses, authorization headers, API keys, and token values are not included in product analytics. The caller bucket also rotates each UTC day when a server-side secret is available; production without that secret records `unavailable`. This design does not measure cross-day keyless retention.

Venue titles, rules, prices, news, and other third-party source data are not personal account data supplied by the MCP caller.

## OAuth account access

OAuth authorization is optional and used only for scanner and alert state inside the signed-in W.E.T. account. W.E.T. stores the client id, user id, granted scopes, resource audience, issuance/expiry/use/revocation times, and only SHA-256 hashes of authorization codes and tokens. It does not request a venue login, wallet, order, or trading permission.

Authorization codes expire in five minutes, access tokens in one hour, and rotating refresh tokens in 30 days. Spent and expired authentication records are removed by the scheduled retention pass. Scanner idempotency rows expire after 24 hours, dedup reservations at their configured expiry, and terminal email-intent rows after 30 days. A scanner delete leaves a non-runnable tombstone plus revisions and distinct mutation receipts until account erasure. Run/match evidence is retained for at most 30 days and 1,000 rows per scanner; incomplete leases and rows linked to queued, sending, or failed mail intents remain until recovery or terminalization makes deletion safe. Stale mail work is cancelled, and the durable outbox stores no recipient email address. Account deletion hard-deletes the user's remaining scanner lifecycle/delivery rows and OAuth authorizations along with other W.E.T. account automation state.

## Requests

Email **privacy@worldeventtrading.com** to request access, deletion, or correction. Do not send a credential in the request.
