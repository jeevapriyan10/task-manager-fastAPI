TASK_PAYLOAD = {"title": "Buy groceries", "description": "Milk and eggs"}


def _create_task(client, headers, payload=None):
    payload = payload or TASK_PAYLOAD
    return client.post("/tasks/", json=payload, headers=headers)


def test_create_task(client, auth_headers):
    resp = _create_task(client, auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == TASK_PAYLOAD["title"]
    assert data["completed"] is False


def test_list_tasks(client, auth_headers):
    _create_task(client, auth_headers)
    resp = client.get("/tasks/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert "pages" in data
    assert data["total"] == 1


def test_get_task(client, auth_headers):
    task_id = _create_task(client, auth_headers).json()["id"]
    resp = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == task_id


def test_update_task(client, auth_headers):
    task_id = _create_task(client, auth_headers).json()["id"]
    resp = client.put(f"/tasks/{task_id}", json={"title": "Updated title"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated title"


def test_mark_completed(client, auth_headers):
    task_id = _create_task(client, auth_headers).json()["id"]
    resp = client.put(f"/tasks/{task_id}", json={"completed": True}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["completed"] is True


def test_delete_task(client, auth_headers):
    task_id = _create_task(client, auth_headers).json()["id"]
    resp = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert resp.status_code == 204
    # Confirm it's gone
    get_resp = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_unauthenticated(client):
    resp = client.get("/tasks/")
    assert resp.status_code == 401


def test_filter_completed(client, auth_headers):
    _create_task(client, auth_headers, {"title": "Task A"})
    task_b_id = _create_task(client, auth_headers, {"title": "Task B"}).json()["id"]
    # Mark Task B complete
    client.put(f"/tasks/{task_b_id}", json={"completed": True}, headers=auth_headers)

    resp = client.get("/tasks/?completed=true", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["completed"] is True


def test_other_user_forbidden(client, auth_headers, auth_headers_2):
    # Create task as user 1
    task_id = _create_task(client, auth_headers).json()["id"]
    # Try to access as user 2
    resp = client.get(f"/tasks/{task_id}", headers=auth_headers_2)
    assert resp.status_code == 403
