# backend/app/ai/llm_provider.py
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr
from app.config import settings

class GeminiLLM:
    """
    Concrete implementation for Google Gemini.
    """
    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash", temperature: float = 0.2):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            api_key=SecretStr(api_key)
        )

    async def generate(self, prompt: str) -> str:
        response = await self.llm.ainvoke(prompt)
        return str(response.content)

def get_llm_service() -> GeminiLLM:
    return GeminiLLM(api_key=settings.GOOGLE_API_KEY)
