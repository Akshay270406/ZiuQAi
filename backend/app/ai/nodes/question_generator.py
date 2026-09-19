# backend/app/ai_engine/nodes/question_generator.py
import json
import re
from app.ai.state import QuizGraphState
from app.ai.llm_provider import get_llm_service
from app.ai.prompts import QUIZ_GENERATION_PROMPT, QUIZ_RETRY_PROMPT

async def generate_questions(state: QuizGraphState) -> dict:
    attempt = state.get("attempt", 0) + 1
    llm_service = get_llm_service()

    if attempt == 1:
        prompt = QUIZ_GENERATION_PROMPT.format(
            context=state.get("context", ""),
            question_count=state.get("question_count", 5),
            difficulty=state.get("difficulty", "MEDIUM"),
            question_types=", ".join(state.get("question_types", ["mcq"]))
        )
    else:
        prompt = QUIZ_RETRY_PROMPT.format(
            raw_llm_output=state.get("raw_llm_output", ""),
            errors="\n".join(state.get("errors", [])),
            question_count=state.get("question_count", 5),
            question_types=", ".join(state.get("question_types", ["mcq"])),
            difficulty=state.get("difficulty", "MEDIUM")
        )

    response_text = ""
    try:
        response_text = await llm_service.generate(prompt)
        clean_text = response_text.strip()
        clean_text = re.sub(r"```(?:json)?", "", clean_text).strip()

        questions = json.loads(clean_text)
        if not isinstance(questions, list):
            raise ValueError("LLM response is not a JSON list")

        return {"questions": questions, "attempt": attempt, "raw_llm_output": clean_text}
    except Exception as e:
        print(f"Error generating questions (attempt {attempt}): {e}")
        return {"questions": [], "attempt": attempt, "raw_llm_output": response_text}
