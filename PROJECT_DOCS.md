# KCG Bot Backend Documentation

## Project Overview
The **KCG Bot Backend** is a RAG (Retrieval-Augmented Generation) based chatbot system designed for KC GlobEd. It ingests data from web pages and PDF documents, processes them into vector embeddings, and uses an LLM to answer user queries.

### Key Features
- **RAG Architecture**: Combines vector search with generative AI.
- **Data Sources**: Web crawling and PDF ingestion.
- **Vector Store**: Uses ChromaDB/SQLite for storing embeddings.
- **Frontend**: integrated React chat widget.

---

## A-Z Guide

### 1. Prerequisites
- **Node.js**: v18+ recommended.
- **npm**: v9+
- **OpenAI API Key**: Required for embeddings and chat completion (stored in `.env`).

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd kcg-bot-backend

# Install dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Application Structure
- **`/src`**: Backend source code.
  - **`/services`**: Core logic (WebCrawler, VectorStore, ChatService).
  - **`/scripts`**: Ingestion and utility scripts.
  - **`/models`**: Database models.
  - **`/controllers`**: API controllers.
- **`/client`**: Frontend React application (Vite).
- **`kcg.pdf`**: Source PDF for ingestion.
- **`kcg_bot.db`**: SQLite database file.

---

## Build & Run Estimates

| Task | Time Estimate | Description |
|------|--------------|-------------|
| **Initial Setup** | ~5 mins | `npm install` for both backend and client. |
| **Ingestion (Web)** | ~2-5 mins | Depends on network speed and number of pages. |
| **Ingestion (PDF)** | ~1-2 mins | Depends on PDF size (currently ~3MB). |
| **Build** | ~1 min | `npm run build` (backend) + `npm run build` (client). |

---

## Data Sources & Ingestion

### 1. Web Sources
The bot crawls specific pages from the KC GlobEd website.
**Script**: `src/scripts/ingest-web.ts`
**Sources**:
- `https://www.kcglobed.com/`
- `https://www.kcglobed.com/course/ea`
- `https://www.kcglobed.com/course/cma`
- `https://www.kcglobed.com/course/cpa`
- `https://www.kcglobed.com/about-us`
- `https://www.kcglobed.com/contactus`

### 2. PDF Sources
The bot ingests the `kcg.pdf` file located in the root directory.
**Script**: `src/scripts/ingest.ts`
**File**: `kcg.pdf`

---

## Cron Jobs / Updates
Currently, data updates are triggered via manual scripts. These can be scheduled as cron jobs on a server.

### Run Web Ingestion
Updates the vector store with the latest content from the website.
```bash
npm run ingest-web
```

### Run PDF Ingestion
Updates the vector store with content from `kcg.pdf`.
```bash
npx ts-node src/scripts/ingest.ts
```

---

## API & Development

### 1. Start Development Server
```bash
npm run dev
```
Starts the backend server with `nodemon`.

### 2. Start Frontend
```bash
cd client
npm run dev
```

### 3. CLI Chat
Test the bot directly in the terminal:
```bash
npm run chat
```

---

## Requirements
- **Environment Variables**: Create a `.env` file with:
  ```
  OPENAI_API_KEY=sk-...
  ```
- **Database**: SQLite is used locally (`kcg_bot.db`). ensuring the file has write permissions.
