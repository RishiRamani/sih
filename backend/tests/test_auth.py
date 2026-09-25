# backend/tests/test_auth.py
"""
Auth tests: register, verify-otp, resend-otp, login, /me.
Email sending is monkeypatched so tests never call Resend.
Uses a throwaway Mongo database (see conftest.py).
"""

import pytest


@pytest.fixture(autouse=True)
def stub_email(monkeypatch):
    """
    Replace send_otp_email with a no-op that records the OTP in memory.
    Tests can inspect `captured_otps`.
    """
    captured: dict[str, str] = {}

    def fake_send(to_email: str, otp: str) -> None:
        captured[to_email] = otp

    from backend.auth import email as email_module
    monkeypatch.setattr(email_module, "send_otp_email", fake_send)

    # Also patch the name already imported into routes
    from backend.auth import routes as routes_module
    monkeypatch.setattr(routes_module, "send_otp_email", fake_send)

    return captured


# ----------------------------------------------------------------------
# register
# ----------------------------------------------------------------------

def test_register_returns_otp_sent(api_client, stub_email):
    resp = api_client.post(
        "/auth/register",
        json={"email": "alice@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "otp_sent"
    assert body["email"] == "alice@test.com"
    assert "token" not in body
    assert "alice@test.com" in stub_email


def test_register_duplicate_verified_email_returns_409(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "dup@test.com", "password": "testpass123"},
    )
    otp = stub_email["dup@test.com"]
    api_client.post(
        "/auth/verify-otp",
        json={"email": "dup@test.com", "otp": otp},
    )

    resp = api_client.post(
        "/auth/register",
        json={"email": "dup@test.com", "password": "newpass123"},
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


# ----------------------------------------------------------------------
# verify-otp
# ----------------------------------------------------------------------

def test_verify_otp_success(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "verify@test.com", "password": "testpass123"},
    )
    otp = stub_email["verify@test.com"]

    resp = api_client.post(
        "/auth/verify-otp",
        json={"email": "verify@test.com", "otp": otp},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["email"] == "verify@test.com"
    assert body["user_id"].startswith("usr_")
    assert isinstance(body["token"], str) and len(body["token"]) > 20


def test_verify_otp_wrong_code_returns_401(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "wrong@test.com", "password": "testpass123"},
    )

    resp = api_client.post(
        "/auth/verify-otp",
        json={"email": "wrong@test.com", "otp": "000000"},
    )
    assert resp.status_code == 401
    assert "attempts remaining" in resp.json()["detail"].lower()


def test_verify_otp_unknown_email_returns_404(api_client):
    resp = api_client.post(
        "/auth/verify-otp",
        json={"email": "nobody@test.com", "otp": "123456"},
    )
    assert resp.status_code == 404


def test_verify_otp_after_verified_returns_409(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "twice@test.com", "password": "testpass123"},
    )
    otp = stub_email["twice@test.com"]
    api_client.post(
        "/auth/verify-otp",
        json={"email": "twice@test.com", "otp": otp},
    )

    resp = api_client.post(
        "/auth/verify-otp",
        json={"email": "twice@test.com", "otp": otp},
    )
    assert resp.status_code == 409


def test_verify_otp_max_attempts_returns_429(api_client, stub_email):
    from backend.core.config import settings

    api_client.post(
        "/auth/register",
        json={"email": "lockout@test.com", "password": "testpass123"},
    )

    for _ in range(settings.OTP_MAX_ATTEMPTS):
        api_client.post(
            "/auth/verify-otp",
            json={"email": "lockout@test.com", "otp": "000000"},
        )

    resp = api_client.post(
        "/auth/verify-otp",
        json={"email": "lockout@test.com", "otp": stub_email["lockout@test.com"]},
    )
    assert resp.status_code == 429


# ----------------------------------------------------------------------
# resend-otp
# ----------------------------------------------------------------------

def test_resend_otp_respects_cooldown(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "cooldown@test.com", "password": "testpass123"},
    )

    resp = api_client.post(
        "/auth/resend-otp",
        json={"email": "cooldown@test.com"},
    )
    assert resp.status_code == 429
    assert "wait" in resp.json()["detail"].lower()


def test_resend_otp_unknown_email_is_silent(api_client):
    resp = api_client.post(
        "/auth/resend-otp",
        json={"email": "ghost@test.com"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "otp_sent"


# ----------------------------------------------------------------------
# login
# ----------------------------------------------------------------------

def test_login_before_verification_returns_403(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "unverified@test.com", "password": "testpass123"},
    )

    resp = api_client.post(
        "/auth/login",
        json={"email": "unverified@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 403
    assert "not verified" in resp.json()["detail"].lower()


def test_login_after_verification_returns_token(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "login@test.com", "password": "testpass123"},
    )
    otp = stub_email["login@test.com"]
    api_client.post(
        "/auth/verify-otp",
        json={"email": "login@test.com", "otp": otp},
    )

    resp = api_client.post(
        "/auth/login",
        json={"email": "login@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password_returns_401(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "wrongpw@test.com", "password": "testpass123"},
    )
    otp = stub_email["wrongpw@test.com"]
    api_client.post(
        "/auth/verify-otp",
        json={"email": "wrongpw@test.com", "otp": otp},
    )

    resp = api_client.post(
        "/auth/login",
        json={"email": "wrongpw@test.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_returns_401(api_client):
    resp = api_client.post(
        "/auth/login",
        json={"email": "nobody@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 401


# ----------------------------------------------------------------------
# /me
# ----------------------------------------------------------------------

def test_me_returns_current_user(api_client, stub_email):
    api_client.post(
        "/auth/register",
        json={"email": "me@test.com", "password": "testpass123"},
    )
    otp = stub_email["me@test.com"]
    token = api_client.post(
        "/auth/verify-otp",
        json={"email": "me@test.com", "otp": otp},
    ).json()["token"]

    resp = api_client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "me@test.com"
    assert body["is_verified"] is True


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