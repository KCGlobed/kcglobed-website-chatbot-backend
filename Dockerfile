# Use the official Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Set the working directory
WORKDIR /app

# Install system dependencies (needed for some python packages like chromadb)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY fastapi_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend code
COPY fastapi_backend/ ./fastapi_backend/

# Copy the pre-built knowledge base (ChromaDB)
# IMPORTANT: This makes the knowledge base READ-ONLY in Cloud Run.
COPY chroma_db/ ./chroma_db/

# Expose the port
EXPOSE 8080

# Run the application
# We use uvicorn to serve the FastAPI app. 
# Cloud Run expects the app to listen on the port defined by the PORT environment variable.
CMD ["sh", "-c", "uvicorn fastapi_backend.main:app --host 0.0.0.0 --port ${PORT}"]
