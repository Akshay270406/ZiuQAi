from app.ai.state import QuizGraphState


async def validate_questions(state: QuizGraphState) -> dict:
    questions = state.get("questions", [])
    expected_count = state.get("question_count", 5)

    allowed_types = {
        str(value).lower()
        for value in state.get(
            "question_types",
            ["scq", "mcq"],
        )
    }

    errors: list[str] = []

    if not isinstance(questions, list):
        return {
            "is_valid": False,
            "errors": ["Questions is not a list."],
        }

    if len(questions) != expected_count:
        errors.append(
            f"Expected {expected_count} questions, "
            f"but got {len(questions)}."
        )

    for idx, question in enumerate(questions):
        if not isinstance(question, dict):
            errors.append(
                f"Question at index {idx} is not an object."
            )
            continue

        question_text = question.get("question")
        question_type = str(
            question.get("question_type", "")
        ).lower()
        correct_answer = question.get("correct_answer")
        options = question.get("options")

        if not isinstance(question_text, str) or not question_text.strip():
            errors.append(
                f"Question at index {idx} has invalid question text."
            )

        if question_type not in allowed_types:
            errors.append(
                f"Question at index {idx} has invalid type: {question_type}."
            )

        if correct_answer is None or correct_answer == "":
            errors.append(
                f"Question at index {idx} has no correct answer."
            )

        if question_type in ["scq", "mcq"]:
            if (
                not isinstance(options, list)
                or len(options) < 2
                or not all(isinstance(option, str) for option in options)
            ):
                errors.append(
                    f"Question at index {idx} requires at least "
                    "two string options."
                )

            if isinstance(options, list) and isinstance(correct_answer, str):
                valid_answers = set(options)
                submitted_answers = {
                    answer.strip()
                    for answer in correct_answer.split(",")
                    if answer.strip()
                }

                if not submitted_answers.issubset(valid_answers):
                    errors.append(
                        f"Question at index {idx} has a correct answer "
                        "that is not present in its options."
                    )

        elif question_type == "tof":
            if options != ["True", "False"]:
                errors.append(
                    f"Question at index {idx} must have "
                    "options ['True', 'False']."
                )

        elif question_type == "fib":
            if options is not None:
                errors.append(
                    f"Question at index {idx} must have null options."
                )

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
    }
