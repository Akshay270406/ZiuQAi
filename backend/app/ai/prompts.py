# backend/app/services/llm/prompts.py

QUIZ_GENERATION_PROMPT = """Generate {question_count} quiz questions from the context below.

Context:
{context}

Rules:
- Difficulty: {difficulty}
- Allowed types: {question_types}
- Return ONLY a raw JSON array (no markdown, no ```json wrapper)

Each object must have:
- "question": string
- "question_type": one of "scq", "mcq", "tof", "fib" (only allowed types)
- "options": list of strings for scq/mcq/tof (tof must be ["True","False"]). null for fib.
- "correct_answer": for scq/tof must match an option exactly. For mcq comma-separated correct options. For fib the exact fill-in text.

Questions must be accurate to the context and cover key concepts."""


QUIZ_RETRY_PROMPT = """Your previous quiz generation output was invalid.

Previous output:
{raw_llm_output}

Validation errors:
{errors}

Fix ONLY the errors above. Return the corrected full JSON array of {question_count} questions.
Same rules: types must be from {question_types}, difficulty {difficulty}.
Return ONLY raw JSON, no markdown."""
