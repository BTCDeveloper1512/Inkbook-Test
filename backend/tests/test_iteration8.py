"""
Iteration 8: Test setup for cancelled booking (banner test) + message with image (lightbox test)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

CUSTOMER_EMAIL = "test_customer@inkbook.com"
CUSTOMER_PWD = "Test1234!"
STUDIO_EMAIL = "test_studio@inkbook.com"
STUDIO_PWD = "Test1234!"
STUDIO_ID = "studio_d052af828f1f"
CUSTOMER_ID = "69de3148403e3dba6fa5c434"
STUDIO_OWNER_ID = "69de3148403e3dba6fa5c435"


@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PWD})
    assert r.status_code == 200, f"Customer login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def studio_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": STUDIO_EMAIL, "password": STUDIO_PWD})
    assert r.status_code == 200, f"Studio login failed: {r.text}"
    return s


def test_get_available_slot(studio_session):
    """Get a slot to create a booking for cancellation test"""
    from datetime import date, timedelta
    for i in range(3, 15):
        d = (date.today() + timedelta(days=i)).isoformat()
        r = studio_session.get(f"{BASE_URL}/api/studios/{STUDIO_ID}/slots", params={"date": d})
        if r.status_code == 200 and r.json():
            slots = r.json()
            print(f"Found {len(slots)} slots on {d}: {slots[0]['slot_id']}")
            return
    print("No available slots found in next 14 days")


def test_create_and_cancel_booking_as_studio(customer_session, studio_session):
    """Create a booking as customer, then cancel as studio (cancelled_by=studio)"""
    from datetime import date, timedelta
    
    # Find an available slot
    slot_id = None
    for i in range(3, 20):
        d = (date.today() + timedelta(days=i)).isoformat()
        r = requests.get(f"{BASE_URL}/api/studios/{STUDIO_ID}/slots", params={"date": d})
        if r.status_code == 200 and r.json():
            slot_id = r.json()[0]["slot_id"]
            print(f"Using slot {slot_id} on {d}")
            break
    
    if not slot_id:
        pytest.skip("No available slots found")
    
    # Create booking as customer
    r = customer_session.post(f"{BASE_URL}/api/bookings", json={"slot_id": slot_id})
    assert r.status_code == 200, f"Booking creation failed: {r.text}"
    booking_id = r.json()["booking_id"]
    print(f"Created booking {booking_id}")
    
    # Cancel as studio (this sets cancelled_by='studio')
    r = studio_session.put(f"{BASE_URL}/api/bookings/{booking_id}/status", params={"status": "cancelled"})
    assert r.status_code == 200, f"Studio cancel failed: {r.text}"
    print(f"Cancelled booking {booking_id} as studio")
    
    # Verify cancellation
    r = customer_session.get(f"{BASE_URL}/api/bookings/{booking_id}")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "cancelled"
    assert data["cancelled_by"] == "studio"
    print(f"Verified: cancelled_by = {data['cancelled_by']}")


def test_send_message_with_image(customer_session):
    """Send a message with image_url so lightbox can be tested"""
    # Get or create conversation
    r = customer_session.get(f"{BASE_URL}/api/conversations")
    assert r.status_code == 200
    convs = r.json()
    
    if not convs:
        # Create conversation by sending first message
        r = customer_session.post(f"{BASE_URL}/api/messages", json={
            "recipient_id": STUDIO_OWNER_ID,
            "content": "Hallo, ich möchte einen Termin buchen.",
            "image_url": ""
        })
        assert r.status_code == 200
        print("Created new conversation")
    
    # Get conversation partner
    r = customer_session.get(f"{BASE_URL}/api/conversations")
    convs = r.json()
    conv = next((c for c in convs if c["other_id"] == STUDIO_OWNER_ID), convs[0] if convs else None)
    assert conv is not None, "No conversation found"
    
    # Send a message with image
    image_url = "https://picsum.photos/400/300"
    r = customer_session.post(f"{BASE_URL}/api/messages", json={
        "recipient_id": STUDIO_OWNER_ID,
        "content": "",
        "image_url": image_url
    })
    assert r.status_code == 200, f"Failed to send image message: {r.text}"
    msg = r.json()
    assert msg.get("image_url") == image_url
    print(f"Sent message with image: {msg['message_id']}")


def test_customer_dashboard_loads(customer_session):
    """Check dashboard stats endpoint returns data"""
    r = customer_session.get(f"{BASE_URL}/api/dashboard/stats")
    assert r.status_code == 200
    data = r.json()
    print(f"Dashboard stats: total={data.get('total_bookings')}, bookings count={len(data.get('all_bookings',[]))}")
    # Check if any cancelled by studio
    cancelled_by_studio = [b for b in data.get("all_bookings", []) if b.get("cancelled_by") == "studio"]
    print(f"Cancelled by studio: {len(cancelled_by_studio)}")
    assert len(cancelled_by_studio) > 0, "No cancelled-by-studio bookings found for banner test"
