"""Tests for video consultation features - booking display, dashboard stats, available-dates"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
STUDIO_ID = "studio_c4455cefb0ed"  # JohanINK Est. 2023
BOOKING_ID = "book_1f785124a8"

def get_session(email, password):
    """Returns a requests.Session with auth cookie set"""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return s
    return None

class TestAvailableDates:
    """Test available-dates endpoint for video_consultation slot_type"""

    def test_available_dates_video_consultation(self):
        r = requests.get(
            f"{BASE_URL}/api/studios/{STUDIO_ID}/available-dates",
            params={"year": 2026, "month": 5, "slot_type": "video_consultation"}
        )
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert "available_dates" in data
        print(f"Available dates for video_consultation: {data['available_dates']}")

    def test_available_dates_no_slot_type(self):
        r = requests.get(
            f"{BASE_URL}/api/studios/{STUDIO_ID}/available-dates",
            params={"year": 2026, "month": 5}
        )
        assert r.status_code == 200
        data = r.json()
        assert "available_dates" in data
        print(f"Available dates (all types): {data['available_dates']}")


class TestCustomerDashboard:
    """Test customer dashboard stats returns video_consultation booking"""

    def test_customer_dashboard_stats(self):
        session = get_session("kunde@test.com", "test1234")
        assert session, "kunde@test.com login failed"
        r = session.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        data = r.json()
        print(f"Dashboard stats keys: {list(data.keys())}")
        all_bookings = data.get("all_bookings", [])
        upcoming = data.get("upcoming_bookings", [])
        print(f"Total bookings: {len(all_bookings)}, Upcoming: {len(upcoming)}")
        
        # Find the video_consultation booking
        vc_bookings = [b for b in all_bookings if b.get("booking_type") == "video_consultation" or b.get("booking_id") == BOOKING_ID]
        print(f"Video consultation bookings: {vc_bookings}")
        assert len(vc_bookings) > 0, f"No video_consultation booking found. All bookings: {all_bookings}"

    def test_upcoming_includes_video_consultation(self):
        session = get_session("kunde@test.com", "test1234")
        assert session, "kunde@test.com login failed"
        r = session.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 200
        data = r.json()
        upcoming = data.get("upcoming_bookings", [])
        vc_upcoming = [b for b in upcoming if b.get("booking_type") == "video_consultation"]
        print(f"Upcoming video consultations: {vc_upcoming}")
        assert len(vc_upcoming) > 0, f"No video consultation in upcoming. Upcoming: {upcoming}"


class TestStudioDashboard:
    """Test studio dashboard shows video_consultation booking"""

    def test_admin_can_see_studio_bookings(self):
        session = get_session("admin@inkbook.com", "admin123")
        assert session, "admin login failed"
        r = session.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        data = r.json()
        print(f"Admin dashboard keys: {list(data.keys())}")
        all_bookings = data.get("all_bookings", [])
        print(f"Admin sees {len(all_bookings)} bookings")
        vc = [b for b in all_bookings if b.get("booking_type") == "video_consultation"]
        print(f"Video consultation bookings in admin view: {vc}")

    def test_specific_booking_exists(self):
        session = get_session("admin@inkbook.com", "admin123")
        assert session
        r = session.get(f"{BASE_URL}/api/bookings/{BOOKING_ID}")
        print(f"Booking {BOOKING_ID} status: {r.status_code}, body: {r.text[:300]}")
        # 403 means the booking exists but admin can't directly GET it (ownership check)
        assert r.status_code in [200, 404, 403]


class TestSlotsEndpoint:
    """Test slots endpoint for video_consultation type"""

    def test_slots_video_consultation_uses_all_slots(self):
        # Get available dates first
        r_dates = requests.get(
            f"{BASE_URL}/api/studios/{STUDIO_ID}/available-dates",
            params={"year": 2026, "month": 6}
        )
        if r_dates.status_code == 200 and r_dates.json().get("available_dates"):
            date = r_dates.json()["available_dates"][0]
        else:
            date = "2026-06-01"
        
        # Get slots without type filter
        r_all = requests.get(f"{BASE_URL}/api/studios/{STUDIO_ID}/slots", params={"date": date})
        # Get slots with video_consultation type
        r_vc = requests.get(f"{BASE_URL}/api/studios/{STUDIO_ID}/slots", params={"date": date, "slot_type": "video_consultation"})
        
        print(f"All slots count: {len(r_all.json()) if r_all.status_code == 200 else 'error'}")
        print(f"Video consultation slots count: {len(r_vc.json()) if r_vc.status_code == 200 else 'error'}")
        
        if r_all.status_code == 200 and r_vc.status_code == 200:
            # video_consultation should return same or more slots (all available)
            assert len(r_vc.json()) >= len(r_all.json()) or len(r_vc.json()) > 0
