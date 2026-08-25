# LifeAdmin

A personal life-administration platform to keep track of warranties, renewals, subscriptions, and other time-sensitive obligations.

## Prototype 1: Warranty & Renewal Tracker

Create, view, edit, delete, and manage warranty/renewal records with automatic expiry tracking.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI + SQLAlchemy
- **Database**: PostgreSQL 16

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env  # if .env doesn't exist
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Visit [http://localhost:5173](http://localhost:5173)

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://lifeadmin:lifeadmin@localhost:5432/lifeadmin` | PostgreSQL connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |
| `SEED_DATA` | `true` | Seed demo data on first run |
