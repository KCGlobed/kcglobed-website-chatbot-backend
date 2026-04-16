import aiosqlite
import json
import datetime
from typing import Any, Dict
from ..db.mongodb import get_database
# The DatabaseService handles all interactions with our SQLite database.
# For a beginner: This is like a storage room where we keep permanent records 
# of our users and what happens during their chat sessions.
class DatabaseService:
    def __init__(self, db_path: str = "./kcg_bot.db"):
        # db_path: The file where the database will be stored (same as original).
        self.db_path = db_path

    async def init(self):
        """Initializes the database by creating necessary tables if they don't exist."""
        # For a beginner: 'async with' and 'await' are Python's way of doing 
        # non-blocking (fast) file and database operations.
        async with aiosqlite.connect(self.db_path) as db:
            # Create a table for users to store their Name and Phone number.
            await db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    phone TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """)
            # Create a table for logs to track what events happen (like messages sent).
            await db.execute("""
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event TEXT,
                    details_json TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """)
            # Commit the changes to make them permanent.
            await db.commit()

    async def save_user(self, name: str, phone: str):
        """Saves a user's name and phone to the 'users' table."""
        async with aiosqlite.connect(self.db_path) as db:
            # Use '?' as a placeholder to prevent SQL injection (a common security risk).
            await db.execute(
                'INSERT INTO users (name, phone) VALUES (?, ?)',
                (name, phone)
            )
            await db.commit()
            # For a beginner: This print statement shows up in your server terminal.
            print(f"User saved: {name}, {phone}")
            try:
                mongodb = await get_database()
                if mongodb is not None:
                    user_collection = mongodb["users"]
                    await user_collection.insert_one({
                        "name": name,
                        "phone": phone,
                        "created_at": datetime.datetime.now()
                    })
                else:
                    print("mongodb is not connected")
            except Exception as e:
                print(f"Failed to save user to MongoDB: {e}")
                    


    async def log_event(self, event: str, details: Dict[str, Any]):
        """Logs an event and its details to both the console and the database."""
        # Console Log (standard output) for monitoring in real-time.
        log_entry = {
            "event": event,
            **details,
            "time": datetime.datetime.now().isoformat()
        }
        print(json.dumps(log_entry))

        # SQLite Persistence (saving it to the physical database file).
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    'INSERT INTO logs (event, details_json) VALUES (?, ?)',
                    (event, json.dumps(details))
                )
                await db.commit()
        except Exception as error:
            # If something goes wrong, it will show as an error in the console.
            print(f"Failed to save log to SQLite: {error}")

        # MongoDB Persistence
        try:
            mongodb = await get_database()
            if mongodb is not None:
                logs_collection = mongodb["logs"]
                await logs_collection.insert_one({
                    "event": event,
                    "details": details,
                    "created_at": datetime.datetime.now()
                })
        except Exception as error:
            print(f"Failed to save log to MongoDB: {error}")
