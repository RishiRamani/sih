# backend/tests/test_scan_auth.py
"""
Scan endpoints require auth, and each user only sees their own scans.
Uses a throwaway Mongo database (see conftest.py).
"""


def _register(api_client, email: str) -> str:
    resp = api_client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


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


def test_new_user_sees_empty_scan_list(api_client):
    token = _register(api_client, "newuser@test.com")
    resp = api_client.get("/scans", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json() == []


def test_scan_is_visible_only_to_owner(api_client):
    alice = _register(api_client, "owner-a@test.com")
    bob = _register(api_client, "owner-b@test.com")

    # Alice creates a scan
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

    # Alice sees it
    alice_list = api_client.get("/scans", headers=_auth(alice))
    assert alice_list.status_code == 200
    assert any(s["scan_id"] == scan_id for s in alice_list.json())

    # Bob does not
    bob_list = api_client.get("/scans", headers=_auth(bob))
    assert bob_list.status_code == 200
    assert all(s["scan_id"] != scan_id for s in bob_list.json())

    # Bob gets 404 on Alice's scan by ID
    resp = api_client.get(f"/scans/{scan_id}", headers=_auth(bob))
    assert resp.status_code == 404


def test_scan_findings_scoped_to_owner(api_client):
    alice = _register(api_client, "find-a@test.com")
    bob = _register(api_client, "find-b@test.com")

    create = api_client.post(
        "/scans",
        headers=_auth(alice),
        json={
            "source_type": "local",
            "source": "backend/data/demo/source/sample_repo",
        },
    ).json()
    scan_id = create["scan_id"]

    # Alice can read findings
    resp = api_client.get(f"/scans/{scan_id}/findings", headers=_auth(alice))
    assert resp.status_code == 200

    # Bob cannot
    resp = api_client.get(f"/scans/{scan_id}/findings", headers=_auth(bob))
    assert resp.status_code == 404


def test_scan_delete_scoped_to_owner(api_client):
    alice = _register(api_client, "del-a@test.com")
    bob = _register(api_client, "del-b@test.com")

    create = api_client.post(
        "/scans",
        headers=_auth(alice),
        json={
            "source_type": "local",
            "source": "backend/data/demo/source/sample_repo",
        },
    ).json()
    scan_id = create["scan_id"]

    # Bob cannot delete
    resp = api_client.delete(f"/scans/{scan_id}", headers=_auth(bob))
    assert resp.status_code == 404

    # Alice can
    resp = api_client.delete(f"/scans/{scan_id}", headers=_auth(alice))
    assert resp.status_code == 200

    # After deletion, gone
    resp = api_client.get(f"/scans/{scan_id}", headers=_auth(alice))
    assert resp.status_code == 404


def test_cbom_risk_and_recommendations_scoped_to_owner(api_client):
    alice = _register(api_client, "sub-a@test.com")
    bob = _register(api_client, "sub-b@test.com")

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
        # Alice: 200 (or 404 for cbom if not generated — still, no auth error)
        alice_resp = api_client.get(f"/scans/{scan_id}/{path}", headers=_auth(alice))
        assert alice_resp.status_code in (200, 404), alice_resp.text

        # Bob: 404 for all
        bob_resp = api_client.get(f"/scans/{scan_id}/{path}", headers=_auth(bob))
        assert bob_resp.status_code == 404, f"{path}: {bob_resp.text}"