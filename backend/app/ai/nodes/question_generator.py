import asyncio
import json
import re
from typing import Any

from app.ai.llm_provider import get_llm_service
from app.ai.prompts import QUIZ_GENERATION_PROMPT, QUIZ_RETRY_PROMPT
from app.ai.state import QuizGraphState


def _parse_questions(response_text: str) -> list[dict[str, Any]]:
    """Parse a JSON array, tolerating markdown fences and surrounding prose."""
    cleaned = response_text.strip()
    cleaned = re.sub(
        r"^\s*```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE
    )
    cleaned = re.sub(r"\s*```\s*$", "", cleaned)

    start = cleaned.find("[")
    end = cleaned.rfind("]")

    if start < 0 or end < start:
        raise ValueError("Gemini response did not contain a JSON array.")

    parsed = json.loads(cleaned[start : end + 1])

    if isinstance(parsed, dict) and isinstance(parsed.get("questions"), list):
        parsed = parsed["questions"]

    if not isinstance(parsed, list) or not all(
        isinstance(item, dict) for item in parsed
    ):
        raise ValueError(
            "Gemini response must be a JSON array of question objects."
        )

    return parsed


async def generate_questions(state: QuizGraphState) -> dict:
    attempt = state.get("attempt", 0) + 1
    response_text = ""

    if attempt == 1:
        prompt = QUIZ_GENERATION_PROMPT.format(
            context=state.get("context", ""),
            question_count=state.get("question_count", 5),
            difficulty=state.get("difficulty", "MEDIUM"),
            question_types=", ".join(
                state.get("question_types", ["scq", "mcq"])
            ),
        )
    else:
        prompt = QUIZ_RETRY_PROMPT.format(
            raw_llm_output=state.get("raw_llm_output", ""),
            errors="\n".join(state.get("errors", [])),
            question_count=state.get("question_count", 5),
            question_types=", ".join(
                state.get("question_types", ["scq", "mcq"])
            ),
            difficulty=state.get("difficulty", "MEDIUM"),
        )

    try:
        llm_service = get_llm_service()
        print(
            f"[QUIZ AI] Calling Gemini (attempt {attempt})...",
            flush=True,
        )

        response_text = await asyncio.wait_for(
            llm_service.generate(prompt),
            timeout=45,
        )

        print(
            f"[QUIZ AI] Gemini responded. Length: {len(response_text)}",
            flush=True,
        )

        questions = _parse_questions(response_text)

        return {
            "questions": questions,
            "attempt": attempt,
            "raw_llm_output": response_text,
            "errors": [],
        }

    except asyncio.TimeoutError:
        print(
            "[QUIZ AI] Gemini request timed out after 45 seconds.",
            flush=True,
        )
        return {
            "questions": [],
            "attempt": 3,
            "raw_llm_output": response_text,
            "errors": ["Gemini request timed out."],
        }

    except Exception as exc:
        preview = response_text[:600].replace("\n", " ")

        print(
            f"[QUIZ AI] ERROR TYPE: {type(exc).__name__}",
            flush=True,
        )
        print(
            f"[QUIZ AI] ERROR DETAILS: {repr(exc)}",
            flush=True,
        )

        if preview:
            print(
                f"[QUIZ AI] RESPONSE PREVIEW: {preview}",
                flush=True,
            )

        return {
            "questions": [],
            "attempt": 3,
            "raw_llm_output": response_text,
            "errors": [f"{type(exc).__name__}: {exc}"],
        }
