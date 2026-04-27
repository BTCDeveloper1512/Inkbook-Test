"""Video consultation endpoint tests: video-join, video-status, video-leave"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
VIDEO_BOOKING_ID = "book_5bb7ea0a1b5a"  # confirmed video_consultation booking

@pytest.fixture
def customer_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test_customer@inkbook.com", "password": "Test1234!"})
    assert r.status_code == 200, f"Customer login failed: {r.text}"
    return s

@pytest.fixture
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@inkbook.com", "password": "admin123"})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return s

class TestVideoEndpoints:
    """Video call API endpoints"""

    def test_video_join_customer(self, customer_session):
        """POST /api/bookings/{id}/video-join returns joined=true and room_id"""
        r = customer_session.post(f"{BASE_URL}/api/bookings/{VIDEO_BOOKING_ID}/video-join")
        assert r.status_code == 200, f"video-join failed: {r.text}"
        data = r.json()
        assert data.get("joined") is True
        assert data.get("room_id") == f"inkbook-{VIDEO_BOOKING_ID}"
        assert data.get("participant") == "customer"
        print("PASS: video-join returns correct data")

    def test_video_status_after_join(self, customer_session):
        """GET /api/bookings/{id}/video-status returns participants and booking_type"""
        # Join first
        customer_session.post(f"{BASE_URL}/api/bookings/{VIDEO_BOOKING_ID}/video-join")
        r = customer_session.get(f"{BASE_URL}/api/bookings/{VIDEO_BOOKING_ID}/video-status")
        assert r.status_code == 200, f"video-status failed: {r.text}"
        data = r.json()
        assert "participants" in data
        assert "booking_type" in data
        assert data["booking_type"] == "video_consultation"
        assert "customer" in data["participants"]
        print(f"PASS: video-status returns participants={data['participants']}, booking_type={data['booking_type']}")

    def test_video_leave_removes_participant(self, customer_session):
        """POST /api/bookings/{id}/video-leave removes participant"""
        # Join first
        customer_session.post(f"{BASE_URL}/api/bookings/{VIDEO_BOOKING_ID}/video-join")
        # Leave
        r = customer_session.post(f"{BASE_URL}/api/bookings/{VIDEO_BOOKING_ID}/video-leave")
        assert r.status_code == 200, f"video-leave failed: {r.text}"
        data = r.json()
        assert data.get("left") is True
        # Verify removed
        r2 = customer_session.get(f"{BASE_URL}/api/bookings/{VIDEO_BOOKING_ID}/video-status")
        participants = r2.json().get("participants", [])
        assert "customer" not in participants
        print(f"PASS: video-leave removed customer. Remaining: {participants}")

    def test_video_join_non_video_booking_fails(self, customer_session):
        """video-join on non-video booking should return 400"""
        # Get a regular booking
        r = customer_session.get(f"{BASE_URL}/api/bookings/my")
        bookings = r.json() if r.status_code == 200 else []
        non_video = next((b for b in bookings if b.get("booking_type") != "video_consultation"), None)
        if not non_video:
            pytest.skip("No non-video booking available")
        bid = non_video["booking_id"]
        r2 = customer_session.post(f"{BASE_URL}/api/bookings/{bid}/video-join")
        assert r2.status_code == 400, f"Expected 400 for non-video booking, got {r2.status_code}"
        print("PASS: non-video booking returns 400 for video-join")

    def test_video_status_unauthenticated(self):
        """video-status requires auth"""
        r = requests.get(f"{BASE_URL}/api/bookings/{VIDEO_BOOKING_ID}/video-status")
        assert r.status_code in [401, 403], f"Expected auth error, got {r.status_code}"
        print("PASS: video-status requires authentication")
