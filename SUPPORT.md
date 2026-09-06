# Support

Before reporting an integration issue, check:

1. [Service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health) for current liveness, freshness, and source-specific degradation.
2. [Benchmark publication status](https://www.worldeventtrading.com/status) for the index desk's latest-close state.
3. [Changelog](https://www.worldeventtrading.com/changelog) for an interface change.
4. [Coverage](https://www.worldeventtrading.com/coverage) and [limitations](https://www.worldeventtrading.com/limitations) before treating an omitted venue or refusal as a defect.
5. [`docs/quickstart.md`](docs/quickstart.md) and the client example in [`clients/`](clients/).

Emergency containment currently makes every production MCP GET and POST return HTTP
`503`/`mcp_release_held` before discovery or tool dispatch. This is the expected hosted response;
do not retry with credentials. In an enabled candidate environment, source-rights policy
`mcp-source-rights/2026-09-05.phase1` instead makes six sourced/derived public tools return typed
`source_rights_pending`, and credentials cannot bypass that hold. Report any production response
that exposes discovery or sourced results while emergency containment remains active as a
policy-contract issue.

For a reproducible problem, open a GitHub issue without credentials or email **support@worldeventtrading.com**. Include the client and version, MCP protocol version, tool name, UTC time, request id if returned, expected behavior, actual behavior, and minimal reproduction.

For a data discrepancy, also include the venue, event or market id, source URL, displayed as-of time, and the conflicting source value. Do not include an API key, token, session cookie, one-time code, or personal data.

Security issues must use the private process in [`SECURITY.md`](SECURITY.md). Benchmark licensing questions go to **indices@worldeventtrading.com**.

Support is currently best effort; no response-time or resolution SLA is offered.
