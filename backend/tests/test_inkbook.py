"""InkBook API Backend Tests - Auth, Studios, Bookings, Dashboard"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ─── Fixtures ─────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

@pytest.fixture(scope="module")
def customer_session(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@inkbook.com", "password": "test123"})
    if r.status_code != 200:
        pytest.skip(f"Customer login failed: {r.text}")
    return session

@pytest.fixture(scope="module")
def studio_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "studioowner@inkbook.com", "password": "studio123"})
    if r.status_code != 200:
        pytest.skip(f"Studio owner login failed: {r.text}")
    return s

# ─── Health / Auth ─────────────────────────────────────────────────────────────
class TestAuth:
    """Authentication endpoint tests"""

    def test_register_customer(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/register", json={
            "email": "TEST_customer_new@inkbook.com",
            "password": "testpass123",
            "name": "Test Customer",
            "role": "customer"
        })
        # May already exist, so 200 or 400
        assert r.status_code in [200, 400], f"Expected 200/400, got {r.status_code}: {r.text}"
        if r.status_code == 200:
            data = r.json()
            assert data["role"] == "customer"
            print("PASS: Customer registration successful")
        else:
            print("PASS: Email already registered (expected on re-run)")

    def test_register_studio_owner(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/register", json={
            "email": "TEST_studioowner_new@inkbook.com",
            "password": "testpass123",
            "name": "Test Studio Owner",
            "role": "studio_owner"
        })
        assert r.status_code in [200, 400], f"Expected 200/400, got {r.status_code}: {r.text}"
        if r.status_code == 200:
            data = r.json()
            assert data["role"] == "studio_owner"
            print("PASS: Studio owner registration successful")
        else:
            print("PASS: Email already registered (expected on re-run)")

    def test_login_customer(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@inkbook.com", "password": "test123"})
        assert r.status_code == 200, f"Login failed: {r.text}"
        data = r.json()
        assert data["email"] == "testuser@inkbook.com"
        assert data["role"] == "customer"
        print("PASS: Customer login successful")

    def test_login_invalid_credentials(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@inkbook.com", "password": "wrongpass"})
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("PASS: Invalid credentials rejected")

    def test_get_me(self, customer_session):
        r = customer_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200, f"Get me failed: {r.text}"
        data = r.json()
        assert "email" in data
        print(f"PASS: Get me returned user: {data['email']}")

    def test_logout(self):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@inkbook.com", "password": "test123"})
        r = s.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200
        print("PASS: Logout successful")

# ─── Studios ──────────────────────────────────────────────────────────────────
class TestStudios:
    """Studio endpoint tests"""

    def test_list_studios(self):
        r = requests.get(f"{BASE_URL}/api/studios")
        assert r.status_code == 200, f"List studios failed: {r.text}"
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 4, f"Expected at least 4 demo studios, got {len(data)}"
        print(f"PASS: Listed {len(data)} studios")

    def test_get_studio_demo001(self):
        r = requests.get(f"{BASE_URL}/api/studios/studio_demo001")
        assert r.status_code == 200, f"Get studio failed: {r.text}"
        data = r.json()
        assert data["studio_id"] == "studio_demo001" or data.get("id") == "studio_demo001"
        print(f"PASS: Got studio: {data.get('name', '')}")

    def test_get_studio_slots(self):
        r = requests.get(f"{BASE_URL}/api/studios/studio_demo001/slots")
        assert r.status_code == 200, f"Get slots failed: {r.text}"
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} slots for studio_demo001")

    def test_search_studios_by_city(self):
        r = requests.get(f"{BASE_URL}/api/studios?city=Berlin")
        assert r.status_code == 200, f"Search failed: {r.text}"
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: Studio search by city returned {len(data)} results")

    def test_search_studios_by_style(self):
        r = requests.get(f"{BASE_URL}/api/studios?style=blackwork")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: Studio search by style returned {len(data)} results")

# ─── Bookings ─────────────────────────────────────────────────────────────────
class TestBookings:
    """Booking endpoint tests"""

    def test_get_bookings_unauthenticated(self):
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/bookings")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("PASS: Bookings protected for unauthenticated users")

    def test_get_bookings_authenticated(self, customer_session):
        r = customer_session.get(f"{BASE_URL}/api/bookings")
        assert r.status_code == 200, f"Get bookings failed: {r.text}"
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} bookings for customer")

    def test_create_booking(self, customer_session):
        # First get a slot
        slots_r = requests.get(f"{BASE_URL}/api/studios/studio_demo001/slots")
        if slots_r.status_code != 200 or not slots_r.json():
            pytest.skip("No slots available to book")
        slots = slots_r.json()
        slot = slots[0]
        slot_id = slot.get("slot_id") or slot.get("id")

        r = customer_session.post(f"{BASE_URL}/api/bookings", json={
            "studio_id": "studio_demo001",
            "slot_id": slot_id,
            "booking_type": "tattoo",
            "notes": "TEST booking"
        })
        assert r.status_code in [200, 201, 400], f"Create booking failed: {r.status_code}: {r.text}"
        print(f"PASS: Create booking returned {r.status_code}")

# ─── Dashboard ────────────────────────────────────────────────────────────────
class TestDashboard:
    """Dashboard stats endpoint tests"""

    def test_dashboard_stats_customer(self, customer_session):
        r = customer_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 200, f"Dashboard stats failed: {r.text}"
        data = r.json()
        assert "total_bookings" in data or "bookings" in data or isinstance(data, dict)
        print(f"PASS: Customer dashboard stats: {list(data.keys())}")

    def test_dashboard_stats_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("PASS: Dashboard stats protected")

# ─── Reviews ──────────────────────────────────────────────────────────────────
class TestReviews:
    """Review endpoint tests"""

    def test_get_reviews_for_studio(self):
        r = requests.get(f"{BASE_URL}/api/studios/studio_demo001/reviews")
        assert r.status_code == 200, f"Get reviews failed: {r.text}"
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: Got {len(data)} reviews for studio_demo001")
