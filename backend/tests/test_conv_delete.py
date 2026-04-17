"""
Tests for conversation delete/end feature:
- DELETE /api/conversations/{other_user_id}
- System message creation
- GET /api/messages filtering deleted_by
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

STUDIO_EMAIL = "test_studio@inkbook.com"
STUDIO_PASS = "Test1234!"
CUSTOMER_EMAIL = "test_customer@inkbook.com"
CUSTOMER_PASS = "Test1234!"
STUDIO_USER_ID = "69de3148403e3dba6fa5c435"
CUSTOMER_USER_ID = "69de3148403e3dba6fa5c434"


def login(email, password):
    s = requests.Session()
    resp = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return s


@pytest.fixture(scope="module")
def studio_session():
    return login(STUDIO_EMAIL, STUDIO_PASS)


@pytest.fixture(scope="module")
def customer_session():
    return login(CUSTOMER_EMAIL, CUSTOMER_PASS)


def ensure_conversation(s_session, c_session):
    """Send a message from studio to customer to ensure conversation exists."""
    resp = s_session.post(f"{BASE_URL}/api/messages",
                          json={"recipient_id": CUSTOMER_USER_ID, "content": "TEST_init_msg", "image_url": ""})
    assert resp.status_code == 200
    return resp.json()


def reset_deleted_by(studio_session):
    """Reset deleted_by so tests start clean - send a new message to create/reset conv."""
    # We can't directly reset deleted_by via API, so we need to check the DB
    # Instead, we'll just proceed with the tests
    pass


class TestDeleteConversation:
    """Tests for the delete conversation feature"""

    def test_conversations_visible_before_delete(self, studio_session, customer_session):
        """Both parties can see the conversation."""
        # Ensure conversation exists
        ensure_conversation(studio_session, customer_session)

        studio_convs = studio_session.get(f"{BASE_URL}/api/messages").json()
        customer_convs = customer_session.get(f"{BASE_URL}/api/messages").json()

        studio_has_conv = any(c["other_user_id"] == CUSTOMER_USER_ID for c in studio_convs)
        customer_has_conv = any(c["other_user_id"] == STUDIO_USER_ID for c in customer_convs)

        assert studio_has_conv, "Studio should see conversation with customer"
        assert customer_has_conv, "Customer should see conversation with studio"
        print("PASS: Both parties see the conversation before delete")

    def test_delete_conversation_by_studio(self, studio_session, customer_session):
        """Studio deletes conversation - creates system message, marks deleted_by."""
        # Ensure conversation exists first
        ensure_conversation(studio_session, customer_session)

        resp = studio_session.delete(f"{BASE_URL}/api/conversations/{CUSTOMER_USER_ID}")
        assert resp.status_code == 200, f"Delete failed: {resp.text}"
        data = resp.json()
        assert data.get("success") is True
        print("PASS: Studio deleted conversation successfully")

    def test_after_delete_studio_conv_gone(self, studio_session):
        """After studio deletes, conversation is gone from studio's list."""
        convs = studio_session.get(f"{BASE_URL}/api/messages").json()
        studio_has_conv = any(c["other_user_id"] == CUSTOMER_USER_ID for c in convs)
        assert not studio_has_conv, "Studio should NOT see deleted conversation"
        print("PASS: Conversation removed from studio's list after deletion")

    def test_after_delete_customer_still_sees_conv(self, customer_session):
        """After studio deletes, customer still sees the conversation."""
        convs = customer_session.get(f"{BASE_URL}/api/messages").json()
        customer_has_conv = any(c["other_user_id"] == STUDIO_USER_ID for c in convs)
        assert customer_has_conv, "Customer should still see conversation after studio deleted"
        print("PASS: Customer still sees conversation after studio deleted")

    def test_system_message_appears_in_messages(self, customer_session):
        """System message appears in customer's message list."""
        msgs = customer_session.get(f"{BASE_URL}/api/messages/{STUDIO_USER_ID}").json()
        system_msgs = [m for m in msgs if m.get("is_system")]
        assert len(system_msgs) > 0, "Should have at least one system message"
        last_sys = system_msgs[-1]
        assert "hat die Unterhaltung gelöscht und beendet" in last_sys["content"]
        print(f"PASS: System message: '{last_sys['content']}'")

    def test_conversation_deleted_by_set(self, customer_session):
        """Customer's conv list shows deleted_by is set."""
        convs = customer_session.get(f"{BASE_URL}/api/messages").json()
        conv = next((c for c in convs if c["other_user_id"] == STUDIO_USER_ID), None)
        assert conv is not None
        assert conv.get("deleted_by"), "deleted_by should be set in conversation"
        assert STUDIO_USER_ID in conv["deleted_by"], "deleted_by should contain studio's user_id"
        print(f"PASS: deleted_by contains studio's ID: {conv['deleted_by']}")

    def test_second_party_also_deletes(self, customer_session, studio_session):
        """Customer also deletes the conversation - it should vanish from customer's list too."""
        resp = customer_session.delete(f"{BASE_URL}/api/conversations/{STUDIO_USER_ID}")
        assert resp.status_code == 200, f"Customer delete failed: {resp.text}"
        assert resp.json().get("success") is True

        convs = customer_session.get(f"{BASE_URL}/api/messages").json()
        customer_has_conv = any(c["other_user_id"] == STUDIO_USER_ID for c in convs)
        assert not customer_has_conv, "Conversation should be gone from customer's list after they also delete"
        print("PASS: Conversation gone from customer's list after both deleted")

    def test_restore_conversation_for_ui_testing(self, studio_session, customer_session):
        """Send a new message to restore the conversation for UI testing."""
        resp = studio_session.post(f"{BASE_URL}/api/messages",
                                   json={"recipient_id": CUSTOMER_USER_ID,
                                         "content": "TEST_restored_for_ui_test", "image_url": ""})
        assert resp.status_code == 200, f"Failed to restore: {resp.text}"
        print("PASS: Conversation restored for UI testing")
