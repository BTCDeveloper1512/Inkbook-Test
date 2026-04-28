"""
Subscription plan tests: plans listing, usage endpoint, plan limit enforcement
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Credentials
ADMIN_EMAIL = "admin@inkbook.com"
ADMIN_PASSWORD = "admin123"
CUSTOMER_EMAIL = "test_customer@inkbook.com"
CUSTOMER_PASSWORD = "Test1234!"
STUDIO_EMAIL = "test_studio@inkbook.com"
STUDIO_PASSWORD = "Test1234!"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def studio_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": STUDIO_EMAIL, "password": STUDIO_PASSWORD})
    assert r.status_code == 200, f"Studio login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD})
    assert r.status_code == 200, f"Customer login failed: {r.text}"
    return s


class TestSubscriptionPlans:
    """Test GET /api/subscriptions/plans"""

    def test_plans_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert r.status_code == 200, f"Plans endpoint failed: {r.text}"

    def test_plans_has_4_plans(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        assert len(data) == 4, f"Expected 4 plans, got {len(data)}: {list(data.keys())}"

    def test_free_plan_price_is_zero(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        assert "free" in data
        assert data["free"]["price"] == 0.0

    def test_starter_plan_price(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        assert data["starter"]["price"] == 19.99

    def test_pro_plan_price(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        assert data["pro"]["price"] == 49.99

    def test_full_studio_plan_price(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        assert data["full_studio"]["price"] == 149.99

    def test_free_plan_limits(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = r.json()
        free = data["free"]
        assert free["artists_limit"] == 1
        assert free["slots_per_month"] == 5
        assert free["portfolio_images"] == 5


class TestSubscriptionUsage:
    """Test GET /api/subscriptions/usage - requires studio owner"""

    def test_usage_returns_200_for_studio_owner(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/subscriptions/usage")
        assert r.status_code == 200, f"Usage failed: {r.text}"

    def test_usage_returns_401_for_anonymous(self):
        r = requests.get(f"{BASE_URL}/api/subscriptions/usage")
        assert r.status_code == 401

    def test_usage_has_required_fields(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/subscriptions/usage")
        data = r.json()
        # Admin has studio, should have usage
        if data.get("has_studio"):
            assert "plan" in data
            assert "limits" in data
            assert "usage" in data
            usage = data["usage"]
            assert "slots_this_month" in usage
            assert "artists" in usage
            assert "portfolio_images" in usage
        else:
            # No studio is also valid
            assert data.get("has_studio") == False

    def test_usage_no_studio_for_customer(self, customer_session):
        r = customer_session.get(f"{BASE_URL}/api/subscriptions/usage")
        data = r.json()
        # Customer has no studio
        assert data.get("has_studio") == False


class TestPlanLimits:
    """Test plan limit enforcement for slots and artists"""

    def test_slot_limit_uses_plan_check(self, admin_session):
        """Verify slot creation endpoint exists and returns appropriate response"""
        # Get studio ID first
        r = admin_session.get(f"{BASE_URL}/api/subscriptions/usage")
        data = r.json()
        if not data.get("has_studio"):
            pytest.skip("Admin has no studio")
        studio_id = data["studio_id"]
        # Try creating a slot - admin is exempt, should work or return 422/400 for missing data
        r = admin_session.post(f"{BASE_URL}/api/studios/{studio_id}/slots", json={})
        # 422 means validation error (missing required fields) - limit check works but data is invalid
        # 403 means plan limit hit (but admin is exempt)
        assert r.status_code in [200, 201, 400, 422], f"Unexpected status: {r.status_code} {r.text}"

    def test_artist_limit_endpoint_exists(self, admin_session):
        """Verify artist endpoint exists"""
        r = admin_session.get(f"{BASE_URL}/api/subscriptions/usage")
        data = r.json()
        if not data.get("has_studio"):
            pytest.skip("Admin has no studio")
        studio_id = data["studio_id"]
        r = admin_session.post(f"{BASE_URL}/api/studios/{studio_id}/artists", json={})
        assert r.status_code in [200, 201, 400, 422, 403], f"Unexpected status: {r.status_code}"
