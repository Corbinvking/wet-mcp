# Screenshot evidence

No screenshot is included in this release-candidate directory. The directory exists as the literal compatibility location for future, dated review evidence; an empty evidence set must not be described as completed proof.

Capture is gated on all of the following:

- a reachable deployment whose server and package versions match;
- successful clean-client and MCP Inspector checks;
- written public-output and brand-use clearance for everything visible;
- owner approval of the final visual treatment; and
- redaction of credentials, cookies, account identifiers, private URLs, request secrets, and unrelated desktop content.

Do not show a third-party name, logo, market title, price, rules text, or derived contribution unless permission covers that exact public screenshot. Prefer source-neutral fixtures and typed-refusal evidence. Preserve the UTC capture time, client and version, server version, case id, and a content hash alongside each approved image.

Planned evidence classes are an anonymous `tools/list` view, one index-led positive workflow, and one required typed refusal. These are plans, not claims that the captures exist or passed.

Each release screenshot must be a regular in-package `.png` file referenced exactly once by
`assets/release-evidence.json`. The verifier requires at least 16 KiB, a valid PNG signature, one
leading 13-byte `IHDR`, dimensions of at least 800x450, legal PNG parameters and chunk ordering,
valid CRCs, zlib-decodable image data with exact non-/Adam7 scanline sizing and valid filter bytes,
and an empty final `IEND`. The capture must fall between the fresh production evaluation and owner review, carry a matching
lowercase SHA-256, and be marked redacted and approved for public display. Unreferenced images,
nested directories, and symlinks fail release validation; this README is the only documentation
exception in the screenshot directory.
