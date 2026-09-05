# Contract identity

Prediction-market titles that look alike can settle differently. W.E.T. therefore separates three claims:

1. **Event grouping:** venue markets concern the same real-world event or matchup. This helps navigation but says nothing about identical settlement.
2. **Structural identity:** caller text can be parsed into the same subject, relation, parameters, and time frame. This is useful evidence, but caller-supplied text is not venue-verified settlement evidence.
3. **Human-confirmed equivalence:** a reviewer confirmed that venue contracts ask the same claim after inspecting their settlement basis. Only this tier may produce a numerical cross-venue gap.

`wet_search_events` and `wet_event_markets` can show multiple venues around an event. Do not subtract those prices.

`wet_resolve` returns structural candidates or a typed refusal. Its `crossVenue` compatibility field and `numericComparisonEligible` remain false for caller-supplied listings.

`wet_cross_venue` reads the confirmed identity graph. Even there, a published gap is not automatically executable: fees, bid/ask, depth, position limits, settlement timing, jurisdiction, and operational risk remain outside a midpoint difference.

The public methodology page is [worldeventtrading.com/methodology/contract-identity](https://www.worldeventtrading.com/methodology/contract-identity).
