import os
from typing import List, Dict, Any, Tuple
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from .vector_store_service import VectorStoreService
from dotenv import load_dotenv

# Load sensitive environment variables (API Keys).
load_dotenv()

# The LangChainService combines our knowledge base (ChromaDB) and AI model (OpenAI).
# For a beginner: This service is the 'brain' of the bot. 
# It takes user questions, 'looks up' information, and generates an AI answer.
class LangChainService:
    def __init__(self):
        # We specify which AI model to use. GPT-4o is the current standard.
        # (The original code mentioned gpt-5.2, but gpt-4o is a safe and powerful choice).
        self.chat_model = ChatOpenAI(
            model_name="gpt-4o",
            temperature=0.7, # Higher temperature (0.7) makes the bot more creative/natural.
        )
        
        # This converts text into number coordinates (embeddings) for searching.
        self.embedding_model = OpenAIEmbeddings(
            model="text_embedding-3-small"
        )

    async def generate_response(
        self, 
        history: List[Dict[str, str]], 
        user_message: str
    ) -> Tuple[str, float]:
        """Collects context from knowledge base, creates a prompt, and calls AI."""
        # Initialize our two knowledge collections.
        vector_store = VectorStoreService("kcg-knowledge-base")
        web_vector_store = VectorStoreService("kcg-web-content")
        
        context = ""
        avg_score = 0.0
        
        try:
            # For a beginner: This searches both our PDF data and WEB data simultaneously.
            pdf_results = await vector_store.similarity_search_with_score(user_message, 3)
            web_results = await web_vector_store.similarity_search_with_score(user_message, 3)
            
            # Combine and sort results by 'closeness' (the score).
            all_results = pdf_results + web_results
            # Sort by score (lower score = more similar/closer).
            all_results.sort(key=lambda x: x[1])
            
            # Take the top 5 most relevant pieces of information.
            top_results = all_results[:5]
            
            # Extract the actual text content from the search results.
            context_list = [res[0].page_content for res in top_results]
            context = "\n\n".join(context_list)
            
            # Simple math to calculate a 'confidence' score (if results were found).
            if top_results:
                total_distance = sum(res[1] for res in top_results)
                avg_distance = total_distance / len(top_results)
                # Ensure we don't divide by zero; 1 / (1 + distance) is a common confidence formula.
                avg_score = 1 / (1 + avg_distance)
                
            print(f"Context found: {len(top_results)}")
            
        except Exception as e:
            # If the database isn't ready, the bot will still reply using general knowledge.
            print(f"Vector store not ready, proceeding without context: {e}")

        # Construct the 'Instruction Set' for the AI (The System Prompt).
        system_instructions = f"""
        You are KC GlobEd Bot, a helpful assistant for KC Globed. 
        You help with courses, admissions, and LMS support.

        Use the following context to answer the user's question.
            
        Important Instructions:
        - **Multilingual Support**: Detect the language of the user's message and reply in the SAME language.
        - **Moderation**: If the user uses abusive, offensive, or inappropriate language, strictly warn them to be respectful and DO NOT answer their query.
        - Answer directly and professionally.
        - Do NOT use phrases like "mentioned in the text", "according to the documents".
        - Speak as if you possess this knowledge naturally.
        - If the answer is not in the context, just say you don't know based on the provided information, or provide general helpful info if appropriate.
            
        Context:
        {context}
        """

        # Prepare the list of messages (Instructions + Chat History + New Question).
        messages = [SystemMessage(content=system_instructions)]
        
        # Add the conversation history so the bot 'remembers' what was said before.
        for msg in history:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                messages.append(AIMessage(content=msg['content']))
        
        # Finally, add the current question from the user.
        messages.append(HumanMessage(content=user_message))

        try:
            # Ask the AI model and get the response text.
            response = await self.chat_model.ainvoke(messages)
            return response.content, avg_score
            
        except Exception as error:
            # Standard error handling if OpenAI encounters an issue.
            print(f"LLM Error: {error}")
            return "I'm sorry, I encountered an error processing your request.", 0.0

    async def get_embedding(self, text: str) -> List[float]:
        """Converts text into a list of numbers (embeddings) for searching."""
        return await self.embedding_model.aembed_query(text)
        
