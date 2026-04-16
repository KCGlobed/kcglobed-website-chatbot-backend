import asyncio
import os
import sys

# Ensure the project root is in the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi_backend.db.mongodb import client

async def test_mongo():
    print("Testing MongoDB connection...")
    if not client:
        print("MongoDB client is not initialized.")
        return
    
    try:
        # Pinging the server to check for connection with a 5 second timeout
        await asyncio.wait_for(client.admin.command('ping'), timeout=5.0)
        print("Connected to MongoDB successfully!")
        
        # List all databases
        dbs = await client.list_database_names()
        print(f"Databases available: {dbs}")
        
    except Exception:
        import traceback
        print("Failed to connect to MongoDB:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mongo())
