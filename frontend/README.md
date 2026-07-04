# FinSightAI Frontend

React/Vite interface for workspace management, document upload, cited research chat, company comparison, and report generation.

## Run Locally on Windows PowerShell

```powershell
# Navigate to the frontend directory from the project root
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Backend URL

The frontend defaults to:

```text
http://localhost:8000/api/v1
```

Override it with `.env.local` if needed:

```powershell
Set-Content .env.local "VITE_API_BASE_URL=http://localhost:8000/api/v1"
```

## Production Build

```powershell
npm run build
npm run preview
```

The app expects the backend health endpoint at `http://localhost:8000/health` and API routes under `/api/v1`.