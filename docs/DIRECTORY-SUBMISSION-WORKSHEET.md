# Directory submission worksheet

**Status: draft only — no submission, acceptance, approval, or successful client setup is claimed.** Reconfirm every field against the deployed release and the directory's current form immediately before submission.

This worksheet is deliberately source-neutral. Do not add a third-party feed, venue, logo, screenshot, price, market title, or coverage claim unless its public distribution rights and brand use are documented for that exact use.

## Release gate

- [ ] The owner has approved the publisher identity, canonical repository, public license posture, support contact, and final copy.
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
| Release version | `0.5.0` | Reconfirm against the deployed endpoint, tag, and manifests. |
| Category | Analytics / research | Confirm the directory's allowed taxonomy. |
| Transport | Streamable HTTP | [`server.json`](../server.json) |
| MCP endpoint | `https://www.worldeventtrading.com/api/mcp` | Test from a clean client before submission. |
| Product website | `https://www.worldeventtrading.com/mcp` | Confirm public response. |
| Repository | `https://github.com/Corbinvking/wet-mcp` | Owner must confirm this remains canonical. |
| Access | Seven tools are keyless and read-only; six sourced/derived tools are held and `wet_resolve` is usable. | Confirm deployed anonymous inventory, annotations, and policy metadata. |
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

Counts use Unicode code points and include spaces and punctuation. Use the shortest variant that fits the directory field; do not truncate a longer variant automatically.

| Ceiling | Characters | Copy |
|---:|---:|---|
| 50 | 47 | Six sourced tools are held; the resolver works. |
| 60 | 55 | Six sourced tools are held; wet_resolve remains usable. |
| 80 | 75 | Six sourced tools return source_rights_pending; wet_resolve remains usable. |
| 120 | 114 | Phase-1 default-deny holds six sourced tools; wet_resolve parses caller-supplied text without reading W.E.T. data. |
| 160 | 142 | Six W.E.T.-sourced tools return source_rights_pending under a phase-1 default-deny hold; wet_resolve parses only caller-supplied listing text. |
| 250 | 240 | Seven keyless, read-only tools are exposed. Six sourced or derived tools return source_rights_pending under the phase-1 default-deny hold. wet_resolve remains usable only for caller-supplied listing text; credentials cannot bypass the hold. |

## Copy-ready long fields

**What it does**

W.E.T. exposes a seven-tool, keyless, read-only research contract. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six W.E.T.-sourced/derived tools return typed `source_rights_pending` with policy and exclusion metadata and no market or index values. `wet_resolve` remains usable for structural parsing of caller-supplied listing text.

**Why it is useful**

Agents can safely parse caller-supplied listing text with `wet_resolve` and verify that held sourced calls fail closed without leaking values. The server makes important boundaries explicit: structural grouping is not equivalence, typed hold results are not useful sourced answers, and withheld values are not guessed.

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
| CLI extension gallery | Extension manifest, repository, install evidence, safety boundary, and support URL. | Gallery acceptance or successful install until recorded. |
| Community directory | Product name, repository, product URL, 120-character variant, category, keywords, and a dated verification link. | Endorsement, ranking, exhaustive coverage, or directory acceptance. |

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
| _Not submitted_ | _Pending owner approval_ | — | — | Release gate remains open. |

Never convert a completed worksheet into a claim of directory acceptance. Record acceptance only after the directory exposes a verifiable public listing.
