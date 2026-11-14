# Interface literacy: actually inspected sources

2026-11-14 Asia/Shanghai. These references guide original Chinese explanation,
not copied SDK/tool code, production claims or a claim of client compatibility.

AgentSkills83021e2be457a9b6679148719c1f6074f0ad975e: README, complete
specification (metadata, optional fields/directories, progressive loading, file
references/validation), root Apache2 LICENSE and full docs CC-BY4 LICENSE.
The name-field wording mixes Unicode and ASCII examples; use a conservative
ASCII-lowercase/hyphen example rather than invent universal Unicode support.
5000tokens/500lines are recommendations, not a measured token count or enforced
limit. allowed-tools is experimental with implementation-dependent support.

MCP06e923405df3df242f1471b9300d9db90ebd10fd: rootREADME/fullLICENSE;
docs/docs/2026-07-28/learn/architecture.mdx scope/participants/layers/primitives/
discovery; complete docs/specification/2026-07-28/server/tools.mdx. This version
uses per-request metadata and server/discover; do not paste older handshake/session
JSON as current. No wire implementation or real server is added here.
The architecture examples past the initial discovery walkthrough are not used.

The root README calls the project MIT, but its actual LICENSE explicitly says
licensing is transitioning: new code/spec contributions Apache2, historical
unconsented MIT retained, other documentation CC-BY4. Retain that complete text,
not a guessed MIT-only notice. No proprietary logo or course corpus is reused.

Tool annotations and structuredContent are not universal authority or schema-
constrained model generation; names are unique within a server, not automatically
across servers. A host adapter must preserve protocol/provider IDs independently.
We explain these boundaries without copying sample messages or hidden reasoning.
