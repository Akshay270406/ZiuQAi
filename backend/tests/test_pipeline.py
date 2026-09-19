# backend/tests/test_pipeline.py
import pytest
from unittest.mock import AsyncMock, patch

from app.ai.state import QuizGraphState
from app.ai.nodes.question_validator import validate_questions
from app.ai.nodes.question_generator import generate_questions
from app.ai.graph import should_continue

async def test_validate_questions_node():
    # Test valid questions
    state: QuizGraphState = {
        "quiz_id": 1,
        "question_count": 2,
        "difficulty": "EASY",
        "question_types": ["scq", "tof"],
        "context": "Context information",
        "questions": [
            {
                "question": "What is the capital of France?",
                "question_type": "scq",
                "correct_answer": "Paris",
                "options": ["Paris", "London", "Berlin"]
            },
            {
                "question": "Is the sun hot?",
                "question_type": "tof",
                "correct_answer": "True",
                "options": ["True", "False"]
            }
        ],
        "is_valid": False,
        "errors": [],
        "attempt": 0
    }
    
    res = await validate_questions(state)
    assert res["is_valid"] is True
    assert len(res["errors"]) == 0

    # Test invalid questions count
    state["questions"] = state["questions"][:1]
    res_invalid_count = await validate_questions(state)
    assert res_invalid_count["is_valid"] is False
    assert any("Expected 2 questions" in err for err in res_invalid_count["errors"])

    # Test missing options for SCQ
    state["question_count"] = 1
    state["questions"] = [{
        "question": "Missing options question",
        "question_type": "scq",
        "correct_answer": "A",
        "options": None
    }]
    res_missing_opts = await validate_questions(state)
    assert res_missing_opts["is_valid"] is False
    assert any("must have a list of options" in err for err in res_missing_opts["errors"])

@patch("app.ai.nodes.question_generator.get_llm_service")
async def test_generate_questions_node(mock_get_llm):
    # Mock LLM generation returning a JSON string with markdown blocks
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = """```json
    [
        {
            "question": "Mock Question?",
            "question_type": "scq",
            "correct_answer": "A",
            "options": ["A", "B"]
        }
    ]
    ```"""
    mock_get_llm.return_value = mock_llm

    state: QuizGraphState = {
        "quiz_id": 1,
        "question_count": 1,
        "difficulty": "EASY",
        "question_types": ["scq"],
        "context": "Short context",
        "questions": [],
        "is_valid": False,
        "errors": [],
        "attempt": 0
    }

    res = await generate_questions(state)
    assert res["attempt"] == 1
    assert len(res["questions"]) == 1
    assert res["questions"][0]["question"] == "Mock Question?"

def test_should_continue_router():
    # If valid, go to format_output
    state_valid: QuizGraphState = {"is_valid": True, "attempt": 1}
    assert should_continue(state_valid) == "format_output"

    # If invalid but attempts < 3, continue generating
    state_retry: QuizGraphState = {"is_valid": False, "attempt": 1}
    assert should_continue(state_retry) == "generate_questions"

    # If invalid and attempts >= 3, abort to format_output
    state_abort: QuizGraphState = {"is_valid": False, "attempt": 3}
    assert should_continue(state_abort) == "format_output"
