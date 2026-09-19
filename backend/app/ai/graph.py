# backend/app/ai_engine/graph.py
from langgraph.graph import StateGraph, END
from app.ai.state import QuizGraphState
from app.ai.nodes.context_loader import retrieve_context
from app.ai.nodes.question_generator import generate_questions
from app.ai.nodes.question_validator import validate_questions
from app.ai.nodes.output_formatter import format_output

def should_continue(state: QuizGraphState) -> str:
    if state.get("is_valid", False):
        return "format_output"
    if state.get("attempt", 0) >= 3:
        return "format_output"
    return "generate_questions"

workflow = StateGraph(QuizGraphState)

workflow.add_node("retrieve_context", retrieve_context)
workflow.add_node("generate_questions", generate_questions)
workflow.add_node("validate_questions", validate_questions)
workflow.add_node("format_output", format_output)

workflow.set_entry_point("retrieve_context")
workflow.add_edge("retrieve_context", "generate_questions")
workflow.add_edge("generate_questions", "validate_questions")

workflow.add_conditional_edges(
    "validate_questions",
    should_continue,
    {
        "generate_questions": "generate_questions",
        "format_output": "format_output"
    }
)

workflow.add_edge("format_output", END)

app_graph = workflow.compile()

async def run_quiz_pipeline(
    quiz_id: int,
    question_count: int,
    difficulty: str,
    question_types: list[str],
    context: str = "",
) -> list[dict]:
    initial_state = {
        "quiz_id": quiz_id,
        "question_count": question_count,
        "difficulty": difficulty,
        "question_types": question_types,
        "context": context,
        "questions": [],
        "is_valid": False,
        "errors": [],
        "attempt": 0,
        "raw_llm_output": ""
    }

    result = await app_graph.ainvoke(initial_state)
    return result.get("questions", [])
