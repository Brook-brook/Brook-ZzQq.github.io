# AI / Agent foundations: source review, 2026-11-13

These are teaching references, not a claim of independently reproduced model
performance, universal agent terminology or verified current news. All Chinese
lessons, exercises, examples and interface code are original, AI-assisted work.
Source documents were actually read before writing the lessons.

| Source / immutable commit | Actually inspected | Use and limit |
| --- | --- | --- |
| `huggingface/agents-course` / `9b3d6b3887bc489510da0239d4c1bc1ee23fd40f` | Unit1 What are LLMs / What are Agents / agent steps and structure; full LICENSE | Token-generation and model/action/observation introduction. Do not copy model-size tables, EOS spellings, images, embeds, illustrative internal monologues or broad correctness claims. |
| `huggingface/transformers` / `e18fcb1b8e2b8f597269887ccf4c5fea1e8f493d` | `docs/source/en/main_classes/tokenizer.md`, full LICENSE | Tokenization, IDs, special tokens and string mapping. No fixed characters-to-tokens rule or tokenizer/model asset is imported. |
| `openai/openai-python` / `59738a289ee82c7b86bf1e10230cceb6daa9716d` | README Usage, structured response helper example, errors, request IDs, retries/timeouts, `_version.py`, full LICENSE | SDK 3.50.0 interface; original injectable text-request example. No hardcoded latest model, copied example, true API invocation or secret read in tests. |
| `openai/openai-agents-python` / `64fbde5d02b42ae5f9db668eb0184cdb3fc9d775` | README, `docs/running_agents.md`, `docs/context.md`, full LICENSE | Real loop termination/max_turns, local vs model-visible context, state serialization/tracing scope. No SDK is loaded by the website. |
| `anthropics/claude-cookbooks` / `ce8b2629efe8b24048b127b4c79af1e9cbab93d4` | RAG README, guide notebook markdown/mechanism, evaluation README, full LICENSE | Separate retrieval and end-to-end measurement, indexing/reranking concepts. No corpus, output, picture, implementation or performance number is copied. |

The older Anthropic repository URL redirects; reading the repository-ID redirect
was not supported by the connected tool. The current canonical public repository
was then read at the exact commit above. No unavailable response was treated as
the requested file.

## Corrections made while learning

- Autoregressive token prediction describes common text generation, not all AI
  objectives or modalities. Current multimodal models are not limited to text
  input/output. Token probability is not factual confidence or calibration.
- Prompt examples, retrieved material and conversation persistence do not by
  themselves update model weights. Context capacity/pricing/counting are model
  and API specific; no invented generic token window or current price.
- A prompt naming tools does not enforce authorization. Observations and loop
  structure do not guarantee accurate output. External text cannot grant a
  capability; implementations and protected services must authorize operations.
- Public action/receipt traces are useful without fabricated hidden reasoning.
  Completion, refusal, failure, cancellation and exhausted budget remain distinct.
  Model turns are not interchangeable with tool calls, tokens or total deadlines.
- RAG notebook passages refer to different recorded model/judge configurations
  and historical results. They are not one present-day run. This project does
  not merge their percentages or call them reproduced evidence. Retrieval scores
  and model-judge scores are not universal factual truth.
- `store=False` is not a promise of zero provider retention. SDK transport timeout
  is not the whole application's end-to-end deadline. Streaming retry cannot
  blindly append a second generation to the first.

## Real SDK test boundary

An ignored local venv installs **openai 3.50.0**, not a website dependency. Tests
use its real serialization/types/exceptions with `httpx2.MockTransport` and an
explicit non-credential fixture key at `offline.invalid`. The fake handler is
in-memory; no model/socket/API charge or user input is involved. Cases cover
normal text, reasoning metadata, incomplete/refusal/empty/unexpected tool output,
malformed envelope, invalid input, 401/429/500, connection/read-timeout and absent
configuration. The exact result is recorded in the iteration delivery logs.

Installed test-only metadata was reviewed: OpenAI Apache-2.0; HTTPX2/HTTPCore2 and
IDNA BSD-3-Clause; typing_extensions PSF-2.0; sniffio MIT OR Apache-2.0; remaining
runtime test distributions MIT. No transitive package or venv is redistributed.
Actual top-level reference licenses and notices are retained separately; none
licenses a third party's branding, fonts or course images for use here.

API models, network availability, actual account permissions, live inference,
JSON-schema generation support and billed behavior are **not tested** by this
offline test. A learner must separately verify them before their own live call.
