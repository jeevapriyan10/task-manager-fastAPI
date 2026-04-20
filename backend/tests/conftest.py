import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.dependencies import get_db
from app.main import app

# ── In-memory SQLite for tests ─────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# ── Reusable test user data ────────────────────────────────────────────────────
TEST_USER = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
}

TEST_USER_2 = {
    "email": "other@example.com",
    "username": "otheruser",
    "password": "otherpass123",
}


@pytest.fixture
def auth_headers(client):
    client.post("/auth/register", json=TEST_USER)
    resp = client.post("/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_2(client):
    """Headers for a second, independent user."""
    client.post("/auth/register", json=TEST_USER_2)
    resp = client.post("/auth/login", json={"email": TEST_USER_2["email"], "password": TEST_USER_2["password"]})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
