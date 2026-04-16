import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables from the .env file.
# The .env file is located in the root directory.
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# Retrieve the MongoDB connection string.
MONGO_DB_URL = os.getenv("MONGO_DB")

# Create a client and database instance.
if not MONGO_DB_URL:
    print("Warning: MONGO_DB environment variable is not set. MongoDB connection will fail.")
    client = None
    db = None
else:
    # Initialize the asynchronous MongoDB client with certifi's CA bundle.
    # This fixes the [SSL: CERTIFICATE_VERIFY_FAILED] error on macOS.
    client = AsyncIOMotorClient(
        MONGO_DB_URL,
        tlsCAFile=certifi.where()
    )
    
    # Try to get the default database, if not set in the URI, use 'kcg_chatbot'.
    try:
        db = client.get_default_database()
    except Exception:
        db = client.kcg_chatbot

async def get_database():
    """Returns the MongoDB database instance."""
    return db

# Exporting for easy access in services.
__all__ = ["client", "db", "get_database"]
