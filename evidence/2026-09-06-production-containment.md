# Production MCP containment and directory-discovery record — 2026-09-06

**Evidence class:** production incident containment and external-discovery status. This record does
not establish source rights, launch authorization, full v0.5.0 deployment, a successful client
setup, directory approval, registry publication, or release readiness.

## Incident and containment

Production briefly advertised MCP version `0.5.0` and returned source-derived results even though
the full v0.5.0 candidate and its source-rights release gates had not been authorized. That state
must not be described as an approved launch or as deployment parity with this candidate package.

Emergency containment PR `#165` was merged as
`5eaf5f026491d9ab64ede00234e01a36f6a8ccf9` and deployed at `2026-09-06T05:26:05Z`. The canonical
endpoint now fails closed before MCP discovery, authorization, quota, body parsing, or tool
dispatch. The observed containment contract is:

| Request class | HTTP status | Bounded response |
|---|---:|---|
| Browser/service GET | `503` | JSON-RPC error data code `mcp_release_held` |
| MCP `initialize` POST | `503` | JSON-RPC error data code `mcp_release_held` |
| Sourced `tools/call` POST | `503` | Same release-hold error; no sourced result |

Responses include `Cache-Control: no-store` and `Retry-After: 3600`. They do not expose
`serverInfo`, a tool inventory, market values, index values, or source-derived results. The
live response proves that the environment opt-in is not enabling the route. Keep it unset; it must
not be set to the exact enabling value until the owner, source-rights, deployment, and clean-client
gates all pass.

The candidate's seven-tool behavior is therefore local/preview contract evidence only. In a
controlled candidate environment, six sourced/derived tools return typed `source_rights_pending`
and `wet_resolve` accepts caller-supplied text. None of those tool-level behaviors is currently
available from production because the route-wide hold runs first.

## Registry and directory discovery

- The official MCP Registry had zero W.E.T. records when checked on 2026-09-06. No official-registry
  publication or verified-publisher status is claimed. GitHub Actions workflow `350715290`,
  `Publish Official MCP Registry metadata`, is the only live external MCP publication workflow. It
  was manually disabled, now reports `disabled_manually`, and has zero historical runs. Keep it
  disabled until it uses a protected environment with a required reviewer and an
  environment-scoped publishing key, and every rights and release gate has passed.
- The Gemini CLI extension gallery auto-indexed the public `Corbinvking/wet-mcp` repository through
  its crawler despite no intentional W.E.T. submission. The repository's `gemini-cli-extension`
  discovery topic was removed, but the gallery's cached v0.5.0 entry persisted pending a fresh daily
  crawl and CDN refresh. Recheck after `2026-09-07T05:15:00Z`.
- The crawler-created Gemini entry is not evidence of submission, review, approval, compatibility,
  successful installation, source rights, or launch readiness. Existing clones or installs cannot
  be remotely revoked, which is why the production endpoint must remain fail-closed.
- No other directory acceptance or publication is established by this record.

## Release disposition

The full v0.5.0 candidate remains unshipped and unauthorized. Keep its pull request and all
registry, Docker, plugin, extension-gallery, community-directory, tag, release, and deployment-enable
actions held. A future release requires a new exact-head verification record after all owner and
source-rights gates clear; this containment record cannot be reused as positive launch evidence.
