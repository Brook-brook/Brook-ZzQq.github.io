"""Original Brook teaching example: one bounded text request, no website execution.

Python >=3.10, openai==3.50.0. Configure your own authorized server/local
OPENAI_API_KEY and OPENAI_MODEL. Never place credentials in a public website.
Reference interface: openai/openai-python@59738a289ee82c7b86bf1e10230cceb6daa9716d.
Offline tests use the real SDK with a fake transport, not real model output.
"""

import os
import sys

from openai import APIConnectionError, APIStatusError, OpenAI


class ReplyUnavailable(Exception):
    """The received response did not satisfy this text-only contract."""


def ask_once(client, model, question):
    if not isinstance(model, str) or not model.strip() or len(model) > 200:
        raise ValueError("Configure an authorized model identifier.")
    if not isinstance(question, str) or not question.strip() or len(question) > 2000:
        raise ValueError("Use a nonempty question of at most 2000 characters.")
    response = client.responses.create(
        model=model,
        instructions="Explain the concept briefly. Distinguish evidence from uncertainty.",
        input=question,
        max_output_tokens=256,
        store=False,
    )
    if response.status != "completed":
        raise ReplyUnavailable("not-completed")
    if not isinstance(response.output, list):
        raise ReplyUnavailable("malformed-output")
    for item in response.output:
        if item.type == "reasoning":
            # Legitimate metadata for some models, not the answer or hidden text.
            continue
        if item.type != "message":
            raise ReplyUnavailable("not-text-only")
        for part in item.content:
            if part.type == "refusal":
                raise ReplyUnavailable("refused")
            if part.type != "output_text":
                raise ReplyUnavailable("not-text-only")
    text = response.output_text.strip()
    if not text:
        raise ReplyUnavailable("empty-text")
    # Contract success is not factual verification of the generated text.
    return {"text": text, "request_id": response._request_id}


def main():
    model = os.environ.get("OPENAI_MODEL")
    key = os.environ.get("OPENAI_API_KEY")
    if not model or not key:
        print("Configure OPENAI_MODEL and OPENAI_API_KEY in your own local/server environment.", file=sys.stderr)
        return 2
    question = " ".join(sys.argv[1:])
    try:
        with OpenAI(api_key=key, timeout=15.0, max_retries=0) as client:
            reply = ask_once(client, model, question)
    except ValueError:
        print("Invalid input: use a nonempty question, at most 2000 characters.", file=sys.stderr)
        return 2
    except ReplyUnavailable as error:
        print(f"No accepted answer: {error}", file=sys.stderr)
        return 1
    except APIConnectionError:
        print("Connection/timeout failure; this program does not automatically retry.", file=sys.stderr)
        return 1
    except APIStatusError as error:
        # No response body, input, authorization header or secret is logged.
        print(f"API status {error.status_code}; request ID: {error.request_id}", file=sys.stderr)
        return 1
    print(reply["text"])
    print(f"Request ID: {reply['request_id']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
