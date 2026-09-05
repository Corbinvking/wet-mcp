# Release-candidate offline/local conformance — 2026-09-05

Local code-freeze status: **COMPLETE**. External release sync and launch status: **NOT COMPLETE**.

**Evidence class:** local, deterministic candidate checks and bounded local protocol observations. **This is not production evidence, not a public clean-client run, not an independent audit, not a directory acceptance, and not proof of data rights.** It does not establish public-repository parity, deployed endpoint parity, source health, source-rights clearance, or launch readiness.

The results below were recorded against the clean `codex/mcp-launch-package` application code freeze
`e9dc1bc194783102b7ea88969d124f62c4cce8a6`, confirmed at
`2026-09-05T12:40:52.679Z`. Each count is the result reported by that named local suite after final
confirmation. A passing local suite establishes only its stated boundary; it does not promote this
commit into a deployed release or convert a typed hold into useful sourced output.

## Current local automated results

| Scope | Command | Recorded result | Evidence boundary |
|---|---|---:|---|
| MCP contract | `npm run mcp:verify` | 283/283 passed | Local implementation semantics only. |
| Source-rights contract | `npm run mcp:source-rights:verify` | 109/109 passed | Local default-deny, named-reviewer/instant, exact source-binding, historical-output, lineage, and non-bypass assertions only. |
| MCP route | `npm run mcp:route:check` | 97/97 passed | Local route harness only. |
| OAuth | `npm run oauth:verify` | 72/72 passed | Local discovery, scope, rotation, and error semantics only. |
| Account API | `npm run account:verify` | 90/90 passed | Local account API harness only. |
| Account deletion | `npm run account:delete:verify` | 44/44 passed | Local deletion contract only; no production deletion occurred. |
| Alerts | `npm run alerts:verify` | 84/84 passed | Local alert semantics and transactional rights rechecks only; no delivery or production account action occurred. |
| Scanner contract | `npm run scanners:verify` | 371/371 passed | Local scanner contract, atomic growth limits, unmetered owner-scoped stop controls, scheduler health, and refusal semantics only. |
| Scanner lifecycle (static) | `npm run scanners:lifecycle:verify` | 223/223 passed | Static/local lifecycle, retention, one-live-run, and rights-boundary invariants only. |
| Scanner lifecycle (fresh isolated PostgreSQL) | `npm run scanners:lifecycle:db:verify` | 95/95 passed | Fresh isolated PostgreSQL, including concurrent one-live-run claims, account-erasure lock proof, retention exceptions, and rights transitions; temporary test data only, not production. |
| Browser scanner routes (fresh isolated PostgreSQL) | `npm run scanners:browser-route:db:verify` | 53/53 passed | Actual browser HTTP route lifecycle, revision/reload handshake, idempotency, rate limiting, and owner isolation against temporary test data only. |
| Public proof surfaces | `npm run mcp:public-proof:verify` | 24/24 passed | Local source and route assertions only. |
| Playbook gaps | `npm run mcp:playbook:gaps:verify` | 11/11 passed | Local checks that required launch gates remain explicit. |
| Output schemas | `npm run mcp:outputschema:verify` | 77/77 passed | Local schema and refusal-shape assertions only. |
| Public surface | `npm run public:surface:verify` | 194/194 passed | Local source/copy consistency only. |
| Health semantics | `npm run health:semantics:verify` | 38/38 passed | Local health contract semantics, not evidence of healthy production feeds. |
| Distribution snapshot | `npm run distribution:snapshot:verify` | 38/38 passed | Local snapshot consistency only. |
| Doctrine | `npm run doctrine:verify` | 112/112 passed | Static neutrality and product-doctrine assertions only. |
| Market-volume semantics | `npm run market:volume:verify` | 72/72 passed | Local unit and aggregation semantics only. |
| Prediction generator self-check | `npm run predictions:generate -- --self-check` | 17/17 passed | Offline fixtures only; no network generation or corpus refresh. |
| Prediction matchup | `npm run predictions:matchup:verify` | 10/10 passed | Local matchup identity assertions only. |
| API semantics | `npm run api:semantics:verify` | 160/160 passed | Local API harness only. |
| Migration runner self-check | `node scripts/apply-migrations.mjs --self-check` | 8/8 passed | Strict-plan fixtures only; no database migration was applied. |
| Billing migration precursor gate | `npm run billing:migration:precursor-verify` | 23/23 passed | Static precursor-safe migration/workflow fixtures only. |
| Billing migration runtime gate | `npm run billing:migration:verify` | 23/23 passed | Runtime schema-parity fixtures only; no production database migration was applied. |
| Schema drift | `npm run schema:drift:verify` | 7/7 passed | Migration/Drizzle parity for the reviewed schema only. |
| Public package | `node distribution/wet-mcp/scripts/validate.mjs` | 38/38 passed | Separate offline invocation; the validator deliberately does not assert its own pass total. |
| Changed-file ESLint | local ESLint over every changed JavaScript/TypeScript file | exit 0 | Scoped candidate regression check. Repository-wide lint has inherited failures described below. |
| Credential pattern scan | filename-only high-confidence scan over all 39 changed/untracked files | 0 findings | Local heuristic only; GitGuardian/CI remains required. |
| TypeScript | `npm run index:ci:types` | exit 0 | Local compile-time contract only. |
| Production build | `npm run build` | exit 0 | Next.js compiled and generated all 3,891 static pages; bounded upstream timeouts used the existing fallback behavior. |
| Diff hygiene | `git diff --check` at the code freeze | exit 0 | Whitespace/error-marker check only. |

## Current local protocol observations

- **Historical pre-freeze local browser and MCP Inspector observation:** zero schema warnings; the six
  W.E.T.-sourced/derived tools returned typed `source_rights_pending`, and `wet_resolve` handled
  caller-supplied listing text. The adjacent artifact predates the final `e9dc1bc19` code freeze and
  is not relabeled as current-commit proof. It is local protocol evidence only, not a public
  clean-client run or useful sourced output.
- **Local live verifier:** protocol conformant but not launch ready; canonical host, development health, and source-rights gates remain unresolved. Candidate-only protocol mode does not waive those launch blockers.
- **Eval run template:** `not-run`; 0/6 positive cases and 0/8 refusal cases passed, with `release thresholds pass: false`. The template and scorer exist, but no dated client/model execution evidence exists.
- **Repository-wide lint baseline:** `npm run lint` reports 22 errors and 51 warnings in nine files
  that are byte-identical to `origin/master`; no release workflow invokes full lint. Every changed
  JavaScript/TypeScript file passes ESLint. This is inherited technical debt, not a v0.5 regression.

## Final-sync refresh

Final-sync status: **NOT COMPLETE** for the external release. These fields remain explicitly
unresolved rather than inheriting the local pass totals above.

| Final-sync field | Status |
|---|---|
| Rechecked UTC | `2026-09-05T12:40:52.679Z` |
| Frozen application code commit | `e9dc1bc194783102b7ea88969d124f62c4cce8a6` |
| Public-output contract | `wet-mcp-public-output/0.5.0`, SHA-256 `1c74c3aaa67014631f9c354b7614bbee609a6a3d7c07bf3fc005c233aba55455` |
| Public repository parity | NOT ESTABLISHED |
| Deployed endpoint and manifest parity | NOT ESTABLISHED |
| Public clean-client evidence | NOT ESTABLISHED |
| Executed positive/refusal eval evidence | NOT ESTABLISHED |
| Source health and source-rights clearance | NOT ESTABLISHED |
| Evidence artifact | This file records the local code-freeze boundary; pushed CI URL is not yet recorded. |

Owner, legal, and deployment gates remain. No local command, browser session, Inspector session, candidate-only verifier mode, or package record completes those gates.

## Evidence still required

- Push the exact frozen candidate, record green CI, and establish byte-for-byte public-repository parity.
- Establish canonical deployed endpoint and manifest version parity.
- Run anonymous initialization, discovery, and all public tools from a genuinely clean public client.
- Record dated client/model positive and refusal eval reports with per-assertion evidence and passing release thresholds.
- Confirm production service/feed health and written source-rights clearance for the exact public coverage advertised.
- Obtain the required owner and legal approvals before deployment, publication, registry, or directory actions.

Use [`../scripts/verify-live.mjs`](../scripts/verify-live.mjs) against the canonical public deployment only after the deployment and rights gates permit it. A future successful output belongs in a separate dated live-evidence artifact and must not be backfilled into this offline/local record.
