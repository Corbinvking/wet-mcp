# Freshness and quote semantics

The six W.E.T.-sourced/derived public tools currently return typed `source_rights_pending` under default-deny policy `mcp-source-rights/2026-09-05.phase1`; they provide no market or index values to label current, live, dated, or stale. The definitions below govern future rights-cleared output and should not be read as a claim of current sourced availability.

Every numerical statement should say what clock it uses.

- **Live venue read:** fetched from the venue during the tool call. Retain the returned observation time.
- **Dated snapshot:** captured at the stated time. It is historical even if the market remains open.
- **Previous close / index close:** a governed dated publication, not a live venue quote.
- **Degraded feed:** the W.E.T. service may be available while one source is stale or unavailable.

Quote basis can be midpoint, last trade, bid, ask, or venue-reported. A wide or one-sided book is not interchangeable with a tight midpoint. A settled price is a result, not a live opinion.

Volume units are source-native. USD-denominated volume and contract-count volume are kept separate and are never summed into one total.

Before saying “current” or “live” about a future rights-cleared result, require a fresh selected-event result and its observation time. A future numerical comparison also requires confirmed identity and comparison basis. `wet_event_markets` and `wet_cross_venue` are currently held; source health or adapter readability cannot bypass that policy.

The keyless [service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health) applies source-specific freshness rules; it does not collapse all feeds into one service-up/service-down bit or establish source-rights clearance. The human [status page](https://www.worldeventtrading.com/status) is narrower: it reports benchmark-publication state and latest closes.
