# FinSightAI: Detailed Technical Project Explanation

This document provides an in-depth technical explanation of the **FinSightAI** project, detailing its architecture, the mechanics of its multi-agent system, the internal directory structures, and the step-by-step workflow of data through the system.

---

## 1. System Architecture Overview

FinSightAI is designed as a modern, decoupled web application:
- **Frontend**: A React SPA (Single Page Application) built with Vite, TypeScript, and Tailwind CSS.
- **Backend**: A robust API layer built with Python and FastAPI, handling heavy processing, AI agent orchestration, and PDF generation.
- **Database Layer**: MongoDB acts as the primary data store, handling both relational-style data (workspaces, document metadata) and vector data (document chunk embeddings for semantic search).

---

## 2. Deep Dive: Backend (`/backend/app`)

The backend is structured using a Domain-Driven Design (DDD) approach, ensuring separation of concerns:

- **`api/v1/routes/`**: Contains the FastAPI route definitions (`workspaces.py`, `documents.py`, `agents.py`, `research.py`, etc.). It acts as the entry point for HTTP requests.
- **`core/`**: Houses global configurations, logging setups, and error handling middleware.
- **`db/`**: Manages the MongoDB connection pool and indexing strategies.
- **`schemas/`**: Pydantic models used for API request/response validation (e.g., `Document`, `Chunk`, `Metric`, `RedFlag`).
- **`repositories/`**: The Data Access Layer. Contains classes like `WorkspaceRepository` and `DocumentRepository` that execute PyMongo queries, keeping DB logic out of the services.
- **`services/`**: The business logic layer. Services include `document_service.py`, `embedding_service.py`, `pdf_report_service.py`, and `retrieval_service.py`. These handle the actual processing tasks (like generating a PDF or fetching relevant embeddings).
- **`agents/`**: The core of the AI logic. This directory houses the specific implementations for each agent in the multi-agent pipeline.
- **`prompts/`**: Contains the system prompts and few-shot examples injected into the LangChain/LLM calls.

---

## 3. Deep Dive: Frontend (`/frontend/src`)

The frontend is a React application optimized for complex state management:

- **`components/`**: Reusable UI elements (buttons, modals, tables).
- **`pages/`**: The main views of the application (e.g., `Dashboard`, `Workspace`, `ReportViewer`).
- **`layouts/`**: Structural wrappers that provide navigation bars and sidebars to the pages.
- **`store/`**: Likely utilizes Zustand or Redux for global state management (managing the active workspace, user session, and document states).
- **`services/`**: API client modules (using `fetch` or `axios`) that interact with the FastAPI backend.
- **`hooks/`**: Custom React hooks (e.g., `useWorkspace`, `useDocuments`) potentially built on top of React Query to handle caching, loading states, and data fetching.

---

## 4. The Multi-Agent Pipeline: How Data Moves

The platform's true power lies in its orchestrated pipeline of AI agents. When a user uploads a financial document, the following highly-coordinated sequence occurs:

### Phase 1: Ingestion (Document Agent)
Implemented in `backend/app/agents/document_agent.py`.
1. **File Parsing**: Receives the raw PDF. Uses tools like PyMuPDF or pdfplumber (`parsing_service.py`) to extract text while maintaining spatial awareness (knowing which text belongs to which page and section).
2. **Chunking**: Passes the text to the `chunking_service.py`, which splits the dense financial text into smaller, overlapping, semantically coherent blocks (chunks).
3. **Embedding**: Sends these chunks to the `embedding_service.py` (which likely uses a local model or an API like OpenAI/HuggingFace) to generate dense vector embeddings.
4. **Storage**: Saves the text chunks and their corresponding vector embeddings into MongoDB for later vector retrieval.

### Phase 2: Analysis (Extraction & Red Flag Agents)
These agents operate asynchronously on the ingested data.
- **Extraction Agent (`extraction_agent.py`)**: 
  - Scans the indexed chunks specifically looking for financial tables and narrative KPIs.
  - Uses an LLM to reliably extract specific metrics (e.g., EBITDA, Total Revenue, Net Debt).
  - Normalizes the units (e.g., converting "in thousands" to a standard format).
  - Saves the structured `Metric` to the database, critically including the `chunk_id` and `page_number` to guarantee exact citations.
- **Red Flag Agent (`red_flag_agent.py`)**: 
  - Functions as an automated risk auditor.
  - Queries the extracted metrics for dangerous quantitative trends (e.g., Year-over-Year margin collapse, spiking debt-to-equity ratios).
  - Scans the raw chunks for qualitative risks (e.g., "going concern" language, auditor qualifications, pending litigation).
  - Logs `RedFlag` objects to the database with a severity score.

### Phase 3: Synthesis (Comparison, Research, & Report Agents)
These agents are typically invoked by user action.
- **Comparison Agent (`comparison_agent.py`)**:
  - Activated when a user wants to benchmark companies.
  - Fetches extracted metrics for multiple companies in a workspace, aligns their fiscal periods, and generates a normalized comparative analysis.
- **Research Agent (`research_agent.py`)**:
  - Handles the conversational RAG (Retrieval-Augmented Generation) chat interface.
  - When a user asks a question, this agent vectorizes the query, performs a semantic cosine search via `retrieval_service.py` against the MongoDB embeddings, retrieves the top-K relevant chunks, and synthesizes an answer. 
  - *Crucial Feature*: It is strictly instructed by its system prompt to answer *only* using the retrieved context and to inject source citations.
- **Report Agent (`report_agent.py`)**:
  - Gathers data from the Database (metrics, red flags, user chat history).
  - Organizes this into markdown sections.
  - Passes the structured document to the `pdf_report_service.py` (likely using a tool like WeasyPrint or Jinja2 templates) to generate a downloadable, professionally formatted PDF.

---

## 5. Security & Grounding Philosophy

FinSightAI is built on a philosophy of **strict source grounding**. 
In financial analysis, hallucinations are unacceptable. The system achieves high reliability by:
1. Disallowing the LLMs from relying on their pre-trained parametric memory.
2. Forcing the LLM to output a citation (e.g., `[Doc A, Page 12]`) for every factual claim.
3. Employing deterministic fallbacks for metric extraction (using regex and strict JSON schemas) to ensure numbers are extracted exactly as printed in the filings.

## 6. Execution Flow Example

1. **User Action**: Clicks "Upload 10-K" on the React Frontend.
2. **API Route**: `POST /api/v1/workspaces/{id}/documents` receives the file.
3. **Processing**: The route triggers a background task invoking the `DocumentAgent`.
4. **Agent Handoff**: Once `DocumentAgent` finishes, it triggers the `ExtractionAgent` and `RedFlagAgent`.
5. **UI Update**: The React frontend (polling or using WebSockets) detects the updated status and populates the dashboard with newly extracted metrics and identified risks.
6. **Querying**: User types "What are the legal risks?" in the chat window. The `ResearchAgent` executes a RAG workflow and returns a cited answer.
