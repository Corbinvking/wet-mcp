# Directory submission worksheet

**Status: draft only for the MCP destinations below — no submission by W.E.T. to those destinations is claimed.** No acceptance, approval, or successful client setup is claimed. A Gemini CLI gallery crawler auto-indexed the public repository without an intentional submission. Its cached listing still appeared after the repository discovery topic was removed and must be rechecked after `2026-09-07T05:15:00Z`. A separate legacy W.E.T.-authored prediction-market catalog PR is recorded in the submission log; it is open but unmerged and is not compatible with current launch copy. The official MCP Registry has zero W.E.T. records. Production is route-wide held at HTTP `503`/`mcp_release_held`; do not submit any draft below. Reconfirm every field against a future authorized deployment and the directory's then-current form immediately before submission.

This worksheet is deliberately source-neutral. Do not add a third-party feed, venue, logo, screenshot, price, market title, or coverage claim unless its public distribution rights and brand use are documented for that exact use.

## Release gate

- [ ] The owner has approved the publisher identity, canonical repository, public license posture, support contact, and final copy.
- [ ] Emergency containment has been explicitly cleared and production no longer returns route-wide `mcp_release_held`.
- [ ] Official MCP Registry publication workflow `350715290` remains manual-only and has protected `main`, a protected environment, a required owner reviewer, and `MCP_REGISTRY_ENV_PRIVATE_KEY` stored only in that environment before it is re-enabled.
- [ ] Every publicly exposed source is rights-cleared under the active policy. If a source is
      disabled, source-aware filtering and a lineage purge/rebuild prove that none of its current or
      historical derived material survives; an adapter toggle alone does not pass this item.
- [ ] The version below matches the deployed endpoint, manifests, tag, and release.
- [ ] Anonymous initialization, tool discovery, all public tools, and required refusals pass from a clean client.
- [ ] Security, privacy, terms, support, data-source, limitation, coverage, and health URLs return the expected public response.
- [ ] Any platform terms, identity checks, and account-bound attestations were completed by the authorized owner.

Unchecked boxes are blockers, not optional notes.

## Core directory fields

| Field | Draft value | Verification source |
|---|---|---|
| Product name | W.E.T. Prediction-Market Intelligence | [`server.json`](../server.json) |
| Package identifier | `com.worldeventtrading/prediction-markets` | [`server.json`](../server.json) |
| Release version | `0.7.0` | Reconfirm against the deployed endpoint, tag, and manifests. |
| Category | Analytics / research | Confirm the directory's allowed taxonomy. |
| Transport | Streamable HTTP | [`server.json`](../server.json) |
| MCP endpoint | `https://www.worldeventtrading.com/api/mcp` | Currently route-wide held at HTTP `503`/`mcp_release_held`; test from a clean client only after authorization. |
| Product website | `https://www.worldeventtrading.com/mcp` | Confirm public response. |
| Repository | `https://github.com/Corbinvking/wet-mcp` | Owner must confirm this remains canonical. |
| Access | Candidate proposes seven keyless, read-only tools; six sourced/derived tools are held and `wet_resolve` is the candidate exception. | Not deployed as an enabled contract; production currently refuses before discovery. |
| Optional authorization | OAuth is optional for account-scoped W.E.T. scanner and alert features. | Confirm discovery and least-scope behavior. |
| Execution boundary | No order placement, routing, cancellation, custody, wallet access, or personalized trading advice. | Confirm tool inventory, terms, and refusal evals. |
| License | `LicenseRef-WET-Integration-1.0`; proprietary package license. | [`LICENSE`](../LICENSE); owner must confirm directory compatibility. |
| 512px icon | [`assets/icon.png`](../assets/icon.png) | PNG, 512×512. |
| Cline icon | [`assets/cline-icon-400.png`](../assets/cline-icon-400.png) | PNG, 400×400, resized from the 512px brand asset. |
| Configuration examples | [`examples/client-configurations.md`](../examples/client-configurations.md) | Reconfirm steps in a clean client. |
| Evaluation fixtures | [`evals/cases.json`](../evals/cases.json) | See [`evals/VIEWS.md`](../evals/VIEWS.md). |
| Data sources | [`DATA-SOURCES.md`](../DATA-SOURCES.md) | Reconfirm runtime coverage and rights state. |
| Limitations | [`LIMITATIONS.md`](../LIMITATIONS.md) | Reconfirm against deployed behavior. |
| Coverage | [`docs/coverage.md`](coverage.md) | Use runtime records; do not paste a static source list. |
| Security | `https://www.worldeventtrading.com/security` | Confirm public response. |
| Privacy | `https://www.worldeventtrading.com/privacy` | Confirm public response. |
| Terms | `https://www.worldeventtrading.com/terms` | Confirm public response. |
| Support | `https://www.worldeventtrading.com/support` | Owner must approve the public contact. |
| Health | `https://www.worldeventtrading.com/api/wet/v1/health` | Confirm advertised coverage matches healthy, rights-cleared coverage. |

## Character-limited copy variants

Counts use Unicode code points and include spaces and punctuation. These are post-clearance candidate drafts, not current production descriptions. Do not publish them while the route-wide release hold is active. Use the shortest variant that fits a future directory field; do not truncate a longer variant automatically.

| Ceiling | Characters | Copy |
|---:|---:|---|
| 50 | 47 | Six sourced tools are held; the resolver works. |
| 60 | 55 | Six sourced tools are held; wet_resolve remains usable. |
| 80 | 75 | Six sourced tools return source_rights_pending; wet_resolve remains usable. |
| 120 | 114 | Phase-1 default-deny holds six sourced tools; wet_resolve parses caller-supplied text without reading W.E.T. data. |
| 160 | 142 | Six W.E.T.-sourced tools return source_rights_pending under a phase-1 default-deny hold; wet_resolve parses only caller-supplied listing text. |
| 250 | 240 | Seven keyless, read-only tools are exposed. Six sourced or derived tools return source_rights_pending under the phase-1 default-deny hold. wet_resolve remains usable only for caller-supplied listing text; credentials cannot bypass the hold. |

## Copy-ready long fields

**What it does — post-clearance draft**

The v0.7.0 candidate proposes a seven-tool, keyless, read-only research contract. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced/derived tools return typed `source_rights_pending` with policy and exclusion metadata and no market or index values. `wet_resolve` is the candidate's structural parser for caller-supplied listing text. Production currently returns route-wide `mcp_release_held` before any of those tools are discovered or called.

**Why it is useful**

After a future authorized release, agents could safely parse caller-supplied listing text with `wet_resolve` and verify that held sourced calls fail closed without leaking values. While emergency containment is active, the hosted endpoint instead fails closed at the route boundary. The candidate makes important boundaries explicit: structural grouping is not equivalence, typed hold results are not useful sourced answers, and withheld values are not guessed.

**Safety and permissions**

The seven public tools are keyless, read-only, and non-destructive. Six sourced/derived tools are held; the caller-supplied resolver remains usable. Optional OAuth is limited to W.E.T.-account scanner and alert features; 14 source-derived watchlist-event, scanner, and alert tools independently return `account_output_contract_pending` and scanner execution also requires venue plus headline-source rights. The integration has no order-flow, wallet, custody, third-party account, or personalized-advice capability, and shared client examples grant no automatic write approval.

**Starter prompts**

```text
Parse these caller-supplied listing titles and rule excerpts into structural candidates. Explain the fields used and do not claim that similar wording proves identical settlement terms.
```

```text
Call one held sourced tool and preserve its source_rights_pending code, policy, and exclusions. Confirm that no market or index value field is emitted, and do not retry with credentials.
```

```text
Explain why local fixtures, protocol checks, and a source_rights_pending result do not establish source-rights clearance, coverage, freshness, reliability, or a clean production pass.
```

## Submission-specific mapping

| Destination | Paste or attach | Do not claim yet |
|---|---|---|
| Official MCP Registry | Validate and publish [`server.json`](../server.json) only after the release gate passes. | Registry publication or verified-publisher status. |
| Cline marketplace issue | Repository URL, [`400×400 PNG`](../assets/cline-icon-400.png), the “Why it is useful” copy, and a dated clean-setup evidence link. | Successful setup until a clean Cline run is recorded. |
| Docker catalog pull request | Copy [`docker/servers/world-event-trading/`](../docker/servers/world-event-trading/) and attach upstream task-test evidence. | Catalog acceptance, review, or availability. |
| Plugin marketplace | Product name, compatible character variant, endpoint, repository, permissions, trust URLs, and license. | Compatibility with marketplace licensing until the owner confirms it. |
| CLI extension gallery | Do not submit. The Gemini CLI gallery auto-indexed the public repository; monitor removal after its next daily crawl. | Do not call the crawler-created cached entry an intentional submission, approval, or successful install. |
| Community directory | Product name, repository, product URL, 120-character variant, category, keywords, and a dated verification link. | Endorsement, ranking, exhaustive coverage, or directory acceptance. |

## Destination-specific unsent readiness

These destination records are intentionally inert. `HELD_UNSENT` means preparation is blocked from submission; `READY_OWNER_ACTION_TIME_SEND_CONFIRMATION` means a narrow eligibility inquiry is prepared but not authorized or sent; `BLOCKED_ELIGIBILITY` applies to the actual listing unless an affirmative written preflight response clears it; `AUTO_INDEX_MONITOR_ONLY` is observation of an unsolicited crawler result, not a submission path; `LEGACY_OPEN_PR_RECONCILIATION_REQUIRED` identifies a pre-existing external PR that must not merge as written; and `SKIPPED` means no submission is planned. Empty value cells and unchecked boxes are mandatory until the owner separately authorizes action for that exact destination at action time. Completing a global release gate does not authorize any destination action.

### Official MCP Registry

Destination constraint: keep workflow `350715290` disabled until the protected environment, required reviewer, environment-scoped publishing key, release, and separate action-time authorization gates all pass.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Claude Connector

Destination constraint: the authorized owner must reconfirm the exact connector metadata and current platform terms before any submission action.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Cline

Destination constraint: require the destination-specific icon, final copy, and a dated clean-client setup record before action-time review.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Docker

Destination constraint: require the upstream package shape and task-test evidence to be revalidated against the deployed release before action-time review.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Smithery

Destination constraint: account-bound identity or repository authorization must be completed only by the authorized owner after current terms review.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Glama

Destination constraint: account-bound identity or repository authorization must be completed only by the authorized owner after current terms review.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### MCP.Directory

Destination constraint: reconfirm the destination's current metadata, ownership, and terms requirements immediately before any separately authorized action.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### MCP Central

Destination constraint: reconfirm the destination's current metadata, ownership, and terms requirements immediately before any separately authorized action.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### MCP.so

Destination constraint: reconfirm the destination's current metadata, ownership, and terms requirements immediately before any separately authorized action.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### PulseMCP

Destination constraint: reconfirm the destination's current metadata, ownership, and terms requirements immediately before any separately authorized action.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### awesome-mcp-servers

Destination constraint: any repository change or pull request requires separate owner authorization and must not be treated as accepted until independently evidenced.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `HELD_UNSENT` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### OpenAI eligibility

Destination constraint: this is an eligibility inquiry only. An affirmative written eligibility answer would not authorize a listing submission or acceptance of terms.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `READY_OWNER_ACTION_TIME_SEND_CONFIRMATION` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Gemini CLI gallery

Destination constraint: monitor the unsolicited crawler-created entry only. Do not submit, claim ownership of the crawler action, or convert monitoring into a submission workflow.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `AUTO_INDEX_MONITOR_ONLY` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Cursor

Destination constraint: this destination is deliberately skipped. Retaining blank fields prevents a skipped record from being mistaken for readiness or submission evidence.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `SKIPPED` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

### Claude Plugin

Destination constraint: this destination is deliberately skipped. Retaining blank fields prevents a skipped record from being mistaken for readiness or submission evidence.

| Readiness field | Ready | Value |
|---|:---:|---|
| Status | — | `SKIPPED` |
| Deployment SHA | [ ] | |
| Release version | [ ] | |
| Canonical endpoint | [ ] | |
| Owner / publisher identity | [ ] | |
| Destination terms | [ ] | |
| Separate action-time authorization | [ ] | |
| Submitted UTC | [ ] | |
| Receipt / evidence | [ ] | |

## Channel-specific owned landing links

Use the matching URL as the listing's website/docs field. The owned site records these bounded UTM
fields and first-touch attribution; MCP calls separately record client name/version. Do not join the
two streams with an IP address or claim an install from a page view.

| Destination | Owned landing link |
|---|---|
| Official MCP Registry | `https://www.worldeventtrading.com/mcp?utm_source=mcp_registry&utm_medium=registry&utm_campaign=mcp_launch` |
| Claude | `https://www.worldeventtrading.com/mcp/claude?utm_source=claude&utm_medium=directory&utm_campaign=mcp_launch` |
| Cursor | `https://www.worldeventtrading.com/mcp/cursor?utm_source=cursor&utm_medium=directory&utm_campaign=mcp_launch` |
| Cline | `https://www.worldeventtrading.com/mcp/cline?utm_source=cline&utm_medium=directory&utm_campaign=mcp_launch` |
| Docker catalog | `https://www.worldeventtrading.com/mcp?utm_source=docker&utm_medium=directory&utm_campaign=mcp_launch` |
| CLI extension gallery | `https://www.worldeventtrading.com/mcp/gemini-cli?utm_source=gemini_cli&utm_medium=directory&utm_campaign=mcp_launch` |
| Smithery | `https://www.worldeventtrading.com/mcp?utm_source=smithery&utm_medium=directory&utm_campaign=mcp_launch` |
| Glama | `https://www.worldeventtrading.com/mcp?utm_source=glama&utm_medium=directory&utm_campaign=mcp_launch` |
| MCP.Directory | `https://www.worldeventtrading.com/mcp?utm_source=mcp_directory&utm_medium=directory&utm_campaign=mcp_launch` |
| MCP Central | `https://www.worldeventtrading.com/mcp?utm_source=mcp_central&utm_medium=directory&utm_campaign=mcp_launch` |
| MCP.so | `https://www.worldeventtrading.com/mcp?utm_source=mcp_so&utm_medium=directory&utm_campaign=mcp_launch` |
| PulseMCP | `https://www.worldeventtrading.com/mcp?utm_source=pulsemcp&utm_medium=directory&utm_campaign=mcp_launch` |
| awesome-mcp-servers | `https://www.worldeventtrading.com/mcp?utm_source=awesome_mcp_servers&utm_medium=repository&utm_campaign=mcp_launch` |
| OpenAI eligibility/submission | `https://www.worldeventtrading.com/mcp/chatgpt?utm_source=openai&utm_medium=directory&utm_campaign=mcp_launch` |
| GitHub repository/community | `https://www.worldeventtrading.com/mcp?utm_source=github&utm_medium=repository&utm_campaign=mcp_launch` |

## Evidence placeholders

| Evidence | Required record |
|---|---|
| Deployment parity | `[UTC time] [endpoint] [server version] [manifest version] [result URL or hash]` |
| Clean-client setup | `[UTC time] [client + version] [fresh profile] [tool count] [result URL or hash]` |
| Positive eval | `[UTC time] [client/model] [case ids] [per-assertion result] [score]` |
| Negative eval | `[UTC time] [client/model] [case ids] [per-assertion result] [score]` |
| Inspector review | `[UTC time] [initialize] [tools/list] [positive call] [typed refusal] [redacted artifact]` |
| Directory submission | `[destination] [publisher identity] [submitted UTC] [submission URL] [status]` |

## Submission log

| Destination | Publisher | Submitted UTC | URL | Status / next review |
|---|---|---|---|---|
| Official MCP Registry | _Not submitted_ | — | — | `HELD_UNSENT`; zero W.E.T. records observed. Workflow `350715290` remains disabled pending all gates. |
| Claude Connector | _Not submitted_ | — | — | `HELD_UNSENT`; owner identity, current terms, and action-time authorization remain open. |
| Cline | _Not submitted_ | — | — | `HELD_UNSENT`; release and clean-client gates remain open. |
| Docker | _Not submitted_ | — | — | `HELD_UNSENT`; release and upstream task-test gates remain open. |
| Smithery | _Not submitted_ | — | — | `HELD_UNSENT`; owner identity, current terms, and action-time authorization remain open. |
| Glama | _Not submitted_ | — | — | `HELD_UNSENT`; owner identity, current terms, and action-time authorization remain open. |
| MCP.Directory | _Not submitted_ | — | — | `HELD_UNSENT`; destination requirements and all action gates remain open. |
| MCP Central | _Not submitted_ | — | — | `HELD_UNSENT`; destination requirements and all action gates remain open. |
| MCP.so | _Not submitted_ | — | — | `HELD_UNSENT`; destination requirements and all action gates remain open. |
| PulseMCP | _Not submitted_ | — | — | `HELD_UNSENT`; destination requirements and all action gates remain open. |
| awesome-mcp-servers | _Not submitted_ | — | — | `HELD_UNSENT`; no repository change or pull request is authorized. |
| OpenAI eligibility | _Not submitted_ | — | — | `READY_OWNER_ACTION_TIME_SEND_CONFIRMATION`; the narrow inquiry is prepared, but no transmission is authorized or claimed. The actual listing remains `BLOCKED_ELIGIBILITY`. |
| Gemini CLI gallery | Automated crawler; no intentional W.E.T. submission | — | — | `AUTO_INDEX_MONITOR_ONLY`; recheck the cached crawler result after `2026-09-07T05:15:00Z`. |
| Awesome Prediction Market Tools (`aarora4`) | `Corbinvking` | `2026-07-13T22:31:18Z` | `https://github.com/aarora4/Awesome-Prediction-Market-Tools/pull/145` | `LEGACY_OPEN_PR_RECONCILIATION_REQUIRED`; open, non-draft, unmerged, and merge-conflicting. Its Aggregator/inferred-divergence copy must not merge as written. Owner action-time authorization is required to close it or replace it with index-led, confirmed-identity-only analytics/research copy. |
| Cursor | _Not submitted_ | — | — | `SKIPPED`; no submission is planned. |
| Claude Plugin | _Not submitted_ | — | — | `SKIPPED`; no submission is planned. |

An unsolicited crawler listing is a public listing fact, not proof of intentional submission, review, approval, compatibility, or successful installation. Never convert a completed worksheet into a claim of directory acceptance. Record directory acceptance only after the directory provides verifiable evidence of its own review or acceptance process.
