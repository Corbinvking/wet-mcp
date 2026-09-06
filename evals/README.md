# Evaluation set

`cases.json` is a deterministic semantic test set. It deliberately avoids exact event counts, market values, feed-health states, or search rankings, all of which can change after publication.

The positive sourced cases are release targets, not claims about current output. Production returns route-wide HTTP `503`/`mcp_release_held`. In a controlled candidate environment, default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`, while `wet_resolve` is the caller-supplied-text exception. Protocol-safe hold behavior is not a useful sourced-result pass.

The positive cases test that an agent can complete citation-ready research chains. The negative cases test that it preserves W.E.T.'s identity, freshness, unit, non-causality, non-execution, and prompt-injection boundaries.

A refusal case passes when the agent withholds the prohibited claim and explains the governing rule. A transport failure, empty answer, or invented zero does not pass.

These cases are suitable for directory review fixtures. They do not claim an independently audited quality score. Dated run reports should record client, model, server version, UTC run time, source health, and per-assertion evidence.

`target.candidateCommitSha` is the full source commit SHA of the deployed W.E.T. application that
the run exercised. It is deliberately not the commit of this packaging repository: registry
publishing binds the package with its immutable version tag, then independently requires the live
status document to report the application SHA recorded by the completed evaluation.

## Record and score a run

Copy [`run-result-template.json`](run-result-template.json) to a dated evidence file, fill it from the
unaltered client transcript, and validate/score it with:

```bash
node evals/score-run.mjs evidence/YYYY-MM-DD-client-eval.json
```

[`run-result-schema.json`](run-result-schema.json) defines the closed evidence record, while
[`machine-expectations.json`](machine-expectations.json) pins ordered tool requirements, citation
fields, and any required typed refusal codes. The runner checks those mechanically and requires each
semantic assertion to carry human or deterministic evidence. It does not decide whether prose is
truthful; the named human reviewer remains responsible for qualitative answer judgment.

The committed template is intentionally `not-run`. Its structural check is:

```bash
node evals/score-run.mjs evals/run-result-template.json --allow-incomplete
```
