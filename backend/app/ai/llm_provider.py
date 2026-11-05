from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr

from app.config import settings


class GeminiLLM:
    """Small async adapter around the configured Gemini chat model."""

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-3.5-flash-lite",
        temperature: float = 0.2,
    ):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            api_key=SecretStr(api_key),
            response_mime_type="application/json",
            timeout=35,
            max_retries=1,
            thinking_level="low",
        )

    async def generate(self, prompt: str) -> str:
        response = await self.llm.ainvoke(prompt)
        content = response.content

        if isinstance(content, str):
            return content

        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, str):
                    text_parts.append(part)
                elif isinstance(part, dict) and isinstance(part.get("text"), str):
                    text_parts.append(part["text"])
                elif isinstance(getattr(part, "text", None), str):
                    text_parts.append(part.text)
            if text_parts:
                return "\n".join(text_parts)

        raise TypeError(
            f"Unexpected Gemini response content type: {type(content).__name__}"
        )


def get_llm_service() -> GeminiLLM:
    return GeminiLLM(api_key=settings.GOOGLE_API_KEY)
