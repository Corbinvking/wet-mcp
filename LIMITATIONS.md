# Limitations

This root-level file is a compatibility entry point for reviewers and directories that expect `LIMITATIONS.md` at the package root.

The maintained limitations record is [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md). Read it together with the current public [limitations](https://www.worldeventtrading.com/limitations), keyless [service and feed health](https://www.worldeventtrading.com/api/wet/v1/health), and [benchmark publication status](https://www.worldeventtrading.com/status).

A package, manifest, or directory entry is not evidence that a source is available, fresh, complete, rights-cleared, or suitable for a particular decision.

Production currently returns route-wide HTTP `503`/`mcp_release_held` before discovery or calls. In a controlled candidate environment, default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six W.E.T.-sourced/derived tools return typed `source_rights_pending`; only caller-supplied structural parsing through `wet_resolve` is the candidate exception. An API key, OAuth token, paid tier, adapter, or environment setting cannot bypass either hold.
