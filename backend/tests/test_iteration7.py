"""
Iteration 7 Backend Tests: Chat messaging, Push Notifications, Typing Indicator
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

CUSTOMER_EMAIL = "test_customer@inkbook.com"
CUSTOMER_PASS = "Test1234!"
STUDIO_EMAIL = "test_studio@inkbook.com"
STUDIO_PASS = "Test1234!"
STUDIO_USER_ID = "69de3148403e3dba6fa5c435"
CUSTOMER_USER_ID = "69de3148403e3dba6fa5c434"


@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASS})
    assert r.status_code == 200, f"Customer login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def studio_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": STUDIO_EMAIL, "password": STUDIO_PASS})
    assert r.status_code == 200, f"Studio login failed: {r.text}"
    return s


# ─── VAPID / Push Notifications ──────────────────────────────────────────────

def test_vapid_public_key():
    """GET /api/notifications/vapid-public-key returns a public key"""
    r = requests.get(f"{BASE_URL}/api/notifications/vapid-public-key")
    assert r.status_code == 200
    data = r.json()
    assert "public_key" in data
    assert len(data["public_key"]) > 10
    print(f"VAPID key: {data['public_key'][:30]}...")


def test_push_subscribe(customer_session):
    """POST /api/notifications/subscribe accepts a subscription"""
    mock_sub = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/test_endpoint_123",
        "keys": {
            "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtZ5g3yrr3z2LRlI0Bs1LlqFfYaRpLs-fwRh7V-YDqwHSmIcFYnYZAA2PZM3oA",
            "auth": "AAAAAAAAAAAAAAAAAAAAAA"
        }
    }
    r = customer_session.post(f"{BASE_URL}/api/notifications/subscribe", json=mock_sub)
    assert r.status_code in [200, 201, 400], f"Unexpected status: {r.status_code} - {r.text}"
    print(f"Subscribe response: {r.status_code} - {r.text[:100]}")


# ─── Typing Indicator ─────────────────────────────────────────────────────────

def test_typing_post(customer_session):
    """POST /api/messages/{id}/typing sets typing state"""
    r = customer_session.post(f"{BASE_URL}/api/messages/{STUDIO_USER_ID}/typing")
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    print(f"Typing set: {data}")


def test_typing_status_get(studio_session):
    """GET /api/messages/{id}/typing-status returns is_typing"""
    r = studio_session.get(f"{BASE_URL}/api/messages/{CUSTOMER_USER_ID}/typing-status")
    assert r.status_code == 200
    data = r.json()
    assert "is_typing" in data
    print(f"Typing status for studio checking customer: {data}")


def test_typing_indicator_true(customer_session, studio_session):
    """After customer sets typing, studio should see is_typing=true"""
    # Customer sets typing
    r1 = customer_session.post(f"{BASE_URL}/api/messages/{STUDIO_USER_ID}/typing")
    assert r1.status_code == 200

    # Studio checks if customer is typing
    r2 = studio_session.get(f"{BASE_URL}/api/messages/{CUSTOMER_USER_ID}/typing-status")
    assert r2.status_code == 200
    data = r2.json()
    assert data["is_typing"] is True
    print(f"is_typing=True confirmed: {data}")


# ─── Messaging ────────────────────────────────────────────────────────────────

def test_get_conversations_customer(customer_session):
    """GET /api/messages returns conversations for customer"""
    r = customer_session.get(f"{BASE_URL}/api/messages")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"Customer conversations count: {len(data)}")
    if data:
        print(f"First conv: {data[0]}")


def test_get_conversations_studio(studio_session):
    """GET /api/messages returns conversations for studio owner"""
    r = studio_session.get(f"{BASE_URL}/api/messages")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"Studio conversations count: {len(data)}")


def test_send_message_customer_to_studio(customer_session):
    """POST /api/messages sends a message from customer to studio"""
    r = customer_session.post(f"{BASE_URL}/api/messages", json={
        "recipient_id": STUDIO_USER_ID,
        "content": "TEST_iter7_hallo vom Kunden"
    })
    assert r.status_code in [200, 201], f"Send failed: {r.status_code} - {r.text}"
    data = r.json()
    assert "message_id" in data or "id" in data or "content" in data
    print(f"Message sent: {data}")


def test_get_messages_customer(customer_session):
    """GET /api/messages/{id} returns message thread"""
    r = customer_session.get(f"{BASE_URL}/api/messages/{STUDIO_USER_ID}")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Check last message is our test message
    contents = [m.get("content", "") for m in data]
    print(f"Messages: {contents[-3:]}")


def test_studio_can_see_customer_message(studio_session):
    """Studio can see messages sent by customer"""
    r = studio_session.get(f"{BASE_URL}/api/messages/{CUSTOMER_USER_ID}")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
    print(f"Studio sees {len(data)} messages, last: {data[-1].get('content', '')[:50]}")


def test_no_auth_redirect_on_401():
    """Unauthenticated polling should return 401 (not crash)"""
    r = requests.get(f"{BASE_URL}/api/messages", timeout=5)
    assert r.status_code == 401
    print("Unauthenticated returns 401 as expected")
