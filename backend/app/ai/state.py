# backend/app/ai_engine/state.py
from typing import TypedDict, List, Dict, Any

class QuizGraphState(TypedDict):
    quiz_id: int
    question_count: int
    difficulty: str
    question_types: List[str]
    context: str
    questions: List[Dict[str, Any]]
    is_valid: bool
    errors: List[str]
    attempt: int
    raw_llm_output: str
