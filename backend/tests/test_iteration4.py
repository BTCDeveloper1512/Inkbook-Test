"""Iteration 4: Admin Panel, Push Notifications, UI Redesign backend tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@inkbook.com", "password": "admin123"})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return s

@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@inkbook.com", "password": "test123"})
    assert r.status_code == 200, f"Customer login failed: {r.text}"
    return s

@pytest.fixture(scope="module")
def studio_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "studioowner@inkbook.com", "password": "studio123"})
    assert r.status_code == 200, f"Studio login failed: {r.text}"
    return s

# --- Admin Stats ---
class TestAdminStats:
    def test_admin_stats_returns_200(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_admin_stats_has_required_fields(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/stats")
        data = r.json()
        assert "total_studios" in data, "Missing total_studios"
        assert "total_users" in data, "Missing total_users"
        assert "total_bookings" in data, "Missing total_bookings"

    def test_admin_stats_numeric_values(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/stats")
        data = r.json()
        assert isinstance(data["total_studios"], int)
        assert isinstance(data["total_users"], int)
        assert isinstance(data["total_bookings"], int)

    def test_admin_stats_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code in [401, 403], f"Should be unauthorized, got {r.status_code}"

    def test_admin_stats_blocked_for_customer(self, customer_session):
        r = customer_session.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 403, f"Customer should be forbidden, got {r.status_code}"

# --- Admin Studios ---
class TestAdminStudios:
    def test_list_studios(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/studios")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_toggle_studio_status(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/studios")
        studios = r.json()
        if not studios:
            pytest.skip("No studios to toggle")
        studio = studios[0]
        studio_id = studio["studio_id"]
        current = studio.get("is_active", True)
        # Toggle off
        r2 = admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_active": not current})
        assert r2.status_code == 200, f"Toggle failed: {r2.text}"
        # Toggle back
        admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_active": current})

    def test_toggle_studio_verified(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/studios")
        studios = r.json()
        if not studios:
            pytest.skip("No studios to verify")
        studio = studios[0]
        studio_id = studio["studio_id"]
        current = studio.get("is_verified", False)
        r2 = admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_verified": not current})
        assert r2.status_code == 200, f"Verify toggle failed: {r2.text}"
        # Restore
        admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_verified": current})

# --- Admin Users ---
class TestAdminUsers:
    def test_list_users(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_users_have_required_fields(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users")
        users = r.json()
        if users:
            u = users[0]
            assert "email" in u or "name" in u

# --- Push Notifications ---
class TestPushNotifications:
    def test_vapid_public_key(self):
        r = requests.get(f"{BASE_URL}/api/notifications/vapid-public-key")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_vapid_public_key_has_key(self):
        r = requests.get(f"{BASE_URL}/api/notifications/vapid-public-key")
        data = r.json()
        assert "public_key" in data, f"Missing public_key in {data}"
        assert len(data["public_key"]) > 10, "public_key too short"

    def test_subscribe_requires_valid_data(self, customer_session):
        # Missing required fields should return 4xx
        r = customer_session.post(f"{BASE_URL}/api/notifications/subscribe", json={})
        assert r.status_code in [400, 422], f"Expected 400/422, got {r.status_code}"
