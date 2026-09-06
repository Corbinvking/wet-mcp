# Coverage

Coverage is runtime state, not a static package claim. This document intentionally does not freeze a source list into a release artifact.

Current public-output policy is also not inferred from coverage. Production returns route-wide HTTP `503`/`mcp_release_held` before discovery or calls. In a controlled candidate environment, default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six W.E.T.-sourced/derived tools return `source_rights_pending`; `wet_resolve` alone is the caller-supplied-text exception. Health, enablement, authentication, or paid access cannot bypass either hold.

Use these public records together:

- [Coverage](https://www.worldeventtrading.com/coverage) describes the currently published human-readable scope.
- [Machine-readable coverage](https://www.worldeventtrading.com/coverage.json) is the automation-facing coverage record.
- [Service and feed health](https://www.worldeventtrading.com/api/wet/v1/health) reports source-specific availability and freshness.
- [Benchmark publication status](https://www.worldeventtrading.com/status) reports benchmark publication; it is not a general service-health page.

Interpret the records conservatively:

- A registered source is not necessarily enabled.
- An enabled adapter is not necessarily healthy, complete, or rights-cleared for every use.
- A healthy observation applies only to the source, fields, and observation time reported.
- Event grouping is not contract identity, and contract identity does not erase settlement differences.
- Missing, degraded, stale, or refused fields must remain missing, degraded, stale, or refused.

See the package-root [`DATA-SOURCES.md`](../DATA-SOURCES.md), [`LIMITATIONS.md`](../LIMITATIONS.md), and [`FRESHNESS.md`](FRESHNESS.md) before automating a workflow.
