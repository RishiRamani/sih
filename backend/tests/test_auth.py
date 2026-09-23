# backend/tests/test_auth.py
"""
Auth tests: register, login, /me, duplicate email, invalid credentials.
Uses a throwaway Mongo database (see conftest.py).
"""


def test_register_returns_token(api_client):
    resp = api_client.post(
        "/auth/register",
        json={"email": "alice@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["email"] == "alice@test.com"
    assert body["user_id"].startswith("usr_")
    assert isinstance(body["token"], str) and len(body["token"]) > 20


def test_register_duplicate_email_returns_409(api_client):
    api_client.post(
        "/auth/register",
        json={"email": "bob@test.com", "password": "testpass123"},
    )
    resp = api_client.post(
        "/auth/register",
        json={"email": "bob@test.com", "password": "anotherpass123"},
    )
    assert resp.status_code == 409


def test_register_short_password_rejected(api_client):
    resp = api_client.post(
        "/auth/register",
        json={"email": "short@test.com", "password": "abc"},
    )
    assert resp.status_code == 422


def test_register_invalid_email_rejected(api_client):
    resp = api_client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "testpass123"},
    )
    assert resp.status_code == 422


def test_login_success(api_client):
    api_client.post(
        "/auth/register",
        json={"email": "carol@test.com", "password": "testpass123"},
    )
    resp = api_client.post(
        "/auth/login",
        json={"email": "carol@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password_returns_401(api_client):
    api_client.post(
        "/auth/register",
        json={"email": "dan@test.com", "password": "testpass123"},
    )
    resp = api_client.post(
        "/auth/login",
        json={"email": "dan@test.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_returns_401(api_client):
    resp = api_client.post(
        "/auth/login",
        json={"email": "nobody@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 401


def test_me_returns_current_user(api_client):
    reg = api_client.post(
        "/auth/register",
        json={"email": "erin@test.com", "password": "testpass123"},
    ).json()
    resp = api_client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {reg['token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "erin@test.com"


def test_me_without_token_returns_401(api_client):
    resp = api_client.get("/auth/me")
    assert resp.status_code == 401


def test_me_with_bad_token_returns_401(api_client):
    resp = api_client.get(
        "/auth/me",
        headers={"Authorization": "Bearer garbage.token.here"},
    )
    assert resp.status_code == 401


def test_me_with_malformed_header_returns_401(api_client):
    resp = api_client.get(
        "/auth/me",
        headers={"Authorization": "NotBearer sometoken"},
    )
    assert resp.status_code == 401