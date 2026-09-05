# Limitations

- Six W.E.T.-sourced/derived public tools currently return typed `source_rights_pending` under default-deny policy `mcp-source-rights/2026-09-05.phase1`, with zero market or index value fields. Only caller-supplied-text parsing through `wet_resolve` remains usable.
- Phase 1 is coarse `coarse-all-rights-protected-sources` enforcement. Mixed-source filtering is not implemented; partial approval cannot produce a partial answer, and credentials or environment settings cannot bypass the hold.
- Coverage is bounded to enabled feeds and tracked events. The wider venue registry is not ingestion coverage.
- Source APIs can be delayed, stale, rate-limited, incomplete, corrected, or unavailable.
- Event grouping does not prove contract equivalence. A numeric gap requires human-confirmed same-question identity; settlement sources, windows, rules, and void terms can still differ and remain in the caution.
- Headline matching is heuristic and non-causal.
- Quote basis and movement basis differ by venue and cannot always be normalized safely.
- Volume units can be incompatible.
- A source can close trading before publishing a determination.
- A typed refusal can withhold a value even when related data exists. A protocol-safe refusal is not a useful sourced result.
- OAuth account tools change only W.E.T. scanner or alert state; they do not act at a venue.
- W.E.T. provides no execution, wallet, custody, personalized advice, return guarantee, or jurisdictional eligibility determination.
- The public service has no published uptime or response-time SLA unless a separate written agreement says otherwise.

Read the current public [limitations](https://www.worldeventtrading.com/limitations), [terms](https://www.worldeventtrading.com/terms), [service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health), and [benchmark publication status](https://www.worldeventtrading.com/status) before relying on an automated workflow.
