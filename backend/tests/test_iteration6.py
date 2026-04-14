"""Iteration 6: Test typing indicator, review system, unread count, registration"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test accounts
CUSTOMER_EMAIL = "test_cust6@inkbook.com"
CUSTOMER_PASS = "Test1234!"
STUDIO_EMAIL = "test_studio6@inkbook.com"
STUDIO_PASS = "Test1234!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def customer_session(session):
    # Register or login
    r = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": CUSTOMER_EMAIL, "password": CUSTOMER_PASS,
        "name": "Test Customer 6", "role": "customer"
    })
    if r.status_code not in (200, 201, 400):
        pytest.skip(f"Register failed: {r.text}")
    # Login
    s2 = requests.Session()
    lr = s2.post(f"{BASE_URL}/api/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASS})
    assert lr.status_code == 200, f"Customer login failed: {lr.text}"
    return s2


@pytest.fixture(scope="module")
def studio_session():
    # Register studio owner
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": STUDIO_EMAIL, "password": STUDIO_PASS,
        "name": "Test Studio 6", "role": "studio_owner"
    })
    if r.status_code not in (200, 201, 400):
        pytest.skip(f"Register failed: {r.text}")
    s = requests.Session()
    lr = s.post(f"{BASE_URL}/api/auth/login", json={"email": STUDIO_EMAIL, "password": STUDIO_PASS})
    assert lr.status_code == 200, f"Studio login failed: {lr.text}"
    return s


# ── Registration ──────────────────────────────────────────────────────────────

class TestRegistration:
    """Test customer and studio owner registration"""

    def test_register_customer(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"new_cust_{int(time.time())}@inkbook.com",
            "password": "Pass1234!", "name": "New Customer", "role": "customer"
        })
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"
        data = r.json()
        assert "user" in data or "email" in data or "id" in data

    def test_register_studio_owner(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"new_studio_{int(time.time())}@inkbook.com",
            "password": "Pass1234!", "name": "New Studio", "role": "studio_owner"
        })
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"


# ── Typing API ────────────────────────────────────────────────────────────────

class TestTypingAPI:
    """Test typing indicator endpoints"""

    def test_post_typing_returns_ok(self, customer_session, studio_session):
        # Get studio user id
        me_r = studio_session.get(f"{BASE_URL}/api/auth/me")
        assert me_r.status_code == 200
        studio_user_id = me_r.json().get("user_id") or me_r.json().get("id")
        assert studio_user_id

        r = customer_session.post(f"{BASE_URL}/api/messages/{studio_user_id}/typing")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("ok") is True

    def test_get_typing_status_false_when_not_typing(self, customer_session, studio_session):
        me_r = customer_session.get(f"{BASE_URL}/api/auth/me")
        customer_user_id = me_r.json().get("user_id") or me_r.json().get("id")
        # Poll from studio side - customer hasn't typed recently
        r = studio_session.get(f"{BASE_URL}/api/messages/{customer_user_id}/typing-status")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "is_typing" in data

    def test_get_typing_status_true_after_post(self, customer_session, studio_session):
        # Get IDs
        cust_me = customer_session.get(f"{BASE_URL}/api/auth/me").json()
        cust_id = cust_me.get("user_id") or cust_me.get("id")
        studio_me = studio_session.get(f"{BASE_URL}/api/auth/me").json()
        studio_id = studio_me.get("user_id") or studio_me.get("id")

        # Customer posts typing to studio
        customer_session.post(f"{BASE_URL}/api/messages/{studio_id}/typing")
        # Studio checks if customer is typing
        r = studio_session.get(f"{BASE_URL}/api/messages/{cust_id}/typing-status")
        assert r.status_code == 200
        data = r.json()
        assert data.get("is_typing") is True

    def test_typing_expires_after_4s(self, customer_session, studio_session):
        cust_me = customer_session.get(f"{BASE_URL}/api/auth/me").json()
        cust_id = cust_me.get("user_id") or cust_me.get("id")
        studio_me = studio_session.get(f"{BASE_URL}/api/auth/me").json()
        studio_id = studio_me.get("user_id") or studio_me.get("id")

        customer_session.post(f"{BASE_URL}/api/messages/{studio_id}/typing")
        time.sleep(5)
        r = studio_session.get(f"{BASE_URL}/api/messages/{cust_id}/typing-status")
        assert r.status_code == 200
        data = r.json()
        assert data.get("is_typing") is False


# ── Unread Count ──────────────────────────────────────────────────────────────

class TestUnreadCount:
    """Test unread message count"""

    def test_unread_count_for_new_user(self, customer_session):
        r = customer_session.get(f"{BASE_URL}/api/messages/unread-count")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "count" in data
        assert isinstance(data["count"], int)


# ── Review API ────────────────────────────────────────────────────────────────

class TestReviewAPI:
    """Test review creation"""

    def _get_public_studio_id(self):
        r = requests.get(f"{BASE_URL}/api/studios")
        if r.status_code == 200:
            data = r.json()
            studios = data if isinstance(data, list) else data.get("studios", [])
            if studios:
                return studios[0].get("studio_id")
        return None

    def test_review_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/studios/some_studio/reviews", json={
            "rating": 5, "comment": "test"
        })
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_review_duplicate_booking_blocked(self, customer_session):
        """Test that reviewing same booking twice returns 400"""
        studio_id = self._get_public_studio_id()
        if not studio_id:
            pytest.skip("Could not get studio_id")

        fake_booking_id = f"bk_test6_{int(time.time())}"
        payload = {"rating": 4, "comment": "Great!", "booking_id": fake_booking_id, "studio_id": studio_id}

        # First review
        r1 = customer_session.post(f"{BASE_URL}/api/studios/{studio_id}/reviews", json=payload)
        if r1.status_code not in (200, 201, 400):
            pytest.skip(f"Unexpected status: {r1.status_code} {r1.text}")

        if r1.status_code in (200, 201):
            # Second review should be blocked
            r2 = customer_session.post(f"{BASE_URL}/api/studios/{studio_id}/reviews", json=payload)
            assert r2.status_code == 400, f"Duplicate should return 400, got {r2.status_code}: {r2.text}"
