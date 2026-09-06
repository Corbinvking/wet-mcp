# ChatGPT compatibility example

W.E.T. has a public HTTPS Streamable HTTP endpoint at `https://www.worldeventtrading.com/api/mcp`,
but production currently returns HTTP `503`/`mcp_release_held` before discovery or calls. Do not
connect or submit it while that route-wide hold is active; this is a post-clearance example.

Use ChatGPT's supported developer-mode MCP connection flow only when it is available for the account and workspace. Enter the endpoint as the MCP server URL, review the discovered tools and metadata before enabling the connection, and record the ChatGPT client version, server version, UTC test time, and per-assertion result. Current UI steps and availability are governed by the official [OpenAI connection and testing guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

In the candidate, default-deny policy `mcp-source-rights/2026-09-05.phase1` makes six sourced/derived tools return typed `source_rights_pending`; only `wet_resolve` is the caller-supplied-text exception. Credentials cannot bypass the hold. Run a positive sourced case only after rights clearance; a held response proves protocol-safe refusal behavior, not useful live data.

This compatibility entry point is not a claim of ChatGPT availability, policy eligibility, directory approval, successful setup, or publication. Do not submit the integration to an OpenAI directory without the separately required owner and policy approval.
