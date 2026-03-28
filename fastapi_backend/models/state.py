from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

# A Message represents a single interaction in the chat history.
# For a beginner: This is like a structured dictionary that ensures 
# only specific data types are allowed.
class Message(BaseModel):
    # 'role' can only be one of these three strings.
    role: Literal['user', 'assistant', 'system']
    # 'content' is the actual text of the message.
    content: str
    # 'options' is an optional list of strings for interactive buttons.
    # Optional[List[str]] means it can be a list of strings or None.
    options: Optional[List[str]] = None

# UserData stores information collected from the user during the chat.
class UserData(BaseModel):
    name: Optional[str] = None
    phoneNumber: Optional[str] = None
    # userType identifies if the user is 'new' or 'existing'.
    userType: Optional[Literal['new', 'existing']] = None

# UserSession tracks the state of a single conversation.
# For a beginner: This is where we keep track of who the user is, 
# what they've said so far, and what stage of the conversation they are in.
class UserSession(BaseModel):
    # 'id' is a unique identifier for the session (like a browser tab ID).
    id: str
    # 'stage' tells the bot what it should expect next from the user.
    stage: Literal['GREETING', 'DATA_COLLECTION', 'WAITING_FOR_DATA', 'IDENTIFICATION', 'OPEN_CHAT']
    # 'userData' stores the name and phone number once collected.
    userData: Optional[UserData] = Field(default_factory=UserData)
    # 'messages' is a list of all Message objects in this session.
    messages: List[Message] = Field(default_factory=list)

# ChatRequest is the structure of the data sent by the client (frontend).
class ChatRequest(BaseModel):
    # Every request MUST have a sessionId.
    sessionId: str
    # 'message' is the text sent by the user.
    message: Optional[str] = ""
    # Optional user data that might be sent with the request.
    userData: Optional[Dict[str, Any]] = None

# ChatResponse is the structure of the data the server sends back to the client.
class ChatResponse(BaseModel):
    # The main message text from the bot.
    message: str
    # Optional list of options (buttons) for the user to click.
    options: Optional[List[str]] = None
    # The current stage of the conversation, helpful for the frontend to know.
    stage: Optional[str] = None
