# Changelog

All notable integration-package and hosted MCP contract changes are recorded here. The hosted [W.E.T. changelog](https://www.worldeventtrading.com/changelog) remains the broader product record.

## 0.5.0 — 2026-09-05

**Release status: held candidate; not authorized, tagged, or released.** Production briefly
advertised v0.5.0 and exposed source-derived results without authorization. Emergency containment
commit `5eaf5f026491d9ab64ede00234e01a36f6a8ccf9` deployed at `2026-09-06T05:26:05Z`; the canonical
endpoint now returns route-wide HTTP `503`/`mcp_release_held` with `Cache-Control: no-store` and
`Retry-After: 3600` before discovery or tool dispatch. See the dated
[containment record](evidence/2026-09-06-production-containment.md).

Do not install, configure, connect to, or call the candidate until owner authorization, legal
review, and source-rights clearance are complete and a final release action is authorized. No
current availability is claimed by the candidate contract or by a cached external listing.

The changes below describe the held candidate contract, not currently enabled production behavior:

- Added current MCP `server/discover` behavior while retaining supported legacy protocol clients.
- Added content-negotiated browser discovery at `GET /api/mcp`; protocol/SSE GET remains method-rejected.
- Added exact-origin browser CORS with `Authorization` support and no cross-origin raw API-key header.
- Added OAuth protected-resource and authorization-server discovery, public dynamic client registration, PKCE S256, scoped authorization, refresh rotation, and revocation.
- Kept seven public W.E.T. Research tools keyless and read-only; OAuth appends only authorized scanner and alert tools and cannot bypass source-rights policy.
- Added default-deny policy `mcp-source-rights/2026-09-05.phase1`: six W.E.T.-sourced/derived tools return typed `source_rights_pending` with zero market or index values, while `wet_resolve` is the proposed caller-supplied-text exception after a future authorized release.
- Reduced anonymous `tools/list` payload size while retaining structural input/output schemas and typed-refusal semantics.
- Added complete tool annotations, including destructive hints for delete actions and open-world hints for live-source tools.
- Separated service liveness from per-feed readiness; every enabled feed now has a bounded health adapter.
- Added public security, terms, support, coverage, limitations, data-source, methodology, history-API, and client-install records.
- Prepared the canonical registry, Agent Plugins, Claude plugin, Gemini extension, Docker Catalog, client-config, and evaluation artifacts for a future authorized publication. A Gemini CLI crawler auto-indexed the public repository without an intentional submission; its cached entry is a discovery fact, not approval or release evidence. The official MCP Registry has zero W.E.T. records, and all publication actions remain held.
- Added a dependency-free package validator, offline CI, opt-in live endpoint checks, a Goose client example, and a 512px package icon.
- Added positive and negative demo storyboards plus a dependency-free clean-client verifier that separates protocol-safe responses from useful sourced results and does not pass default launch readiness while required sourced tools are held.

## 0.4.0 — 2026-09-03

- Historical pre-containment record, superseded by the v0.5.0 hold: seven keyless research tools
  and scoped API-key account tools were previously exposed on the hosted endpoint.
- Historical pre-containment record: added output schemas and expanded identity/refusal semantics;
  this does not describe current availability.
