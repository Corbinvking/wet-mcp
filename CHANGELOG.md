# Changelog

All notable integration-package and hosted MCP contract changes are recorded here. The hosted [W.E.T. changelog](https://www.worldeventtrading.com/changelog) remains the broader product record.

## 0.5.0 — 2026-09-05

- Added current MCP `server/discover` behavior while retaining supported legacy protocol clients.
- Added content-negotiated browser discovery at `GET /api/mcp`; protocol/SSE GET remains method-rejected.
- Added exact-origin browser CORS with `Authorization` support and no cross-origin raw API-key header.
- Added OAuth protected-resource and authorization-server discovery, public dynamic client registration, PKCE S256, scoped authorization, refresh rotation, and revocation.
- Kept seven public W.E.T. Research tools keyless and read-only; OAuth appends only authorized scanner and alert tools and cannot bypass source-rights policy.
- Added default-deny policy `mcp-source-rights/2026-09-05.phase1`: six W.E.T.-sourced/derived tools return typed `source_rights_pending` with zero market or index values, while `wet_resolve` remains usable for caller-supplied listing text.
- Reduced anonymous `tools/list` payload size while retaining structural input/output schemas and typed-refusal semantics.
- Added complete tool annotations, including destructive hints for delete actions and open-world hints for live-source tools.
- Separated service liveness from per-feed readiness; every enabled feed now has a bounded health adapter.
- Added public security, terms, support, coverage, limitations, data-source, methodology, history-API, and client-install records.
- Prepared the canonical registry, Agent Plugins, Claude plugin, Gemini extension, Docker Catalog, client-config, and evaluation artifacts for publication; availability is not claimed until each external listing is accepted.
- Added a dependency-free package validator, offline CI, opt-in live endpoint checks, a Goose client example, and a 512px package icon.
- Added positive and negative demo storyboards plus a dependency-free clean-client verifier that separates protocol-safe responses from useful sourced results and does not pass default launch readiness while required sourced tools are held.

## 0.4.0 — 2026-09-03

- Published seven keyless research tools and scoped API-key account tools on the hosted endpoint.
- Added output schemas and expanded identity/refusal semantics.
