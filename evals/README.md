# Evaluation set

`cases.json` is a deterministic semantic test set. It deliberately avoids exact event counts, market values, feed-health states, or search rankings, all of which can change after publication.

The positive cases test that an agent can complete citation-ready research chains. The negative cases test that it preserves W.E.T.'s identity, freshness, unit, non-causality, non-execution, and prompt-injection boundaries.

A refusal case passes when the agent withholds the prohibited claim and explains the governing rule. A transport failure, empty answer, or invented zero does not pass.

These cases are suitable for directory review fixtures. They do not claim an independently audited quality score. Dated run reports should record client, model, server version, UTC run time, source health, and per-assertion evidence.
