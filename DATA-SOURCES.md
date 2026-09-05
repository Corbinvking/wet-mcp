# Data sources

This root-level file is a compatibility entry point for reviewers and directories that expect `DATA-SOURCES.md` at the package root.

The maintained source and provenance policy is [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md). Runtime coverage must be read from the public [coverage record](https://www.worldeventtrading.com/coverage), [machine-readable coverage](https://www.worldeventtrading.com/coverage.json), and keyless [service and feed health](https://www.worldeventtrading.com/api/wet/v1/health).

Do not infer enabled, healthy, exhaustive, or rights-cleared coverage from the existence of an adapter, registry entry, example, or directory listing.

Current policy `mcp-source-rights/2026-09-05.phase1` is default-deny: six W.E.T.-sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` remains usable for caller-supplied listing text. Credentials, paid access, adapters, and environment settings cannot bypass the hold.

The headline tool is separately gated on both event/venue inputs and every enabled publisher or official feed, including a persisted-wire provenance attestation. Venue permission alone cannot unlock headline output. Each news approval is pinned to the reviewed feed ID, configured publisher/operator label, transport type, and exact URL fingerprint, so a production override cannot inherit permission by reusing an ID. Phase 1 also rejects restricted grants unless their field, delay, territory, audience, attribution, identity, and other constraints are implemented in code; only the exact pinned v0.5 output contract can clear the coarse gate.
