import re
from typing import Dict, Optional, List, Any
from .langchain_service import LangChainService
from .database_service import DatabaseService
from ..models.state import UserSession, ChatResponse, Message, UserData

# The ChatService manages the 'flow' of the conversation. 
# For a beginner: This is like a traffic controller directing the user 
# based on what stage they are at (Greeting, Data Collection, etc.).
class ChatService:
    def __init__(self):
        # Initializing the necessary services.
        self.langchain_service = LangChainService()
        self.db_service = DatabaseService()
        
        # 'sessions' is an in-memory dictionary to keep track of ALL active chats.
        # (For production, this could be moved to Redis or a database).
        self.sessions: Dict[str, UserSession] = {}

    def get_or_create_session(self, session_id: str) -> UserSession:
        """Retrieves an existing session or starts a brand new one."""
        if session_id not in self.sessions:
            # Starting at the 'GREETING' stage.
            self.sessions[session_id] = UserSession(
                id=session_id,
                stage='GREETING',
                messages=[],
                userData=UserData()
            )
        return self.sessions[session_id]

    async def handle_message(self, session_id: str, message_text: str, provided_user_data: Any = None) -> ChatResponse:
        """Main logic that processes a user message based on the current stage."""
        session = self.get_or_create_session(session_id)
        
        # --- STAGE 1: GREETING ---
        if not session.messages and session.stage == 'GREETING':
            greeting = "Hey! 👋 Welcome to KC GlobEd!\nI’m KC GlobEd Bot, here to guide you through courses, admissions, classes, and more.\nAsk me anything — I’m here 24/7!\n\nHow can I help you today?"
            
            # Save the greeting to session history.
            session.messages.append(Message(role='assistant', content=greeting))
            # Move to the next stage.
            session.stage = 'DATA_COLLECTION'
            
            return ChatResponse(message=greeting, stage='DATA_COLLECTION')

        # --- STAGE 2: DATA COLLECTION (Asking for Info) ---
        if session.stage == 'DATA_COLLECTION':
            session.messages.append(Message(role='user', content=message_text))
            ask_data_msg = "Before we proceed, please enter your Name and Phone Number (e.g., John Doe, 9876543210)."
            session.messages.append(Message(role='assistant', content=ask_data_msg))
            session.stage = 'WAITING_FOR_DATA'
            return ChatResponse(message=ask_data_msg, stage='WAITING_FOR_DATA')

        # --- STAGE 3: WAITING FOR DATA (Receiving Info) ---
        if session.stage == 'WAITING_FOR_DATA':
            session.messages.append(Message(role='user', content=message_text))
            
            # For a beginner: This is called a Regular Expression (Regex).
            # It looks for a sequence of 10 or more digits for a phone number.
            phone_match = re.search(r'\b\d{10,}\b', message_text)
            
            # Assume any part that is NOT the phone number is the user's name.
            name_part = re.sub(r'\b\d{10,}\b', '', message_text)
            name_part = re.sub(r'[^a-zA-Z\s]', '', name_part).strip()

            if phone_match and len(name_part) > 2:
                # Validation success! Save the info.
                phone_number = phone_match.group(0)
                session.userData.name = name_part
                session.userData.phoneNumber = phone_number

                # Save the user info permanently to the database.
                await self.db_service.init()
                await self.db_service.save_user(name_part, phone_number)

                # Give the user options for what to do next.
                options = ["Explore Courses", "Apply for Admission", "Access LMS / Student Login", "Talk to a counsellor", "Ask a Question"]
                msg = f"Thanks {name_part}! Please select an option below:"
                
                session.messages.append(Message(role='assistant', content=msg, options=options))
                session.stage = 'IDENTIFICATION'
                
                return ChatResponse(message=msg, options=options, stage='IDENTIFICATION')
            else:
                # Validation failed. Ask again politely.
                error_msg = "Please provide a valid Name (at least 3 letters) and a Phone Number (at least 10 digits)."
                session.messages.append(Message(role='assistant', content=error_msg))
                return ChatResponse(message=error_msg, stage='WAITING_FOR_DATA')

        # --- STAGE 4: IDENTIFICATION (Figuring out user intent) ---
        if session.stage == 'IDENTIFICATION':
            session.messages.append(Message(role='user', content=message_text))
            
            # Check user intent through keywords.
            if "LMS" in message_text or "Login" in message_text:
                session.userData.userType = 'existing'
                response = "As an existing student, do you need help with your login or course materials?"
            elif any(word in message_text for word in ["Explore", "Admission", "counsellor"]):
                session.userData.userType = 'new'
                response = "Great! We can help you with admissions and guidance. What course are you interested in?"
            else:
                session.userData.userType = 'new'
                response = "I understand. How can I help you regarding our educational programs?"

            session.messages.append(Message(role='assistant', content=response))
            session.stage = 'OPEN_CHAT'
            return ChatResponse(message=response, stage='OPEN_CHAT')

        # --- STAGE 5: OPEN CHAT (RAG Powered AI Chat) ---
        # This stage remains open; the user can ask anything from the knowledge base.
        session.messages.append(Message(role='user', content=message_text))
        
        # Call the AI model and retrieve relevant context.
        # history_list converts the Message objects into a simple format for the LLM.
        history_list = [{"role": m.role, "content": m.content} for m in session.messages]
        ai_response_text, confidence = await self.langchain_service.generate_response(history_list, message_text)
        
        session.messages.append(Message(role='assistant', content=ai_response_text))

        # Log this final interaction to the database for auditing and improvement.
        await self.db_service.init()
        await self.db_service.log_event("CHAT_RESPONSE", {
            "sessionId": session_id,
            "userMessage": message_text,
            "botMessage": ai_response_text,
            "confidence": confidence,
            "userData": session.userData.model_dump() # Pydantic way of converting object to dict.
        })

        return ChatResponse(message=ai_response_text, stage='OPEN_CHAT')
