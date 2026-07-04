# FinSightAI Backend

FastAPI backend for PDF upload, parsing, chunking, deterministic embeddings, metric extraction, red-flag detection, cited retrieval, comparison, and PDF report generation.

## Requirements

- Python 3.11
- MongoDB on `mongodb://localhost:27017`
- `.env` copied from the project root `.env.example`

## Run Locally on Windows PowerShell

```powershell
cd C:\Users\Abhinav\Downloads\FinSightAI_Project_Skeleton\FinSightAI_Project_Skeleton\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```

Check:

- Health: http://localhost:8000/health
- API docs: http://localhost:8000/docs

## Start MongoDB Quickly

```powershell
docker run --name finsight-mongo -p 27017:27017 -d mongo:7
```

If the container already exists:

```powershell
docker start finsight-mongo
```

## Optional AI Packages

The default `requirements.txt` runs the MVP. Install `requirements-ai.txt` only when adding LangChain and heavier parsing/data tooling:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-ai.txt
```

## Useful Scripts

```powershell
python ..\scripts\reindex_workspace.py doc_abc123
python ..\scripts\generate_sample_report.py ws_abc123 --title "Demo Analyst Report"
python ..\scripts\seed_demo_documents.py ws_abc123 --company "Demo Company"
```
## Troubleshooting

If downloads are slow or time out:

```powershell
.\.venv\Scripts\python.exe -m pip install --timeout 120 --retries 10 -r requirements.txt
```

If the backend starts but uploads fail, confirm MongoDB is running and `MONGO_URI` points to it.