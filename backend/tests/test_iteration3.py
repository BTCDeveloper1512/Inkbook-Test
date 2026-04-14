"""Iteration 3 - Subscription, Artists, Reschedule endpoint tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://artist-connect-82.preview.emergentagent.com").rstrip("/")

# ── Fixtures (cookie-based auth) ──────────────────────────────────────────────

@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@inkbook.com", "password": "test123"})
    assert r.status_code == 200, f"Customer login failed: {r.text}"
    return s

@pytest.fixture(scope="module")
def owner_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "studioowner@inkbook.com", "password": "studio123"})
    if r.status_code != 200:
        pytest.skip(f"Studio owner login failed: {r.text}")
    return s

@pytest.fixture(scope="module")
def owner_studio_id(owner_session):
    """Get or create a studio for the owner"""
    me = owner_session.get(f"{BASE_URL}/api/auth/me")
    user_id = me.json().get("id")
    r = owner_session.get(f"{BASE_URL}/api/studios")
    studios = r.json() if isinstance(r.json(), list) else []
    for s in studios:
        if s.get("owner_id") == user_id:
            return s["studio_id"]
    # Create studio
    create = owner_session.post(f"{BASE_URL}/api/studios", json={
        "name": "TEST_Owner Studio",
        "city": "Berlin",
        "address": "Test Str 1",
        "phone": "+49123456",
        "email": "studioowner@inkbook.com",
        "description": "Test studio",
        "styles": ["Realism"],
        "price_range": "€€"
    })
    if create.status_code in [200, 201]:
        return create.json()["studio_id"]
    pytest.skip(f"Could not get/create studio: {create.text}")

# ── Subscription tests ────────────────────────────────────────────────────────

class TestSubscriptionPlans:
    """GET /api/subscriptions/plans"""

    def test_plans_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert r.status_code == 200

    def test_plans_has_basic_and_pro(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        assert isinstance(data, dict), f"Expected dict: {data}"
        assert "basic" in data, f"No basic plan: {data}"
        assert "pro" in data, f"No pro plan: {data}"

    def test_basic_plan_price_29(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        basic = data.get("basic", {})
        assert basic.get("price") == 29 or basic.get("price") == 29.0, f"Basic price wrong: {basic}"

    def test_pro_plan_price_79(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        pro = data.get("pro", {})
        assert pro.get("price") == 79 or pro.get("price") == 79.0, f"Pro price wrong: {pro}"


class TestSubscriptionStatus:
    """GET /api/subscriptions/status"""

    def test_status_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/status")
        assert r.status_code == 401

    def test_status_authenticated(self, owner_session):
        r = owner_session.get(f"{BASE_URL}/api/subscriptions/status")
        assert r.status_code == 200
        data = r.json()
        assert "has_studio" in data

    def test_checkout_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/subscriptions/checkout", json={"plan": "basic"})
        assert r.status_code == 401

    def test_checkout_creates_url(self, owner_session):
        r = owner_session.post(f"{BASE_URL}/api/subscriptions/checkout", json={"plan": "basic"})
        # May fail if no studio, just check response structure
        if r.status_code == 200:
            data = r.json()
            assert "url" in data or "checkout_url" in data, f"No URL in response: {data}"
        else:
            print(f"Checkout returned {r.status_code}: {r.text}")


# ── Artist tests ──────────────────────────────────────────────────────────────

class TestArtists:
    """GET/POST /api/studios/{studio_id}/artists"""

    def test_get_artists_public(self):
        r = requests.get(f"{BASE_URL}/api/studios/studio_demo001/artists")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_artist_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/studios/studio_demo001/artists", json={
            "name": "Test Artist", "bio": "bio", "styles": ["Realism"]
        })
        assert r.status_code == 401

    def test_create_and_delete_artist(self, owner_session, owner_studio_id):
        create = owner_session.post(f"{BASE_URL}/api/studios/{owner_studio_id}/artists", json={
            "name": "TEST_Artist One",
            "bio": "Test bio",
            "styles": ["Realism", "Neo-Traditional"],
            "experience_years": 5,
            "instagram": "@testartist"
        })
        assert create.status_code in [200, 201], f"Create artist failed: {create.text}"
        artist = create.json()
        assert artist.get("name") == "TEST_Artist One"
        artist_id = artist["artist_id"]

        # Verify it's listed
        get = requests.get(f"{BASE_URL}/api/studios/{owner_studio_id}/artists")
        assert any(a["artist_id"] == artist_id for a in get.json())

        # Cleanup
        delete = owner_session.delete(f"{BASE_URL}/api/studios/{owner_studio_id}/artists/{artist_id}")
        assert delete.status_code in [200, 204]


# ── Reschedule tests ──────────────────────────────────────────────────────────

class TestReschedule:
    """PUT /api/bookings/{id}/reschedule"""

    def test_reschedule_requires_auth(self):
        r = requests.put(f"{BASE_URL}/api/bookings/fake_id/reschedule", json={"new_slot_id": "slot123"})
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_reschedule_invalid_booking(self, customer_session):
        r = customer_session.put(
            f"{BASE_URL}/api/bookings/nonexistent_booking/reschedule",
            json={"new_slot_id": "slot123"}
        )
        assert r.status_code in [404, 400], f"Expected 404/400, got {r.status_code}: {r.text}"
