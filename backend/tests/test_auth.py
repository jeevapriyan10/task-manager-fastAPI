from tests.conftest import TEST_USER


def test_register_success(client):
    resp = client.post("/auth/register", json=TEST_USER)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == TEST_USER["email"]
    assert data["username"] == TEST_USER["username"]
    assert "id" in data
    assert "password" not in data


def test_register_duplicate_email(client):
    client.post("/auth/register", json=TEST_USER)
    resp = client.post("/auth/register", json=TEST_USER)
    assert resp.status_code == 409
    assert "Email already registered" in resp.json()["detail"]


def test_register_duplicate_username(client):
    client.post("/auth/register", json=TEST_USER)
    payload = {**TEST_USER, "email": "other@example.com"}
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 409
    assert "Username already taken" in resp.json()["detail"]


def test_login_success(client):
    client.post("/auth/register", json=TEST_USER)
    resp = client.post("/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/auth/register", json=TEST_USER)
    resp = client.post("/auth/login", json={"email": TEST_USER["email"], "password": "wrongpassword"})
    assert resp.status_code == 401


def test_login_nonexistent_user(client):
    resp = client.post("/auth/login", json={"email": "nobody@example.com", "password": "whatever"})
    assert resp.status_code == 401
