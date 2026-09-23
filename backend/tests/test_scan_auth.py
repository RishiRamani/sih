# backend/tests/test_scan_auth.py
"""
Scan endpoints require auth, and each user only sees their own scans.
Email sending is monkeypatched so tests never call Resend.
"""

import pytest


@pytest.fixture(autouse=True)
def stub_email(monkeypatch):
    captured: dict[str, str] = {}

    def fake_send(to_email: str, otp: str) -> None:
        captured[to_email] = otp

    from backend.auth import email as email_module
    monkeypatch.setattr(email_module, "send_otp_email", fake_send)

    from backend.auth import routes as routes_module
    monkeypatch.setattr(routes_module, "send_otp_email", fake_send)

    return captured


def _register_and_verify(api_client, stub_email, email: str) -> str:
    """Register, grab the OTP, verify, return the JWT."""
    api_client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    otp = stub_email[email]
    resp = api_client.post(
        "/auth/verify-otp",
        json={"email": email, "otp": otp},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ----------------------------------------------------------------------
# Auth required
# ----------------------------------------------------------------------

def test_list_scans_requires_auth(api_client):
    resp = api_client.get("/scans")
    assert resp.status_code == 401


def test_create_scan_requires_auth(api_client):
    resp = api_client.post(
        "/scans",
        json={
            "source_type": "local",
            "source": "backend/data/demo/source/sample_repo",
        },
    )
    assert resp.status_code == 401


def test_new_user_sees_empty_scan_list(api_client, stub_email):
    token = _register_and_verify(api_client, stub_email, "empty@test.com")
    resp = api_client.get("/scans", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json() == []


# ----------------------------------------------------------------------
# Ownership
# ----------------------------------------------------------------------

def test_scan_is_visible_only_to_owner(api_client, stub_email):
    alice = _register_and_verify(api_client, stub_email, "owner-a@test.com")
    bob = _register_and_verify(api_client, stub_email, "owner-b@test.com")

    create = api_client.post(
        "/scans",
        headers=_auth(alice),
        json={
            "source_type": "local",
            "source": "backend/data/demo/source/sample_repo",
        },
    )
    assert create.status_code == 200, create.text
    scan_id = create.json()["scan_id"]

    alice_list = api_client.get("/scans", headers=_auth(alice))
    assert alice_list.status_code == 200
    assert any(s["scan_id"] == scan_id for s in alice_list.json())

    bob_list = api_client.get("/scans", headers=_auth(bob))
    assert bob_list.status_code == 200
    assert all(s["scan_id"] != scan_id for s in bob_list.json())

    resp = api_client.get(f"/scans/{scan_id}", headers=_auth(bob))
    assert resp.status_code == 404


def test_scan_findings_scoped_to_owner(api_client, stub_email):
    alice = _register_and_verify(api_client, stub_email, "find-a@test.com")
    bob = _register_and_verify(api_client, stub_email, "find-b@test.com")

    create = api_client.post(
        "/scans",
        headers=_auth(alice),
        json={
            "source_type": "local",
            "source": "backend/data/demo/source/sample_repo",
        },
    ).json()
    scan_id = create["scan_id"]

    resp = api_client.get(f"/scans/{scan_id}/findings", headers=_auth(alice))
    assert resp.status_code == 200

    resp = api_client.get(f"/scans/{scan_id}/findings", headers=_auth(bob))
    assert resp.status_code == 404


def test_scan_delete_scoped_to_owner(api_client, stub_email):
    alice = _register_and_verify(api_client, stub_email, "del-a@test.com")
    bob = _register_and_verify(api_client, stub_email, "del-b@test.com")

    create = api_client.post(
        "/scans",
        headers=_auth(alice),
        json={
            "source_type": "local",
            "source": "backend/data/demo/source/sample_repo",
        },
    ).json()
    scan_id = create["scan_id"]

    resp = api_client.delete(f"/scans/{scan_id}", headers=_auth(bob))
    assert resp.status_code == 404

    resp = api_client.delete(f"/scans/{scan_id}", headers=_auth(alice))
    assert resp.status_code == 200

    resp = api_client.get(f"/scans/{scan_id}", headers=_auth(alice))
    assert resp.status_code == 404


def test_cbom_risk_and_recommendations_scoped_to_owner(api_client, stub_email):
    alice = _register_and_verify(api_client, stub_email, "sub-a@test.com")
    bob = _register_and_verify(api_client, stub_email, "sub-b@test.com")

    create = api_client.post(
        "/scans",
        headers=_auth(alice),
        json={
            "source_type": "local",
            "source": "backend/data/demo/source/sample_repo",
        },
    ).json()
    scan_id = create["scan_id"]

    for path in ("cbom", "risk", "recommendations", "report"):
        alice_resp = api_client.get(f"/scans/{scan_id}/{path}", headers=_auth(alice))
        assert alice_resp.status_code in (200, 404), alice_resp.text

        bob_resp = api_client.get(f"/scans/{scan_id}/{path}", headers=_auth(bob))
        assert bob_resp.status_code == 404, f"{path}: {bob_resp.text}"