# backend/app/ai_engine/nodes/context_loader.py
from app.ai.state import QuizGraphState

MAX_CONTEXT_CHARS = 12000

async def retrieve_context(state: QuizGraphState) -> dict:
    context = state.get("context", "")
    if not context:
        return {"context": ""}
    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + "\n\n[...context truncated for token efficiency...]"
    return {"context": context}
