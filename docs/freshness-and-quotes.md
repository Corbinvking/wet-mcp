# Freshness and quote semantics compatibility entry point

The maintained freshness and quote-semantics record is [`FRESHNESS.md`](FRESHNESS.md). Retain the observation time, quote basis, lifecycle state, quality, and source-native unit. Never relabel a dated observation as current without a supported refresh.

Production currently returns route-wide HTTP `503`/`mcp_release_held`. In a controlled candidate environment, the six sourced/derived public tools return `source_rights_pending` under policy `mcp-source-rights/2026-09-05.phase1`; these quote rules do not claim current value availability.

Check keyless [service and feed health](https://www.worldeventtrading.com/api/wet/v1/health) before relying on changing source state. [Benchmark publication status](https://www.worldeventtrading.com/status) is a narrower record, not general service health.
