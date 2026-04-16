import time
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models.state import ChatRequest, ChatResponse
from .services.chat_service import ChatService
from .services.database_service import DatabaseService
from datetime import datetime

# Initialize the FastAPI app.
# For a beginner: This is like creating the main server object.
app = FastAPI(title="KC GlobEd Chatbot Backend (Python Edition)")

# CORS Middleware (Cross-Origin Resource Sharing).
# This allows our frontend to communicate with our backend even if they 
# are on different addresses (like localhost:3000 and localhost:8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with specific URLs for security.
    allow_credentials=True,
    allow_methods=["*"], # Allows all HTTP methods: GET, POST, etc.
    allow_headers=["*"],
)

# Initialize our core services.
chat_service = ChatService()
db_service = DatabaseService()

# Request Logger Middleware.
# For a beginner: This code 'intercepts' every request to log what 
# happened, how long it took, and the result.
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Process the request.
    response = await call_next(request)
    
    duration_ms = (time.time() - start_time) * 1000
    
    # Mirror the HTTP_REQUEST logging from the original Express code.
    await db_service.init()
    await db_service.log_event("HTTP_REQUEST", {
        "method": request.method,
        "route": str(request.url),
        "status": response.status_code,
        "ip": request.client.host if request.client else "unknown",
        "userAgent": request.headers.get("user-agent"),
        "durationMs": round(duration_ms, 2)
    })
    
    return response

# --- ENDPOINTS ---

@app.post("/api/chat", response_model=ChatResponse)
async def handle_chat(payload: ChatRequest):
    """The main endpoint where the chatbot receives messages."""
    try:
        # Check if sessionId is provided (mirrors the validation in ChatController).
        if not payload.sessionId:
            raise HTTPException(status_code=400, detail="Session ID is required")
            
        # Call the chat service to process the message and return a response.
        response = await chat_service.handle_message(
            payload.sessionId, 
            payload.message or "", 
            payload.userData
        )
        return response
        
    except Exception as e:
        # If anything unexpected happens, we log it and send a 500 error.
        print(f"Error in handle_chat: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/health")
async def health_check():
    """Endpoint for checking if the server is alive and well."""
    # Mirrors the health object in the original TypeScript code.
    return {
        "status": "UP",
        "timestamp": datetime.now().isoformat(),
        # For a beginner: This provides diagnostic info about the server.
        "system": {
            "platform": os.name,
            "pid": os.getpid(),
        }
    }

# How to run: uvicorn fastapi_backend.main:app --reload
if __name__ == "__main__":
    import uvicorn
    # uvicorn is the server that runs our FastAPI code.
    uvicorn.run(app, host="0.0.0.0", port=8000)
