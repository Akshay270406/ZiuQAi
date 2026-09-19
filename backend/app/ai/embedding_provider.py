# backend/app/ai/embedding_provider.py
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings

def get_embedding_provider() -> GoogleGenerativeAIEmbeddings:
    """Returns a configured instance of Google Generative AI Embeddings."""
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=settings.GOOGLE_API_KEY
    )

async def generate_embeddings(text_chunks: list[str]) -> list[list[float]]:
    """Generates embeddings for a list of text chunks."""
    provider = get_embedding_provider()
    return await provider.aembed_documents(text_chunks)
    
async def generate_query_embedding(query: str) -> list[float]:
    """Generates an embedding for a search query."""
    provider = get_embedding_provider()
    return await provider.aembed_query(query)
