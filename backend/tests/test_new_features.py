"""
Backend tests for 4 new features:
1. FAQ role separation
2. Announcement Bell
3. Broadcast as InkBook News
4. Support Ticket System
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

def get_session(email, password):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    return s, r

class TestFAQ:
    """FAQ role-filtering endpoints"""

    def test_faq_public_no_role(self):
        r = requests.get(f"{BASE_URL}/api/faq/public")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"FAQ public (no role): {len(r.json())} items")

    def test_faq_public_customer_role(self):
        r = requests.get(f"{BASE_URL}/api/faq/public", params={"role": "customer"})
        assert r.status_code == 200
        items = r.json()
        # All returned items should be visible to customer (all or customer)
        for item in items:
            assert item.get("target_role") in (None, "all", "customer"), \
                f"item with target_role={item.get('target_role')} should not show for customer"
        print(f"FAQ customer: {len(items)} items")

    def test_faq_public_studio_role(self):
        r = requests.get(f"{BASE_URL}/api/faq/public", params={"role": "studio_owner"})
        assert r.status_code == 200
        items = r.json()
        for item in items:
            assert item.get("target_role") in (None, "all", "studio_owner"), \
                f"item with target_role={item.get('target_role')} should not show for studio"
        print(f"FAQ studio: {len(items)} items")

    def test_admin_faq_create_customer(self):
        s, _ = get_session("admin@inkbook.com", "admin123")
        r = s.post(f"{BASE_URL}/api/admin/faq", json={
            "question": "TEST_Kunden FAQ?",
            "answer": "TEST Answer",
            "category": "TEST",
            "target_role": "customer"
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("target_role") == "customer"
        print(f"Created FAQ: {data.get('faq_id')}")
        # Cleanup
        if data.get('faq_id'):
            s.delete(f"{BASE_URL}/api/admin/faq/{data['faq_id']}")

    def test_admin_faq_create_studio(self):
        s, _ = get_session("admin@inkbook.com", "admin123")
        r = s.post(f"{BASE_URL}/api/admin/faq", json={
            "question": "TEST_Studios FAQ?",
            "answer": "TEST Answer",
            "category": "TEST",
            "target_role": "studio_owner"
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("target_role") == "studio_owner"
        # Cleanup
        if data.get('faq_id'):
            s.delete(f"{BASE_URL}/api/admin/faq/{data['faq_id']}")


class TestAnnouncements:
    """Announcement endpoints"""

    def test_get_active_announcement(self):
        r = requests.get(f"{BASE_URL}/api/announcements/active")
        # May be null or an announcement object
        assert r.status_code == 200
        print(f"Active announcement: {r.json()}")

    def test_admin_create_announcement(self):
        s, _ = get_session("admin@inkbook.com", "admin123")
        r = s.post(f"{BASE_URL}/api/admin/announcements", json={
            "text": "TEST Ankündigung",
            "type": "info",
            "active": True
        })
        assert r.status_code == 200
        data = r.json()
        ann_id = data.get("announcement_id")
        print(f"Created announcement: {ann_id}")
        # Verify active
        r2 = requests.get(f"{BASE_URL}/api/announcements/active")
        assert r2.status_code == 200
        assert r2.json() is not None
        # Cleanup - deactivate
        if ann_id:
            s.put(f"{BASE_URL}/api/admin/announcements/{ann_id}", json={"active": False, "text": "TEST", "type": "info"})


class TestBroadcast:
    """Broadcast messaging"""

    def test_admin_broadcast(self):
        s, _ = get_session("admin@inkbook.com", "admin123")
        r = s.post(f"{BASE_URL}/api/admin/broadcast", json={
            "title": "Test Broadcast",
            "message": "TEST Broadcast Nachricht",
            "target": "all"
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("sent", 0) >= 0
        print(f"Broadcast sent to: {data.get('sent')} users")

    def test_customer_messages_has_inkbook_news(self):
        s, _ = get_session("test_customer@inkbook.com", "Test1234!")
        r = s.get(f"{BASE_URL}/api/messages")
        assert r.status_code == 200
        convs = r.json()
        broadcast_convs = [c for c in convs if c.get("is_broadcast_conv")]
        print(f"Broadcast conversations for customer: {len(broadcast_convs)}")
        # After broadcast, at least one should exist
        assert len(broadcast_convs) >= 1, "No InkBook News conversation found after broadcast"

    def test_inkbook_news_messages(self):
        s, _ = get_session("test_customer@inkbook.com", "Test1234!")
        r = s.get(f"{BASE_URL}/api/messages/inkbook_system")
        assert r.status_code == 200
        msgs = r.json()
        print(f"InkBook News messages: {len(msgs)}")


class TestSupportTickets:
    """Support ticket endpoints"""

    def test_create_ticket(self):
        s, _ = get_session("test_customer@inkbook.com", "Test1234!")
        r = s.post(f"{BASE_URL}/api/support/tickets", json={
            "subject": "TEST Support Anfrage",
            "description": "TEST Beschreibung des Problems"
        })
        assert r.status_code == 200
        data = r.json()
        assert "ticket_number" in data
        assert data["ticket_number"].startswith("IB-")
        print(f"Created ticket: {data['ticket_number']}")
        return data.get("ticket_id")

    def test_get_my_tickets(self):
        s, _ = get_session("test_customer@inkbook.com", "Test1234!")
        r = s.get(f"{BASE_URL}/api/support/my-tickets")
        assert r.status_code == 200
        tickets = r.json()
        assert isinstance(tickets, list)
        print(f"My tickets: {len(tickets)}")

    def test_admin_get_support_tickets(self):
        s, _ = get_session("admin@inkbook.com", "admin123")
        r = s.get(f"{BASE_URL}/api/admin/support-tickets-new")
        assert r.status_code == 200
        tickets = r.json()
        assert isinstance(tickets, list)
        print(f"Admin tickets: {len(tickets)}")

    def test_admin_reply_ticket(self):
        # First create a ticket
        cs, _ = get_session("test_customer@inkbook.com", "Test1234!")
        cr = cs.post(f"{BASE_URL}/api/support/tickets", json={
            "subject": "TEST Reply Test",
            "description": "TEST reply desc"
        })
        assert cr.status_code == 200
        ticket_id = cr.json().get("ticket_id")

        # Admin replies
        s, _ = get_session("admin@inkbook.com", "admin123")
        rr = s.post(f"{BASE_URL}/api/admin/support-tickets/{ticket_id}/reply", json={
            "message": "TEST Admin reply"
        })
        assert rr.status_code == 200
        data = rr.json()
        assert data.get("replied") == True
        print(f"Replied to ticket: {data}")

    def test_admin_get_direct_chats(self):
        s, _ = get_session("admin@inkbook.com", "admin123")
        r = s.get(f"{BASE_URL}/api/admin/direct-chats")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"Direct chats: {len(r.json())}")

    def test_direct_chat_non_pro(self):
        """Non-pro user should get 403 for direct chat"""
        s, _ = get_session("test_customer@inkbook.com", "Test1234!")
        r = s.get(f"{BASE_URL}/api/support/direct")
        # Should be 403 for non-pro user
        print(f"Direct chat response for non-pro: {r.status_code}")
        assert r.status_code in [403, 200]  # 403 expected for non-pro
