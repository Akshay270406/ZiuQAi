# ZiuQAI — Intelligent AI Quiz Platform

**ZiuQAI** is an end-to-end, intelligent platform designed to automatically generate, host, participate in, and evaluate dynamic quizzes from custom learning materials (PDFs, text files, and web resources) using Retrieval-Augmented Generation (RAG) and stateful AI orchestration.

---

## 🌟 Key Features

- 🤖 **AI-Powered Quiz Generation**: Upload reference documents (PDFs/TXT) and let the AI generate high-quality quizzes tailored to your topic and difficulty.
- 🎯 **Diverse Question Formats**: Formulates Multiple Choice (MCQ), Single Choice (SCQ), True/False (TOF), and Fill-in-the-Blank (FIB) questions with automated schema validation and retry loops.
- 📝 **Drafts & Publishing Workflow**: Save quiz configurations as drafts, manage reference materials, preview questions, and publish when ready.
- ⏱️ **Real-Time Registration & Attempting**: Participant registration, countdown timers, time-bounded quiz attempts, and answer submissions.
- 🏆 **Live Leaderboards**: Auto-evaluates submissions and locks/unlocks live participant standings based on quiz duration rules.

---

## 🛠️ Technology Stack & Rationale

| Layer | Technology | Reason for Selection |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous performance, automatic OpenAPI documentation, and native Pydantic integration. |
| **Database & ORM** | **PostgreSQL + SQLAlchemy 2.0 (Async) + `pgvector`** | Robust relational persistence with vector capabilities for future context similarity searching. |
| **AI Engine** | **LangGraph + LangChain + Google Gemini API** | Stateful, multi-step orchestration pipeline allowing self-correction, retries, and document token cap management. |
| **Document Processing** | **PyMuPDF (`fitz`)** | Fast and accurate text parsing from uploaded PDF files. |
| **Frontend Framework** | **React + Vite** | Lightweight Single-Page Application (SPA) with fast modern development HMR. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | Responsive, modern utility-first CSS supporting dark mode and glassmorphism UI components. |

---

## 📂 Project Structure

```text
_ZiuQAI/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints & route versioning
│   │   ├── ai_engine/       # LangGraph AI orchestration workflow
│   │   ├── core/            # Database engine, JWT security & middlewares
│   │   ├── models/          # Type-annotated SQLAlchemy models
│   │   ├── repositories/    # Data Access Object pattern (SQL queries)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Domain business logic (Auth, Quiz, Ingestion)
│   │   └── app.py           # FastAPI application entry point
│   ├── tests/               # Pytest suite
│   ├── env/                 # Environment configuration files
│   └── main.py              # Server execution entry point
│
└── frontend/
    ├── src/
    │   ├── api/             # API client services (authApi, quizApi, ingestApi)
    │   ├── components/      # UI components (Auth, Dashboard, Generate, Arena)
    │   ├── context/         # React Contexts (Auth, Theme)
    │   ├── pages/           # Application views (Home, Dashboard, Host, Attempt, Arena)
    │   └── utils/           # Axios client instance & protected route wrappers
```

---

## ⚙️ Environment Variables Setup

Create your environment files in `backend/env/`:

### `backend/env/backend.env`
```env
API_PREFIX=/api
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
GOOGLE_API_KEY=your_google_gemini_api_key_here
JWT_SECRET=your_custom_jwt_secret_key_here
```

### `backend/env/db.env`
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ziuqai
SYNC_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ziuqai
```

---

## 🚀 Running Locally

### 1. Database Setup
Ensure PostgreSQL is running with the `vector` extension enabled:
```sql
CREATE DATABASE ziuqai;
\c ziuqai;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```
The API documentation will be accessible at: `http://localhost:8080/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run the backend test suite:
```bash
cd backend
python -m pytest tests/
```

---

## 📖 REST API Endpoint Summary

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/auth/register` | `POST` | Register a new user account |
| **Auth** | `/auth/login` | `POST` | Authenticate user and issue HTTP-only JWT cookie |
| **Auth** | `/auth/logout` | `POST` | Clear access token cookie |
| **Auth** | `/auth/me` | `GET` | Fetch authenticated user profile |
| **Quizzes** | `/quizzes/create` | `POST` | Create a new quiz draft |
| **Quizzes** | `/quizzes/my-quizzes` | `GET` | Get all quizzes created by current user |
| **Quizzes** | `/quizzes/my-drafts` | `GET` | Get draft quizzes with resource counts |
| **Quizzes** | `/quizzes/{quiz_id}` | `GET` | Get details & registration status |
| **Quizzes** | `/quizzes/{quiz_id}/publish` | `POST` | Publish quiz and cleanup uploaded raw files |
| **Quizzes** | `/quizzes/{quiz_id}/register`| `POST` | Register participant for a quiz |
| **Quizzes** | `/quizzes/{quiz_id}/generate`| `POST` | Trigger AI generation graph on uploaded resources |
| **Quizzes** | `/quizzes/{quiz_id}/attempt/questions` | `GET` | Fetch questions for active attempt (without answers) |
| **Quizzes** | `/quizzes/{quiz_id}/attempt/submit` | `POST` | Submit attempt responses and calculate score |
| **Quizzes** | `/quizzes/{quiz_id}/leaderboard` | `GET` | View standings (locked during active duration) |
| **Ingest** | `/ingest/upload` | `POST` | Upload file resource for a quiz draft |
| **Ingest** | `/ingest/resources/{quiz_id}` | `GET` | List uploaded files for a quiz draft |

---

## 🏛️ Design Decisions & Clean Code Standards

- **Clean Architecture & SOLID**: Enforces Single Responsibility, Open/Closed provider selection, and Data Access isolation.
- **Repository Pattern**: All database interactions are decoupled into repository modules, allowing transparent schema updates and easy mocking.
- **Dual API Aliases**: `/quizzes` (standard) and `/quizes` (legacy) endpoints are dual-mounted to maintain 100% backward compatibility.
- **Strict Validation**: All payloads validated using Pydantic v2 and typed parameters.

---

## 🤝 Contribution & License

Contributions are welcome! Please ensure all unit tests pass (`pytest tests/`) and follow the existing directory and code style conventions.

Licensed under the MIT License.