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

The score runner alone does not authenticate caller-entered hashes or evidence strings. An active
release therefore also runs `scripts/release-package-verify.mjs`, which requires the exact raw final
answer and every raw MCP tool result under `evals/release-artifacts/`. Use these canonical paths:

- `evals/release-artifacts/CASE_ID.answer.txt`
- `evals/release-artifacts/CASE_ID.tool-NN-TOOL_NAME.json`, where `NN` is the zero-based tool-call
  index padded to two digits

Set `evaluation.artifactSchemaVersion` to `wet.eval-raw-artifacts/v2` and populate
`assets/release-evidence.json`'s `evaluation.artifacts` with one closed record per file.
Answer records contain `kind`, `caseId`, `path`, `sha256`, `redacted`, and
`publicDisplayApproved`; tool-result records additionally contain `toolCallIndex` and `tool`. Set
both review flags to `true` only after inspecting the exact public bytes. Hash those exact bytes.
Each answer digest must equal its case's `answerSha256`; each tool-result digest must equal its
call's `resultSha256`; each tool-call
`evidenceRef` must equal its canonical tool-result path; and every assertion must cite one raw file
from its own case. The release verifier rejects missing, malformed, duplicate, symlinked,
unreferenced, or extra artifacts. Raw answers are nonempty UTF-8 text capped at 256 KiB. Raw tool
results are UTF-8 JSON-RPC 2.0 success envelopes capped at 4 MiB, with nonempty MCP text `content` and
`structuredContent`. The release verifier derives `protocolSafe`, `usefulResult`,
`sourceRightsPending`, answer/result signals, and refusal codes from the raw artifacts and requires
the report to match. A `{}` result, an empty structured payload, or caller-entered positive flags do
not prove a pass. The verifier also rejects common secrets and obvious personal-data patterns;
manual redaction/public-display review remains mandatory. Include only public response/final-answer
bytes, with no credentials, cookies, private prompts, or unrelated client state.

The committed template is intentionally `not-run`. Its structural check is:

```bash
node evals/score-run.mjs evals/run-result-template.json --allow-incomplete
```
