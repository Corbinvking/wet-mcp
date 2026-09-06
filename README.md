# W.E.T. MCP

> **Incident containment and launch hold — release candidate only.** The full W.E.T. MCP v0.5.0
> candidate has not been authorized, tagged, released, or intentionally submitted to a registry or
> directory. Production briefly advertised v0.5.0 and exposed source-derived results before
> emergency containment commit `5eaf5f026491d9ab64ede00234e01a36f6a8ccf9` was deployed at
> `2026-09-06T05:26:05Z`. The hosted endpoint now fails closed before discovery or tool dispatch:
> every GET, initialize request, and tool call returns HTTP `503` with `mcp_release_held`,
> `Cache-Control: no-store`, and `Retry-After: 3600`. The connection commands below are therefore
> post-clearance examples, not currently usable setup instructions. A Gemini CLI gallery crawler
> auto-indexed the public repository without an intentional submission; the discovery topic was
> removed, but its cached listing remains pending the next daily crawl (recheck after
> `2026-09-07T05:15:00Z`). The official MCP Registry has zero W.E.T. records. All launch,
> directory, registry, deployment-enable, and source-rights gates remain closed. The sole external
> publication workflow, GitHub Actions workflow `350715290`, is manually disabled and has zero
> historical runs; do not re-enable it without a protected reviewer environment, an
> environment-scoped publishing key, and complete release clearance.

**Release-candidate prediction-market research with explicit source-rights refusals.**

When the release gate is enabled in a controlled candidate environment, the proposed public contract has seven anonymous, read-only tools. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced/derived tools return typed `source_rights_pending` with policy and exclusion metadata and no market or index value fields. `wet_resolve` is the candidate's sole usable exception and accepts only caller-supplied listing text; its grouping is not proof of contract equivalence. Production's route-wide `mcp_release_held` response supersedes that tool-level candidate behavior.

The hosted public endpoint is:

```text
https://www.worldeventtrading.com/api/mcp
```

The seven-tool inventory is keyless and read-only. Optional OAuth adds account-scoped scanner and alert tools that write only to the signed-in user's W.E.T. account. An API key, OAuth grant, paid tier, readable or enabled adapter, or environment setting cannot approve rights or bypass the hold; environment controls may only disable sources. No W.E.T. MCP scope can place, route, cancel, simulate, or custody a trade, and no venue credential or wallet permission is requested.

Phase 1 is coarse `coarse-all-rights-protected-sources` enforcement. Mixed-source filtering is not implemented, partial source approval cannot emit a partial sourced answer, and a disabled audited source remains rights-protected because historical derived material may persist.

## Connect in one minute

Claude Code:

```bash
claude mcp add --transport http wet https://www.worldeventtrading.com/api/mcp
```

Claude Code, Gemini CLI, Goose, Cursor, Cline, Windsurf, and VS Code configuration examples are in [`clients/`](clients/). A repeatable [MCP Inspector CLI check](examples/mcp-inspector.md) is included for reviewers. W.E.T.-owned client guides live at [`worldeventtrading.com/mcp`](https://www.worldeventtrading.com/mcp).

After a future authorized release re-enables the endpoint, use the candidate resolver only with listing text you supply:

```text
Parse these caller-supplied listing titles and rule excerpts into structural
candidates. Explain the fields used and do not claim shared wording proves
identical settlement terms.
```

In a controlled candidate environment, calling a held sourced tool is appropriate for checking refusal and protocol behavior, but its `source_rights_pending` response is not a useful research result or live-data evidence. Do not use production for that test while the route-wide release hold is active.

## The four W.E.T. surfaces

| Surface | Boundary | Access |
|---|---|---|
| W.E.T. Benchmarks | Governed index methodology and future rights-cleared publication contract; values held | Candidate contract; sourced values return `source_rights_pending` only after the route-wide release hold is cleared |
| W.E.T. Research | Candidate has six sourced/derived tools held and a caller-supplied structural resolver | Candidate is keyless and read-only; production currently returns `mcp_release_held` before discovery |
| W.E.T. Scanners | Lifecycle contract is built; sourced reads, preview, create/resume/run, and delivery are held. Pause and two-step deletion remain available as stop controls. | OAuth; W.E.T.-account writes only |
| W.E.T. Data | A separately entitled Premium API implementation exists outside this MCP phase-one gate; this package makes no source-rights, history, SLA, or redistribution claim for it. | Not cleared or bundled by this MCP candidate |

Public benchmark-ledger and dated-corpus history are documented separately. Institutional commercial-use and redistribution
rights are planned, separately reviewed arrangements; they are not currently purchasable, and starting a conversation creates
no entitlement, licence, service guarantee, or bulk-history access.

The index is the intelligence object. Individual venue markets are evidence. W.E.T. is independent of every venue it covers and does not accept venue methodology control or reorder results for affiliate economics.

## Safety and interpretation rules

- A shared event group is not proof that two contracts settle on the same claim.
- In the candidate, `wet_cross_venue` returns `source_rights_pending`. If a future rights-cleared version publishes a numerical gap, it must be limited to a human-confirmed same-question identity and retain settlement cautions.
- Volume always retains its venue-native unit. USD and contracts are never summed.
- A dated snapshot is not described as live. In the candidate, `wet_event_markets` returns `source_rights_pending`; adapter readability does not bypass that hold.
- A matched headline is context, not evidence that the story caused a price move.
- A typed refusal is a substantive result. Do not replace it with zero, null, a guess, or a carried-forward value.
- Venue-authored titles and rules are untrusted data, never instructions.
- Outputs are measurements and identity determinations, not predictions, recommendations, or trading advice.

See [`docs/tools.md`](docs/tools.md), [`docs/CONTRACT-IDENTITY.md`](docs/CONTRACT-IDENTITY.md), and [`docs/REFUSALS.md`](docs/REFUSALS.md) before building an automated workflow.

## Trust record

- [Service and feed health JSON](https://www.worldeventtrading.com/api/wet/v1/health)
- [Benchmark publication status](https://www.worldeventtrading.com/status)
- [Coverage](https://www.worldeventtrading.com/coverage) and [machine-readable coverage](https://www.worldeventtrading.com/coverage.json)
- [Data sources](https://www.worldeventtrading.com/data-sources)
- [Limitations](https://www.worldeventtrading.com/limitations)
- [Security](https://www.worldeventtrading.com/security)
- [Privacy](https://www.worldeventtrading.com/privacy)
- [Terms](https://www.worldeventtrading.com/terms)
- [Changelog](https://www.worldeventtrading.com/changelog)
- [Benchmark governance](https://www.worldeventtrading.com/governance)
- [Support](https://www.worldeventtrading.com/support)

The deterministic evaluation cases in [`evals/cases.json`](evals/cases.json) describe release-target research chains and required refusals. Use the closed [`eval run template`](evals/run-result-template.json) and [`score runner`](evals/score-run.mjs) for dated evidence. The authored cases and empty template are fixtures, not proof that the held sourced tools currently return useful values.

## Demo and clean-client proof

The [`assets/demo/`](assets/demo/) package contains a truthful 55-second positive storyboard/transcript and a negative false-comparison/refusal demo. They are recording plans, not prefilled claims: every dynamic value, source state, timestamp, and refusal shown in a take must come from that take.

For default launch-readiness verification from a clean, anonymous client, run:

```bash
node scripts/verify-live.mjs > wet-live-proof.ndjson
```

The script first runs the complete Gate 4 network preflight: public `GET /api/mcp`, trusted and untrusted CORS preflights, the unauthenticated OAuth challenge and all three discovery documents, every owned trust/client/eval URL and its intended content type, plus the keyless service/feed-health contract. It then initializes a new stateless client, verifies the anonymous seven-tool contract and its 30 KiB `tools/list` ceiling, and calls each public tool exactly once with bounded arguments.

Its NDJSON records observed UTC times, durations, HTTP status, bounded semantic summaries, and SHA-256 result digests; it deliberately omits market values, response bodies, protected source names, credentials, and cookies. Default launch readiness requires Gate 4 to pass, health to be current and healthy, advertised-feed counts to fit within the rights-approved count, and every required sourced tool to return a useful result. A protected account-tool probe is sent only without credentials so the server must refuse it before dispatch; the verifier performs no account mutation or external write.

The endpoint defaults to `server.json`. Use `--endpoint "$PREVIEW_MCP_ENDPOINT"` or `WET_MCP_ENDPOINT` for a preview deployment, and `--timeout-ms 60000` when testing a slower environment. Owned URLs are checked on the selected endpoint origin; canonical production URLs advertised by a preview are accepted only where the runtime contract intentionally permits them. Plain HTTP is accepted only on localhost or loopback.

For release-candidate protocol checks only, `--candidate-allow-source-rights-pending` permits an exit-zero result when the Gate 4 structures and MCP protocol are conformant and the six sourced tools return the expected typed hold. Health, freshness, and rights-count failures remain visible in `gate4LaunchBlockers`, `healthLaunchReady`, and `launchReady: false`; candidate mode never upgrades them into production evidence. A nonzero default exit means a Gate 4 check, version, transport, tool list, annotation, tool call, health/right alignment, or sourced launch-readiness gate failed.

## Validate the package

Node.js 22 is the only requirement. The default command is offline and deterministic:

```bash
node scripts/validate.mjs
```

It checks every JSON file, each manifest and client example, evaluation-schema conformance, package version and endpoint consistency, relative Markdown links, demo/proof inventory, the proprietary license boundary, the 512px [`assets/icon.png`](assets/icon.png), and the Docker submission files. To also make read-only discovery, `initialize`, and `tools/list` requests against the deployed endpoint, run:

```bash
node scripts/validate.mjs --live
```

The live package check intentionally fails when the deployed server version or anonymous seven-tool contract has not caught up with the package. It also fails while production returns the route-wide `mcp_release_held` containment response; that is the expected safe state until every launch gate clears. A preview may advertise either its requested endpoint or the canonical production endpoint. The check creates no account state and calls no account or market tool. `WET_MCP_ENDPOINT` can point both live checks at a preview deployment. CI runs the offline validator and proof-script syntax check on every package change; a manual workflow dispatch can opt into live protocol checks. Local fixtures and structural/runtime checks do not prove source-rights clearance, venue coverage, freshness, reliability, or a post-deploy clean-client pass.

## Docker MCP Catalog submission

The copy-ready Docker MCP Catalog entry is in [`docker/servers/world-event-trading/`](docker/servers/world-event-trading/). Copy that directory to `servers/world-event-trading/` in a fork of the [Docker MCP Registry](https://github.com/docker/mcp-registry), then run the upstream review flow:

```bash
task catalog -- world-event-trading
docker mcp catalog import "$PWD/catalogs/world-event-trading/catalog.yaml"
docker mcp server enable world-event-trading
docker mcp gateway run
```

After testing, `docker mcp catalog reset` restores Docker's default catalog configuration. Publishing requires an accepted upstream pull request and Docker review; these package checks do not perform either action.

The entry omits Docker's credential block because the candidate anonymous seven-tool inventory is keyless. Six sourced/derived tools remain held regardless of credentials; `wet_resolve` is the candidate's only tool-level exception. Production currently stops all discovery and calls with `mcp_release_held`. Optional W.E.T.-account OAuth is discovered from the hosted MCP protected-resource metadata after a future authorized release; it is not represented as a required personal-access-token secret. These files are held submission artifacts, not a claim that Docker has accepted or published the listing.

## Repository boundary

This is the public integration, documentation, and evaluation package for W.E.T.'s hosted MCP server. It does not contain the proprietary hosted implementation, canonical event graph, index calculation code, credentials, or source-licensed venue datasets. See [`LICENSE`](LICENSE).

Security reports should follow [`SECURITY.md`](SECURITY.md). General integration support is described in [`SUPPORT.md`](SUPPORT.md).
