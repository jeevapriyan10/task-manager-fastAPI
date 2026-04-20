# Task Manager

A full-stack task manager with **FastAPI** backend and **Vanilla JS** frontend, featuring JWT authentication, paginated task lists, and status filtering.

## Live Links

| Service | URL |
|---------|-----|
| Frontend (GitHub Pages) | `https://<your-username>.github.io/<repo-name>/frontend/` |
| API Docs (Render) | `https://<your-render-app>.onrender.com/docs` |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | SQLite (local) / PostgreSQL via Supabase (prod) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Hosting | GitHub Pages (frontend) + Render (backend) |

---

## Local Development

### Backend

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY

# 4. Start server
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
# From repo root:
cp frontend/config.example.js frontend/config.js
# config.js already points to http://localhost:8000 for local dev
```

Open `frontend/index.html` in your browser (or use VS Code Live Server).

> **Note:** `frontend/config.js` is gitignored. Each environment maintains its own copy.  
> Never commit `config.js` — it contains environment-specific URLs.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy connection string | *(required)* |
| `SECRET_KEY` | Random secret for JWT signing | *(required)* |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL in minutes | `30` |

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests use an isolated **in-memory SQLite** database. Each test function gets a fresh set of tables.

---

## Supabase Setup (Production Database)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string → URI**
3. Copy the URI into `.env` as `DATABASE_URL`
4. Tables are auto-created on first server start (`SQLAlchemy create_all`)

---

## Render Deployment (Backend)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo
3. Set **Root Directory** to `backend`
4. **Build command:** `pip install -r requirements.txt`
5. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables in the Render dashboard (from your `.env`)
7. Copy your Render service URL (e.g. `https://task-manager-xyz.onrender.com`)

---

## GitHub Pages Deployment (Frontend)

1. **Update `frontend/config.js`** on your local machine:

   ```js
   // frontend/config.js  ← gitignored, NOT committed
   window.API_BASE_URL = "https://task-manager-xyz.onrender.com";
   ```

   > `config.js` is gitignored, so you need to set this directly on the GitHub Pages
   > source branch or use a CI step to generate it. The simplest approach:
   >
   > **CI / GitHub Actions approach:** Add a workflow that generates `config.js` from a
   > repository secret (`BACKEND_URL`) before deploying to Pages.
   >
   > **Manual approach:** Temporarily remove `frontend/config.js` from `.gitignore`,
   > commit it once with the production URL, then re-add the ignore rule.

2. Go to **Repo Settings → Pages → Source:** `Deploy from branch` → `main` → `/frontend`
3. Your frontend will be live at `https://<username>.github.io/<repo>/`

---

## Project Structure

```
task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # pydantic-settings (reads .env)
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # User & Task ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── security.py      # bcrypt + JWT helpers
│   │   ├── dependencies.py  # get_db, get_current_user
│   │   └── routers/
│   │       ├── auth.py      # POST /auth/register, /auth/login
│   │       └── tasks.py     # CRUD /tasks/
│   ├── tests/
│   │   ├── conftest.py      # fixtures (test DB, TestClient, auth headers)
│   │   ├── test_auth.py     # 6 auth test cases
│   │   └── test_tasks.py    # 9 task test cases
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html           # SPA — two sections (auth + dashboard)
│   ├── style.css            # Dark-mode, card layout, responsive
│   ├── app.js               # All JS logic; reads window.API_BASE_URL
│   └── config.example.js   # Template — copy to config.js (gitignored)
└── README.md
```

---

Full interactive docs at `/docs`.
