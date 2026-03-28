import asyncio
import uuid
from ..services.chat_service import ChatService
from dotenv import load_dotenv

# Load API keys from .env file.
load_dotenv()

# The CMD Chat script allows you to talk to your bot directly in the terminal.
# For a beginner: This is like having a "private chat" with your code 
# to see how it thinks and responds before you connect it to a website.
async def run_cmd_chat():
    # 1. Initialize the ChatService (the bot's brain).
    chat_service = ChatService()
    
    # 2. Create a unique ID for this specific chat session.
    session_id = str(uuid.uuid4())
    
    print("\n🚀 Starting KC GlobEd CMD Chatbot... (Type 'exit' to quit)")
    print("-" * 50)

    # 3. Get the initial greeting from the bot.
    # We send an empty message to trigger the bot's first 'welcome'.
    response = await chat_service.handle_message(session_id, "")
    print(f"\n🤖 Bot: {response.message}")
    if response.options:
        print(f"👉 [Options]: {', '.join(response.options)}")

    # 4. Start the interactive loop.
    while True:
        try:
            # For a beginner: 'input' pauses the script and waits for YOU to type.
            user_input = input("\n👤 You: ").strip()

            # If the user types 'exit', we stop the script.
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("\n👋 Goodbye! Have a great day with KC GlobEd.")
                break

            # If the user typed nothing, we just ask again.
            if not user_input:
                continue

            # 5. Send the user's message to the bot and get the reply.
            response = await chat_service.handle_message(session_id, user_input)
            
            # Print the bot's response.
            print(f"\n🤖 Bot: {response.message}")
            
            # If the bot provides clickable buttons (options), show them here too.
            if response.options:
                print(f"👉 [Options]: {', '.join(response.options)}")
                
        except KeyboardInterrupt:
            # This handles 'Ctrl+C' gracefully.
            print("\n\n👋 Chat session ended.")
            break
        except Exception as e:
            # If an error happens (like AI failing), we show it here.
            print(f"\n⚠️ Error: {e}")

# This part tells Python to run our chat function.
if __name__ == "__main__":
    # To run: python3 -m fastapi_backend.scripts.cmd_chat
    asyncio.run(run_cmd_chat())
