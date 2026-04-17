"""Backend tests for Feature 2E and 2F: slot offer messages and booking via chat"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

STUDIO_EMAIL = "test_studio@inkbook.com"
STUDIO_PASS = "Test1234!"
CUSTOMER_EMAIL = "test_customer@inkbook.com"
CUSTOMER_PASS = "Test1234!"
STUDIO_ID = "studio_d052af828f1f"


def get_session_token(email, password):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return s


class TestSlotOfferMessage:
    """Feature 2E: POST /api/messages with slot_offer creates a message"""

    def test_studio_login(self):
        s = get_session_token(STUDIO_EMAIL, STUDIO_PASS)
        r = s.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "studio_owner"
        print(f"Studio login OK: {data['email']}")

    def test_customer_login(self):
        s = get_session_token(CUSTOMER_EMAIL, CUSTOMER_PASS)
        r = s.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "customer"
        print(f"Customer login OK: {data['email']}")

    def test_get_studio_slots(self):
        s = get_session_token(STUDIO_EMAIL, STUDIO_PASS)
        r = s.get(f"{BASE_URL}/api/studios/{STUDIO_ID}/slots")
        assert r.status_code == 200
        slots = r.json()
        print(f"Found {len(slots)} slots for studio")

    def test_send_slot_offer_message_new_slot(self):
        """Feature 2E: Studio creates new slot inline and sends as message"""
        studio_s = get_session_token(STUDIO_EMAIL, STUDIO_PASS)
        customer_s = get_session_token(CUSTOMER_EMAIL, CUSTOMER_PASS)

        # Get customer user_id
        r = customer_s.get(f"{BASE_URL}/api/auth/me")
        me = r.json()
        customer_id = me.get("user_id") or me.get("id")

        # Create a new slot inline
        slot_payload = {
            "date": "2026-09-15",
            "start_time": "14:00",
            "end_time": "16:00",
            "slot_type": "tattoo",
            "duration_minutes": 120
        }
        r = studio_s.post(f"{BASE_URL}/api/studios/{STUDIO_ID}/slots", json=slot_payload)
        assert r.status_code == 200, f"Slot creation failed: {r.text}"
        new_slot = r.json()
        slot_id = new_slot["slot_id"]
        print(f"Created slot: {slot_id}")

        # Send message with slot_offer
        msg_payload = {
            "recipient_id": customer_id,
            "content": "",
            "image_url": "",
            "slot_offer": {
                "slot_id": slot_id,
                "studio_id": STUDIO_ID,
                "date": "2026-09-15",
                "start_time": "14:00",
                "end_time": "16:00",
                "slot_type": "tattoo",
                "status": "available"
            }
        }
        r = studio_s.post(f"{BASE_URL}/api/messages", json=msg_payload)
        assert r.status_code == 200, f"Message send failed: {r.text}"
        msg = r.json()
        assert msg.get("slot_offer") is not None
        assert msg["slot_offer"]["slot_id"] == slot_id
        assert msg["slot_offer"]["status"] == "available"
        print(f"Slot offer message created: {msg['message_id']}")

        # Store for next test
        pytest.__test_slot_msg_id = msg["message_id"]
        pytest.__test_slot_id = slot_id
        pytest.__customer_id = customer_id

    def test_book_slot_from_chat(self):
        """Feature 2F: Customer books slot via /api/messages/{id}/book-slot"""
        msg_id = getattr(pytest, "__test_slot_msg_id", None)
        if not msg_id:
            pytest.skip("No message_id from previous test")

        customer_s = get_session_token(CUSTOMER_EMAIL, CUSTOMER_PASS)
        r = customer_s.post(f"{BASE_URL}/api/messages/{msg_id}/book-slot")
        assert r.status_code == 200, f"Book slot failed: {r.text}"
        data = r.json()
        booking_id = data.get("booking_id")
        assert booking_id is not None
        print(f"Booking created: {booking_id}")

        # Verify booking appears in customer bookings
        r2 = customer_s.get(f"{BASE_URL}/api/bookings")
        assert r2.status_code == 200
        bookings = r2.json()
        booking_ids = [b.get("booking_id") for b in bookings]
        assert booking_id in booking_ids, "Booking not found in customer bookings"
        print(f"Booking {booking_id} found in /api/bookings")

    def test_message_slot_status_after_booking(self):
        """Feature 2H: After booking, slot_offer.status should be 'booked'"""
        msg_id = getattr(pytest, "__test_slot_msg_id", None)
        if not msg_id:
            pytest.skip("No message_id from previous test")

        studio_s = get_session_token(STUDIO_EMAIL, STUDIO_PASS)
        # Get messages for customer conversation
        customer_id = getattr(pytest, "__customer_id", None)
        if not customer_id:
            pytest.skip("No customer_id from previous test")

        r = studio_s.get(f"{BASE_URL}/api/messages/{customer_id}")
        assert r.status_code == 200
        msgs = r.json()
        slot_msg = next((m for m in msgs if m.get("message_id") == msg_id), None)
        assert slot_msg is not None, "Slot message not found"
        assert slot_msg["slot_offer"]["status"] == "booked", f"Expected 'booked', got {slot_msg['slot_offer']['status']}"
        print("Slot status correctly updated to 'booked'")

    def test_double_booking_prevented(self):
        """Can't book same slot twice"""
        msg_id = getattr(pytest, "__test_slot_msg_id", None)
        if not msg_id:
            pytest.skip("No message_id from previous test")

        customer_s = get_session_token(CUSTOMER_EMAIL, CUSTOMER_PASS)
        r = customer_s.post(f"{BASE_URL}/api/messages/{msg_id}/book-slot")
        assert r.status_code == 400, f"Expected 400 for double booking, got {r.status_code}"
        print("Double booking correctly prevented")
