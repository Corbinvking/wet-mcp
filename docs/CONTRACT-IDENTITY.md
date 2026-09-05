# Contract identity

Prediction-market titles that look alike can settle differently. W.E.T. therefore separates three claims:

1. **Event grouping:** venue markets concern the same real-world event or matchup. This helps navigation but says nothing about identical settlement.
2. **Structural identity:** caller text can be parsed into the same subject, relation, parameters, and time frame. This is useful evidence, but caller-supplied text is not venue-verified settlement evidence.
3. **Human-confirmed same-question identity:** a reviewer confirmed that the venue contracts ask the same question after inspecting each leg's settlement basis. Only this tier may produce a numerical cross-venue gap. It does not mean identical settlement: sources, windows, rules, and void terms may still differ and must remain in an explicit settlement caution.

`wet_search_events` and `wet_event_markets` can show multiple venues around an event. Do not subtract those prices.

`wet_resolve` returns structural candidates or a typed refusal. Its `crossVenue` compatibility field and `numericComparisonEligible` remain false for caller-supplied listings.

`wet_resolve` is the sole currently usable public tool because it reads no W.E.T. board, corpus, ledger, or venue source. Its caller-supplied structural grouping never proves equivalence.

Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, `wet_cross_venue` and the other five W.E.T.-sourced/derived tools return typed `source_rights_pending` with no market or index values. If a future rights-cleared `wet_cross_venue` publishes a gap, it is still not automatically executable: fees, bid/ask, depth, position limits, settlement timing, jurisdiction, and operational risk remain outside a midpoint difference.

The public methodology page is [worldeventtrading.com/methodology/contract-identity](https://www.worldeventtrading.com/methodology/contract-identity).
