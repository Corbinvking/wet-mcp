# Release-candidate offline/local conformance — 2026-09-05

Final-sync status: **NOT COMPLETE**.

**Evidence class:** local, deterministic candidate checks and bounded local protocol observations. **This is not production evidence, not a public clean-client run, not an independent audit, not a directory acceptance, and not proof of data rights.** It does not establish public-repository parity, deployed endpoint parity, source health, source-rights clearance, or launch readiness.

The results below were recorded against the `codex/mcp-launch-package` candidate based on commit `b09697d72d7b68b4b892b862d80af3c7a42c2838`, with candidate working-tree changes present. Each count is the result reported by that named local suite after final confirmation. A passing local suite establishes only its stated boundary; it does not promote this working tree into a release or convert a typed hold into useful sourced output.

## Current local automated results

| Scope | Command | Recorded result | Evidence boundary |
|---|---|---:|---|
| MCP contract | `npm run mcp:verify` | 283/283 passed | Local implementation semantics only. |
| Source-rights contract | `npm run mcp:source-rights:verify` | 101/101 passed | Local default-deny, lineage, and non-bypass assertions only. |
| MCP route | `npm run mcp:route:check` | 97/97 passed | Local route harness only. |
| OAuth | `npm run oauth:verify` | 72/72 passed | Local discovery, scope, rotation, and error semantics only. |
| Account API | `npm run account:verify` | 90/90 passed | Local account API harness only. |
| Account deletion | `npm run account:delete:verify` | 44/44 passed | Local deletion contract only; no production deletion occurred. |
| Alerts | `npm run alerts:verify` | 84/84 passed | Local alert semantics and transactional rights rechecks only; no delivery or production account action occurred. |
| Scanner contract | `npm run scanners:verify` | 312/312 passed | Local scanner contract, unmetered owner-scoped stop controls, scheduler health, and refusal semantics only. |
| Scanner lifecycle (static) | `npm run scanners:lifecycle:verify` | 201/201 passed | Static/local lifecycle and rights-boundary invariants only. |
| Scanner lifecycle (fresh isolated PostgreSQL) | `npm run scanners:lifecycle:db:verify` | 65/65 passed | Fresh isolated PostgreSQL after final confirmation, including mid-lock and post-provider rights transitions; temporary test data only, not production. |
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
| Public package | `node distribution/wet-mcp/scripts/validate.mjs` | 38/38 passed | Separate offline invocation; the validator deliberately does not assert its own pass total. |

## Current local protocol observations

- **Local browser and MCP Inspector:** zero schema warnings; the six W.E.T.-sourced/derived tools returned typed `source_rights_pending`, and `wet_resolve` handled caller-supplied listing text. This local result is protocol evidence only, not a public clean-client run or useful sourced output.
- **Local live verifier:** protocol conformant but not launch ready; canonical host, development health, and source-rights gates remain unresolved. Candidate-only protocol mode does not waive those launch blockers.
- **Eval run template:** `not-run`; 0/6 positive cases and 0/8 refusal cases passed, with `release thresholds pass: false`. The template and scorer exist, but no dated client/model execution evidence exists.

## Final-sync refresh

Final-sync status: **NOT COMPLETE**. These fields remain explicitly unresolved rather than inheriting the local pass totals above.

| Final-sync field | Status |
|---|---|
| Rechecked UTC | NOT RECORDED |
| Candidate commit containing this exact snapshot | NOT RECORDED; working tree is not frozen |
| Public repository parity | NOT ESTABLISHED |
| Deployed endpoint and manifest parity | NOT ESTABLISHED |
| Public clean-client evidence | NOT ESTABLISHED |
| Executed positive/refusal eval evidence | NOT ESTABLISHED |
| Source health and source-rights clearance | NOT ESTABLISHED |
| Evidence artifact or CI URL | NOT RECORDED |

Owner, legal, and deployment gates remain. No local command, browser session, Inspector session, candidate-only verifier mode, or package record completes those gates.

## Evidence still required

- Freeze and identify the exact candidate revision, then establish byte-for-byte public-repository parity.
- Establish canonical deployed endpoint and manifest version parity.
- Run anonymous initialization, discovery, and all public tools from a genuinely clean public client.
- Record dated client/model positive and refusal eval reports with per-assertion evidence and passing release thresholds.
- Confirm production service/feed health and written source-rights clearance for the exact public coverage advertised.
- Obtain the required owner and legal approvals before deployment, publication, registry, or directory actions.

Use [`../scripts/verify-live.mjs`](../scripts/verify-live.mjs) against the canonical public deployment only after the deployment and rights gates permit it. A future successful output belongs in a separate dated live-evidence artifact and must not be backfilled into this offline/local record.
