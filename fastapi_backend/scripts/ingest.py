import os
import asyncio
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ..services.vector_store_service import VectorStoreService
from dotenv import load_dotenv

# Load environment variables.
load_dotenv()

# The ingest_docs function processes our PDF file and puts it into the 'search engine'.
# For a beginner: This is like reading a whole book, cutting it into small 
# useful pieces, and indexing them so they are easy to find later.
async def ingest_docs():
    print("Starting ingestion...")

    # Define the path to our knowledge PDF.
    pdf_path = os.path.join(os.path.dirname(__file__), "../../kcg.pdf")
    print(f"Loading PDF from: {pdf_path}")

    try:
        # 1. LOAD: Read the PDF file.
        loader = PyPDFLoader(pdf_path)
        pages = await asyncio.to_thread(loader.load) # Run loading in a thread to keep it fast.
        print(f"Loaded {len(pages)} pages.")

        # 2. SPLIT: Break the long pages into smaller 'chunks'.
        # For a beginner: AI works best with small, focused pieces of text 
        # (about 1000 characters each) rather than whole pages.
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200, # Overlap ensures no information is cut off at the edges.
        )
        split_docs = splitter.split_documents(pages)
        print(f"Split into {len(split_docs)} chunks.")

        # 3. STORE: Save these chunks into our ChromaDB vector database.
        vector_store_service = VectorStoreService()
        print(split_docs,'split docs')
        await vector_store_service.add_documents(split_docs)

        print("Ingestion complete! Your bot is now smarter.")
        
    except Exception as error:
        print(f"Ingestion failed: {error}")

# This part allows you to run the script directly from the terminal.
if __name__ == "__main__":
    # To run: python -m fastapi_backend.scripts.ingest
    asyncio.run(ingest_docs())
