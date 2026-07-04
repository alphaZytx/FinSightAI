install-backend:
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

run-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

install-frontend:
	cd frontend && npm install

run-frontend:
	cd frontend && npm run dev

dev:
	docker compose up --build

test-backend:
	cd backend && pytest
