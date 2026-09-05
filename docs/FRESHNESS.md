# Freshness and quote semantics

Every numerical statement should say what clock it uses.

- **Live venue read:** fetched from the venue during the tool call. Retain the returned observation time.
- **Dated snapshot:** captured at the stated time. It is historical even if the market remains open.
- **Previous close / index close:** a governed dated publication, not a live venue quote.
- **Degraded feed:** the W.E.T. service may be available while one source is stale or unavailable.

Quote basis can be midpoint, last trade, bid, ask, or venue-reported. A wide or one-sided book is not interchangeable with a tight midpoint. A settled price is a result, not a live opinion.

Volume units are source-native. Polymarket-style USD volume and Kalshi-style contract volume are kept separate and are never summed into one total.

Before saying “current” or “live,” refresh the selected event with `wet_event_markets`. Before comparing two venues, use `wet_cross_venue`, which supplies the confirmed identity and comparison basis.

The keyless [service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health) applies source-specific freshness rules; it does not collapse all feeds into one service-up/service-down bit. The human [status page](https://www.worldeventtrading.com/status) is narrower: it reports benchmark-publication state and latest closes.
