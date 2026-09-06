# Demo and proof package

These assets are recording plans, not claims that a particular run has already happened:

- [`positive-55s-storyboard.md`](positive-55s-storyboard.md) is a 55-second index-led research demo with a ready-to-read transcript.
- [`negative-refusal-storyboard.md`](negative-refusal-storyboard.md) demonstrates why grouped venue rows may not be subtracted and how a typed refusal is preserved.
- [`../../scripts/verify-live.mjs`](../../scripts/verify-live.mjs) is the executable clean-client verifier. Before calling all seven anonymous tools, it checks the Gate 4 status document, trusted/untrusted CORS, OAuth challenge/discovery, owned trust/client/eval URLs, and service/feed health. Its redacted NDJSON emits timing, bounded summaries, result hashes, protocol/preflight status, useful-sourced-result status, health readiness, and launch readiness without response bodies, market values, credentials, cookies, or protected source names.

Record a positive sourced demo only after the package version is deployed, source rights are cleared, and the clean-client verifier reports launch readiness. Keep live values on screen exactly as the server returns them; do not type a probability, spread, benchmark value, count, timestamp, or refusal code into the recording in advance. If a source degrades or refuses during the take, retain that result and explain it rather than editing in a successful value from another run. A `source_rights_pending` response is protocol-safe but is not a useful sourced result or positive demo pass.

Each release demo must be a regular in-package `.mp4` file referenced exactly once by
`assets/release-evidence.json`. The verifier requires at least 100 KiB, top-level `ftyp`, `moov`,
and populated `mdat` boxes, `mvhd` duration metadata, plus a real `vide` track with nonzero
dimensions, a visual sample description, consistent nonzero timing/chunk/sample tables, and sample
ranges that land inside `mdat`. The encoded duration must be at most 90 seconds and agree with the
evidence record's declared duration within 0.5 seconds. The capture must fall
between the fresh production evaluation and owner review, carry a matching lowercase SHA-256, and
be marked redacted and approved for public display. Unreferenced media, nested directories, and
symlinks fail release validation; the listed Markdown plans are the only documentation exceptions.

No credential, cookie, W.E.T. account, venue account, wallet, or order capability belongs in a public demo.
