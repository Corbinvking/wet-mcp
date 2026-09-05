# Positive demo — 55-second storyboard and transcript

**Target runtime:** 55 seconds at a clear conversational pace.  
**Recording state:** storyboard only; not evidence of a completed live run.  
**Value policy:** show only values, timestamps, source labels, and refusals returned during the recorded take.

## Storyboard

| Time | Screen action | Truth guard |
|---|---|---|
| 00:00–00:06 | Show the configured W.E.T. endpoint and its seven anonymous tools. | No login, API key, cookie, or venue credential is present. |
| 00:06–00:15 | Call `wet_benchmark_value`; keep its date, methodology link, refusal state, and attribution visible. | The index leads. Never carry a prior value across a refused close. |
| 00:15–00:25 | Call `wet_search_events` with a bounded query and select one returned event id. | Venue coverage is evidence around an event, not proof of identical settlement terms. |
| 00:25–00:34 | Call `wet_screen_markets` with `limit: 3`; point to outcome, venue, unit, capture time, and source mode. | A dated corpus row is not called live. |
| 00:34–00:43 | Call `wet_event_markets` using the observed event id when its adapter supports drilldown. | If the venue refuses or is unavailable, keep the typed refusal on screen. |
| 00:43–00:51 | Call `wet_cross_venue` with `limit: 1`; show identity provenance, quote basis, and settlement caution together. | Say “gap” or “disagreement,” never executable arbitrage. |
| 00:51–00:55 | Call `wet_event_headlines` and end on its match-quality warning. | Matched context is not evidence that a story caused a move. |

## Read-aloud transcript

Prediction markets are fragmented, so W.E.T. starts with the governed index, not a preferred venue. I’ll ask for published benchmarks first. The returned record keeps its value date, methodology link, and required attribution; if a close was refused, W.E.T. does not carry a prior value forward.

Now I’ll search the event board and screen individual named outcomes. Every displayed probability stays attached to its outcome, venue, unit, and observation basis.

For this selected event, I’ll request a supported live drilldown. If the venue cannot be refreshed, the typed refusal stays on screen instead of becoming a stale quote.

Cross-venue differences come only from W.E.T.’s human-confirmed same-question identities, with quote basis and settlement caution visible. Finally, matched headlines are context, not proof of causation. That is the W.E.T. pattern: indexes lead, markets remain evidence, and unsafe comparisons are withheld.

## Recording checklist

- Start from a clean client and show the endpoint configuration briefly.
- Use ids returned during this take; never paste a saved event id or value from an older run.
- Keep the final recording between 45 and 60 seconds without speeding or cutting out a refusal.
- Save the clean-client NDJSON beside the recording as dated evidence; do not commit volatile output as a timeless fixture.
