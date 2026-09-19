# backend/app/ai_engine/nodes/output_formatter.py
from app.ai.state import QuizGraphState

async def format_output(state: QuizGraphState) -> dict:
    return {"questions": state.get("questions", [])}
