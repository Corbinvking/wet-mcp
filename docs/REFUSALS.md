# Typed refusals

A refusal is how W.E.T. prevents an unsupported numerical or identity claim. It is a result, not a transport failure and not a synonym for missing data.

A refusal identifies:

- the rule that stopped;
- why the available evidence is insufficient or incompatible;
- what evidence or parameter would close the gap; and
- which value or identity field was withheld.

When a refusal fires:

1. Repeat its code and concise reason.
2. Explain what would make the request answerable.
3. Do not emit the withheld value as `0`, `null`, a prior value, a guess, or a value from another venue.
4. Do not retry the same request unchanged.
5. Do not tell the user that no data exists unless the refusal specifically establishes that fact.

Examples of unsafe work that should produce or preserve a refusal include an omitted settlement horizon, incompatible settlement language, an unnamed outcome, a stale value requested as current, or a cross-venue difference without confirmed identity.

Malformed input is different: a JSON-RPC or tool argument error invites a corrected retry. The live output schema is authoritative for distinguishing these cases.

The public method is [worldeventtrading.com/methodology/refusals](https://www.worldeventtrading.com/methodology/refusals).
