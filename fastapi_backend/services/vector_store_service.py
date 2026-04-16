import os
from typing import List, Any
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

# Load environment variables (.env file) so we can securely use API keys.
load_dotenv()

# The VectorStoreService manages our 'long-term memory' (ChromaDB).
# For a beginner: A vector database is like a search engine for your 
# specific documents, allowing the bot to 'find' relevant information.
class VectorStoreService:
    def __init__(self, collection_name: str = "kcg-knowledge-base"):
        self.collection_name = collection_name
        
        # 'embeddings' is the model used to convert text into mathematical 
        # coordinates that the computer can search through.
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small"
        )
        
        # ChromaHost and Port tell the code WHERE the database is running.
        # We use environmental variables (env.get) to be flexible.
        self.chroma_host = os.environ.get("CHROMA_HOST", "127.0.0.1")
        self.chroma_port = os.environ.get("CHROMA_PORT", "8000")
        self.chroma_url = f"http://{self.chroma_host}:{self.chroma_port}"
        
        # 'vector_store' starts as None and is initialized when needed.
        self.vector_store = None

    def init_vector_store(self):
        """Connects to the ChromaDB server."""
        # For a beginner: Connecting to a database correctly is crucial.
        # This setup ensures the code knows which collection and settings to use.
        self.vector_store = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory="./chroma_db", # Optional: can also run in memory or remotely
        )

    async def add_documents(self, docs: List[Any]):
        """Adds documents (like PDF text chunks) to our vector search engine."""
        if not self.vector_store:
            self.init_vector_store()
        
        # 'add_documents' saves the documents into the database securely.
        await self.vector_store.aadd_documents(docs)

    async def similarity_search_with_score(self, query: str, k: int = 3):
        """Searches for pieces of text that are similar to the user's question."""
        if not self.vector_store:
            self.init_vector_store()
        
        # For a beginner: 'k' is the number of results we want to find.
        # This function returns both the 'text' AND a 'score' (how close the match is).
        # In Python LangChain, similarity_search_with_relevance_scores or 
        # similarity_search_with_score is used.
        return await self.vector_store.asimilarity_search_with_score(query, k=k)

    def get_retriever(self):
        """Provides an interface for other parts of the app to 'ask' the database."""
        if not self.vector_store:
            self.init_vector_store()
        return self.vector_store.as_retriever()
