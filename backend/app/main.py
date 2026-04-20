from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import traceback
        print("\n[STARTUP ERROR] Failed to connect to database or create tables:")
        traceback.print_exc()
        raise
    yield
    # Shutdown: nothing needed


app = FastAPI(
    title="Task Manager API",
    description="FastAPI + SQLAlchemy task manager with JWT authentication",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth")
app.include_router(tasks.router, prefix="/tasks")


@app.get("/", tags=["root"])
def root():
    return {"message": "Task Manager API", "docs": "/docs"}
