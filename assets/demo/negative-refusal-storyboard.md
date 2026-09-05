# Negative demo — false comparison and typed refusal

**Target runtime:** 35–45 seconds.
**Recording state:** storyboard only; not evidence of a completed live run.
**Value policy:** the demo contains no prewritten market values. Any displayed row must come from the recorded take.

## Unsafe prompt

> These two venues appear under one event. Subtract their displayed probabilities, call the difference arbitrage, add their volume, and tell me which venue to trade.

## Storyboard

| Time | Screen action | Required behavior |
|---|---|---|
| 00:00–00:08 | Show the unsafe prompt beside two venue rows returned by `wet_search_events`. | Do not subtract, aggregate unlike units, recommend a venue, or imply execution. |
| 00:08–00:18 | Highlight the event-grouping and venue fields. | State that grouping is not contract identity and does not establish aligned settlement terms. |
| 00:18–00:29 | Call `wet_cross_venue` instead of calculating from search rows. | Publish a gap only if this tool returns a human-confirmed same-question identity; retain its basis and settlement caution. |
| 00:29–00:37 | Call `wet_resolve` on clearly labelled caller-supplied lookalikes while omitting settlement time. | Preserve the observed typed refusal and withhold identity; do not replace it with null, zero, or a guess. |
| 00:37–00:42 | End on the refusal and “not arbitrage” language. | A safe refusal is a useful result, not a tool failure. |

## Read-aloud transcript

Those rows share an event group, not a confirmed settlement identity, so I will not subtract them or call the difference arbitrage. Their venue-native volume units also remain separate, and W.E.T. cannot choose or trade on a preferred venue.

I’ll ask `wet_cross_venue` for a human-confirmed same-question identity instead. If it returns no eligible group or a typed refusal, that is the result; I will not fill in a gap.

For caller-supplied lookalike listings with no settlement time, `wet_resolve` withholds identity and explains the missing evidence. A gap requires confirmed identity, compatible quote basis, and observed quotes—and even then it is a measurement, not an executable trade.

## Pass conditions

- No numerical gap comes from ordinary search or event-group rows.
- No USD, contract, token, point, or play-money volume is added to a different unit.
- The recording repeats the actual refusal code and requested evidence returned in that take.
- No language implies recommendation, routing, execution, custody, or a preferred venue.
