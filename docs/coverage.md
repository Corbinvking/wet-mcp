# Coverage

Coverage is runtime state, not a static package claim. This document intentionally does not freeze a source list into a release artifact.

Current public-output policy is also not inferred from coverage. Production returns route-wide HTTP `503`/`mcp_release_held` before discovery or calls. In a controlled candidate environment, default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six W.E.T.-sourced/derived tools return `source_rights_pending`; `wet_resolve` alone is the caller-supplied-text exception. Health, enablement, authentication, or paid access cannot bypass either hold.

Use these public records together:

- [Coverage](https://www.worldeventtrading.com/coverage) describes the currently published human-readable scope.
- [Machine-readable coverage](https://www.worldeventtrading.com/coverage.json) is the automation-facing coverage record.
- [Service and feed health](https://www.worldeventtrading.com/api/wet/v1/health) reports source-specific availability and freshness.
- [Benchmark publication status](https://www.worldeventtrading.com/status) reports benchmark publication; it is not a general service-health page.

## Reading `wet_search_events.coverage`

After a future authorized release, `wet_search_events` returns an actionable coverage envelope rather
than treating every bounded result as the same kind of partial answer:

- `status: complete` means every source W.E.T. could measure was fresh and every venue sweep recorded
  for that board generation finished as `complete` or `capped`. It does not mean the result is an
  exhaustive search of every listing.
- `status: partial` means at least one measured ingest source was cold, a venue sweep was `degraded`
  or `unavailable`, or a venue was measured by neither ingest health nor that generation's sweep.
  Read `means` for the named cause instead of treating `partial` as permanent noise.
- `status: unknown` means W.E.T. could not read its own ingest-health record. Treat the result as
  partial even when the board's separately recorded sweep boundary is present.
- `degradedSources` contains only sources W.E.T. measured and found not fresh.
  `unmeasuredSources` contains venues covered by neither the health plane nor the board sweep. “Cold”
  and “not measured” are different facts and must not be merged.
- `searchable.events` and `searchable.venues` size the board the query actually searched, after
  clustering and the board horizon. A cross-venue event is counted under every venue it lists, just
  as the `venue` filter matches it, so the per-venue sum can exceed `searchable.events`.
- `swept.venues` reports the larger pre-clustering, pre-horizon venue reads behind that board. A
  `contributed` count is a measurement only with venue status `complete` or `capped`; with `degraded`
  or `unavailable`, even zero means the read did not finish, not that the venue lists nothing.
  `sweepCapped`, `sweepDegraded`, and `observedAt` bind those rows to the generation that answered.
- `boardTrimmed`, when present, means that generation also shed its far-horizon tail to fit the board
  payload budget.

`resultsComplete` remains false on every answer because the board is a bounded slice even when
`status` is `complete`. An empty complete result is evidence for “not on this board,” never proof that
an event or market does not exist.

Interpret the records conservatively:

- A registered source is not necessarily enabled.
- An enabled adapter is not necessarily healthy, complete, or rights-cleared for every use.
- A healthy observation applies only to the source, fields, and observation time reported.
- Event grouping is not contract identity, and contract identity does not erase settlement differences.
- Missing, degraded, stale, or refused fields must remain missing, degraded, stale, or refused.

See the package-root [`DATA-SOURCES.md`](../DATA-SOURCES.md), [`LIMITATIONS.md`](../LIMITATIONS.md), and [`FRESHNESS.md`](FRESHNESS.md) before automating a workflow.
