"""Admin Panel API tests - InkBook"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

ADMIN_CREDS = {"email": "admin@inkbook.com", "password": "admin123"}


@pytest.fixture(scope="module")
def admin_session():
    session = requests.Session()
    resp = session.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return session


# ─── Stats / Dashboard ────────────────────────────────────────────────────────

class TestAdminStats:
    def test_stats_basic(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 200
        data = r.json()
        for key in ["total_users", "total_studios", "total_bookings", "active_subscriptions"]:
            assert key in data, f"Missing key: {key}"
        print("admin/stats OK:", {k: data[k] for k in ["total_users", "total_studios", "total_bookings", "active_subscriptions"]})

    def test_stats_enhanced(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/stats/enhanced")
        assert r.status_code == 200
        print("admin/stats/enhanced OK:", r.json())


# ─── Studios ──────────────────────────────────────────────────────────────────

class TestAdminStudios:
    def test_list_studios(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/studios")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"admin/studios returned {len(data)} studios")

    def test_toggle_studio_status(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/studios")
        studios = r.json()
        if not studios:
            pytest.skip("No studios to test")
        studio_id = studios[0]["studio_id"]
        current = studios[0].get("is_active", True)
        r2 = admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_active": not current})
        assert r2.status_code == 200
        # Revert
        admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_active": current})
        print(f"Toggle studio {studio_id} OK")

    def test_toggle_studio_verified(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/studios")
        studios = r.json()
        if not studios:
            pytest.skip("No studios to test")
        studio_id = studios[0]["studio_id"]
        current = studios[0].get("is_verified", False)
        r2 = admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_verified": not current})
        assert r2.status_code == 200
        # Revert
        admin_session.patch(f"{BASE_URL}/api/admin/studios/{studio_id}", json={"is_verified": current})
        print(f"Toggle studio verified {studio_id} OK")


# ─── Users ────────────────────────────────────────────────────────────────────

class TestAdminUsers:
    def test_list_users(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"admin/users returned {len(data)} users")

    def test_user_details(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users")
        users = r.json()
        non_admin = next((u for u in users if u.get("role") != "admin"), None)
        if not non_admin:
            pytest.skip("No non-admin users")
        uid = non_admin.get("user_id")
        r2 = admin_session.get(f"{BASE_URL}/api/admin/users/{uid}/details")
        assert r2.status_code == 200
        print(f"user details for {uid} OK")


# ─── Bookings ─────────────────────────────────────────────────────────────────

class TestAdminBookings:
    def test_all_bookings(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/bookings/all")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"admin/bookings/all: {len(data)} bookings")


# ─── Subscriptions ────────────────────────────────────────────────────────────

class TestAdminSubscriptions:
    def test_list_subscriptions(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/subscriptions")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"admin/subscriptions: {len(data)} entries")


# ─── Revenue ──────────────────────────────────────────────────────────────────

class TestAdminRevenue:
    def test_revenue(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/revenue")
        assert r.status_code == 200
        data = r.json()
        assert "mrr" in data or "active_subscriptions" in data
        print("admin/revenue OK:", data)


# ─── Reviews ──────────────────────────────────────────────────────────────────

class TestAdminReviews:
    def test_list_reviews(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/reviews")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"admin/reviews: {len(data)} reviews")


# ─── FAQ ──────────────────────────────────────────────────────────────────────

class TestAdminFAQ:
    def test_list_faq(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/faq/public")
        assert r.status_code == 200
        print("faq/public OK")

    def test_create_faq(self, admin_session):
        payload = {"question": "TEST_Frage?", "answer": "TEST_Antwort.", "category": "Allgemein", "order": 99}
        r = admin_session.post(f"{BASE_URL}/api/admin/faq", json=payload)
        assert r.status_code in [200, 201]
        data = r.json()
        faq_id = data.get("faq_id") or data.get("id")
        print(f"create faq OK, id={faq_id}")
        # Cleanup
        if faq_id:
            admin_session.delete(f"{BASE_URL}/api/admin/faq/{faq_id}")


# ─── Announcements ────────────────────────────────────────────────────────────

class TestAdminAnnouncements:
    def test_list_announcements(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/announcements")
        assert r.status_code == 200

    def test_create_announcement(self, admin_session):
        payload = {"text": "TEST_Ankündigung Inhalt", "type": "info"}
        r = admin_session.post(f"{BASE_URL}/api/admin/announcements", json=payload)
        assert r.status_code in [200, 201]
        print("create announcement OK")


# ─── Newsletter ───────────────────────────────────────────────────────────────

class TestAdminNewsletter:
    def test_subscriber_count(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/newsletter/subscribers")
        assert r.status_code == 200
        print("newsletter/subscribers OK:", r.json())


# ─── Support Tickets ──────────────────────────────────────────────────────────

class TestAdminSupportTickets:
    def test_list_tickets(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/support-tickets")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"admin/support-tickets: {len(data)} tickets")


# ─── Reports / Meldungen ──────────────────────────────────────────────────────

class TestAdminReports:
    def test_list_reports(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/reports")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"admin/reports: {len(data)} reports")
