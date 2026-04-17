"""E2E backend tests: slot offer message creation and booking flow (Features 2E, 2F, 2H)"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
STUDIO_ID = "studio_d052af828f1f"


@pytest.fixture(scope="module")
def studio_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test_studio@inkbook.com", "password": "Test1234!"})
    assert r.status_code == 200
    return s


@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "test_customer@inkbook.com", "password": "Test1234!"})
    assert r.status_code == 200
    return s


def test_slot_offer_and_booking_e2e(studio_session, customer_session):
    """Feature 2E + 2F + 2H: Create slot, send as message, customer books, verify status"""

    # Get customer ID
    me = customer_session.get(f"{BASE_URL}/api/auth/me").json()
    customer_id = me.get("id") or me.get("user_id")
    assert customer_id, "Customer ID not found"

    # Create slot inline (Feature 2E - new slot)
    slot_r = studio_session.post(f"{BASE_URL}/api/studios/{STUDIO_ID}/slots", json={
        "date": "2026-10-20",
        "start_time": "10:00",
        "end_time": "12:00",
        "slot_type": "tattoo",
        "duration_minutes": 120
    })
    assert slot_r.status_code == 200, f"Slot creation failed: {slot_r.text}"
    slot_id = slot_r.json()["slot_id"]
    print(f"  Created slot: {slot_id}")

    # Send slot offer message (Feature 2E)
    msg_r = studio_session.post(f"{BASE_URL}/api/messages", json={
        "recipient_id": customer_id,
        "content": "",
        "image_url": "",
        "slot_offer": {
            "slot_id": slot_id,
            "studio_id": STUDIO_ID,
            "date": "2026-10-20",
            "start_time": "10:00",
            "end_time": "12:00",
            "slot_type": "tattoo",
            "status": "available"
        }
    })
    assert msg_r.status_code == 200, f"Message send failed: {msg_r.text}"
    msg = msg_r.json()
    assert msg.get("slot_offer") is not None
    assert msg["slot_offer"]["status"] == "available"
    message_id = msg["message_id"]
    print(f"  Slot offer message sent: {message_id}")

    # Customer books slot from chat (Feature 2F)
    book_r = customer_session.post(f"{BASE_URL}/api/messages/{message_id}/book-slot")
    assert book_r.status_code == 200, f"Book slot failed: {book_r.text}"
    booking_id = book_r.json().get("booking_id")
    assert booking_id is not None
    print(f"  Booking created: {booking_id}")

    # Verify booking in /api/bookings (Feature 2H)
    bookings_r = customer_session.get(f"{BASE_URL}/api/bookings")
    assert bookings_r.status_code == 200
    booking_ids = [b.get("booking_id") for b in bookings_r.json()]
    assert booking_id in booking_ids, "Booking not in customer bookings"
    print(f"  Booking verified in /api/bookings")

    # Verify slot_offer.status = 'booked' in messages (Feature 2H)
    studio_me = studio_session.get(f"{BASE_URL}/api/auth/me").json()
    msgs_r = studio_session.get(f"{BASE_URL}/api/messages/{customer_id}")
    assert msgs_r.status_code == 200
    slot_msg = next((m for m in msgs_r.json() if m.get("message_id") == message_id), None)
    assert slot_msg is not None
    assert slot_msg["slot_offer"]["status"] == "booked"
    print(f"  Slot offer status updated to 'booked'")

    # Double booking prevented
    book2_r = customer_session.post(f"{BASE_URL}/api/messages/{message_id}/book-slot")
    assert book2_r.status_code == 400, f"Expected 400 for double booking, got {book2_r.status_code}"
    print(f"  Double booking prevented (400)")
