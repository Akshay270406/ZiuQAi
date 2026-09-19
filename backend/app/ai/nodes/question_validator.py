# backend/app/ai_engine/nodes/question_validator.py
from app.ai.state import QuizGraphState

async def validate_questions(state: QuizGraphState) -> dict:
    questions = state.get("questions", [])
    expected_count = state.get("question_count", 5)
    allowed_types = state.get("question_types", ["mcq", "scq", "tof", "fib"])

    errors = []
    is_valid = True

    if not isinstance(questions, list):
        errors.append("Questions is not a list")
        return {"is_valid": False, "errors": errors}

    if len(questions) != expected_count:
        errors.append(f"Expected {expected_count} questions, but got {len(questions)}")
        is_valid = False

    for idx, q in enumerate(questions):
        if not isinstance(q, dict):
            errors.append(f"Question at index {idx} is not an object")
            is_valid = False
            continue

        q_text = q.get("question")
        q_type = q.get("question_type")
        correct_ans = q.get("correct_answer")
        options = q.get("options")

        if not q_text or not isinstance(q_text, str):
            errors.append(f"Question at index {idx} has missing or invalid 'question' field")
            is_valid = False

        if not q_type or q_type not in allowed_types:
            errors.append(f"Question at index {idx} has invalid or disallowed type: {q_type}")
            is_valid = False

        if correct_ans is None or correct_ans == "":
            errors.append(f"Question at index {idx} has missing 'correct_answer'")
            is_valid = False

        if q_type in ["scq", "mcq"]:
            if not isinstance(options, list) or len(options) < 2:
                errors.append(f"Question at index {idx} ({q_type}) must have a list of options with at least 2 elements")
                is_valid = False
        elif q_type == "tof":
            if not isinstance(options, list) or set(options) != {"True", "False"}:
                errors.append(f"Question at index {idx} (tof) must have options exactly equal to ['True', 'False']")
                is_valid = False
        elif q_type == "fib":
            if options is not None:
                errors.append(f"Question at index {idx} (fib) must have options equal to null")
                is_valid = False

    return {"is_valid": is_valid, "errors": errors}
