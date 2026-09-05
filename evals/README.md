# Evaluation set

`cases.json` is a deterministic semantic test set. It deliberately avoids exact event counts, market values, feed-health states, or search rankings, all of which can change after publication.

The positive sourced cases are release targets, not claims about current output. Under default-deny policy `mcp-source-rights/2026-09-05.phase1`, six sourced/derived tools currently return typed `source_rights_pending`; only `wet_resolve` remains usable for caller-supplied text. Protocol-safe hold behavior is not a useful sourced-result pass.

The positive cases test that an agent can complete citation-ready research chains. The negative cases test that it preserves W.E.T.'s identity, freshness, unit, non-causality, non-execution, and prompt-injection boundaries.

A refusal case passes when the agent withholds the prohibited claim and explains the governing rule. A transport failure, empty answer, or invented zero does not pass.

These cases are suitable for directory review fixtures. They do not claim an independently audited quality score. Dated run reports should record client, model, server version, UTC run time, source health, and per-assertion evidence.

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
