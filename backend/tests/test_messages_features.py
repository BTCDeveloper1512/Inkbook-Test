"""Backend tests for new features: messages, profile edit, reference images, conversations"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

@pytest.fixture(scope="module")
def customer_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@inkbook.com", "password": "test123"})
    assert r.status_code == 200
    cookies = r.cookies
    return cookies

@pytest.fixture(scope="module")
def studio_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "studioowner@inkbook.com", "password": "studio123"})
    if r.status_code != 200:
        pytest.skip("Studio owner account not available")
    return r.cookies

class TestMessages:
    """Test messaging endpoints"""

    def test_get_conversations_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/messages")
        assert r.status_code == 401

    def test_get_conversations_authenticated(self, customer_token):
        r = requests.get(f"{BASE_URL}/api/messages", cookies=customer_token)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_get_messages_with_other_user(self, customer_token):
        # Get a test with another user id (demo_owner_1)
        r = requests.get(f"{BASE_URL}/api/messages/demo_owner_1", cookies=customer_token)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_send_message(self, customer_token):
        r = requests.post(f"{BASE_URL}/api/messages", 
            json={"recipient_id": "demo_owner_1", "content": "TEST_Hello from tests", "image_url": ""},
            cookies=customer_token)
        assert r.status_code == 200
        data = r.json()
        assert data["content"] == "TEST_Hello from tests"
        assert "message_id" in data
        assert "sender_id" in data

    def test_conversations_enriched_after_send(self, customer_token):
        r = requests.get(f"{BASE_URL}/api/messages", cookies=customer_token)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # After sending, there should be at least 1 conversation
        assert len(data) >= 1
        conv = data[0]
        assert "conv_id" in conv
        assert "participants" in conv
        assert "last_message" in conv
        assert "last_sender_name" in conv

    def test_send_message_studio_owner(self, studio_token, customer_token):
        # Get studio owner's user id from me endpoint
        me_r = requests.get(f"{BASE_URL}/api/auth/me", cookies=studio_token)
        if me_r.status_code != 200:
            pytest.skip("Studio owner not available")
        studio_user_id = me_r.json().get("id") or me_r.json().get("user_id")
        
        # Send from customer to studio owner
        r = requests.post(f"{BASE_URL}/api/messages",
            json={"recipient_id": studio_user_id, "content": "TEST_Customer to studio message", "image_url": ""},
            cookies=customer_token)
        assert r.status_code == 200

        # Studio owner should see conversation
        r2 = requests.get(f"{BASE_URL}/api/messages", cookies=studio_token)
        assert r2.status_code == 200
        data = r2.json()
        assert len(data) >= 1

class TestStudioProfile:
    """Test studio profile edit endpoints"""

    def test_studio_owner_can_get_own_studio(self, studio_token):
        r = requests.get(f"{BASE_URL}/api/studios", cookies=studio_token)
        assert r.status_code == 200

    def test_update_studio_profile(self, studio_token):
        # First get the studio owner's studio
        me_r = requests.get(f"{BASE_URL}/api/auth/me", cookies=studio_token)
        if me_r.status_code != 200:
            pytest.skip("Studio owner not available")
        owner_id = me_r.json().get("id") or me_r.json().get("user_id")
        
        studios_r = requests.get(f"{BASE_URL}/api/studios", cookies=studio_token)
        all_studios = studios_r.json()
        
        my_studio = next((s for s in all_studios if s.get("owner_id") == owner_id), None)
        if not my_studio:
            pytest.skip("No studio found for this owner")
        
        studio_id = my_studio["studio_id"]
        r = requests.put(f"{BASE_URL}/api/studios/{studio_id}", 
            json={"name": "TEST_Updated Studio Name", "description": "TEST_Updated description"},
            cookies=studio_token)
        assert r.status_code == 200

class TestBookingWithReferenceImage:
    """Test booking flow with reference image field"""

    def test_create_booking_with_reference_image(self, customer_token):
        # Get available slot
        slots_r = requests.get(f"{BASE_URL}/api/studios/studio_demo001/slots")
        assert slots_r.status_code == 200
        slots = slots_r.json()
        if not slots:
            pytest.skip("No slots available")
        
        slot = slots[0]
        r = requests.post(f"{BASE_URL}/api/bookings", json={
            "studio_id": "studio_demo001",
            "slot_id": slot["slot_id"],
            "notes": "TEST_booking with reference",
            "reference_images": ["https://example.com/test-ref.jpg"]
        }, cookies=customer_token)
        assert r.status_code == 200
        data = r.json()
        assert "booking_id" in data
        # Verify reference images are stored
        assert "https://example.com/test-ref.jpg" in data.get("reference_images", [])

class TestManifest:
    """Test PWA manifest"""

    def test_manifest_accessible(self):
        r = requests.get(f"{BASE_URL}/manifest.json")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "InkBook – Tattoo Booking"
        assert data["short_name"] == "InkBook"
        assert data["display"] == "standalone"
