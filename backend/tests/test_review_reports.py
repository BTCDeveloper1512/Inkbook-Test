"""Test review report feature: submit report, delete review via admin"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

CUSTOMER_EMAIL = "kunde@test.com"
CUSTOMER_PASS = "test1234"
ADMIN_EMAIL = "admin@inkbook.com"
ADMIN_PASS = "admin123"
STUDIO_ID = "studio_c4455cefb0ed"


@pytest.fixture(scope="module")
def customer_token():
    """Returns a session with cookies set"""
    session = requests.Session()
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASS})
    assert r.status_code == 200, f"Customer login failed: {r.text}"
    return session


@pytest.fixture(scope="module")
def admin_token():
    """Returns a session with cookies set"""
    session = requests.Session()
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return session


@pytest.fixture(scope="module")
def review_id(customer_token, admin_token):
    """Get or create a test review, return its review_id"""
    r = customer_token.post(f"{BASE_URL}/api/studios/{STUDIO_ID}/reviews",
                      json={"studio_id": STUDIO_ID, "rating": 4, "comment": "TEST_review for report testing"})
    if r.status_code in [200, 201]:
        rid = r.json().get("review_id")
        print(f"Created review_id: {rid}")
        return rid
    # Already reviewed - fetch existing reviews and find ours
    reviews_r = customer_token.get(f"{BASE_URL}/api/studios/{STUDIO_ID}/reviews")
    if reviews_r.status_code == 200:
        reviews = reviews_r.json()
        for rv in reviews:
            if "TEST_review" in rv.get("comment", ""):
                print(f"Reusing existing review_id: {rv['review_id']}")
                return rv["review_id"]
        # Return first available review
        if reviews:
            print(f"Using first review: {reviews[0]['review_id']}")
            return reviews[0]["review_id"]
    pytest.skip("Cannot get a review_id for testing")


class TestSubmitReport:
    """Test POST /api/reports with target_type=review"""

    def test_submit_review_report(self, customer_token, review_id):
        r = customer_token.post(f"{BASE_URL}/api/reports",
                          json={"target_type": "review", "target_id": review_id, "reason": "TEST_spam review"})
        assert r.status_code == 200, f"Submit report failed: {r.text}"
        data = r.json()
        assert data.get("target_type") == "review"
        assert data.get("target_id") == review_id
        assert "report_id" in data
        print(f"Report created: {data.get('report_id')}")
        preview = data.get("target_preview")
        assert preview is not None, "target_preview should be stored"
        assert preview.get("rating") == 4
        assert "TEST_review" in preview.get("comment", "")
        print(f"target_preview: {preview}")

    def test_report_unauthenticated_fails(self, review_id):
        r = requests.post(f"{BASE_URL}/api/reports",
                          json={"target_type": "review", "target_id": review_id, "reason": "test"})
        assert r.status_code in [401, 403], f"Expected auth error, got: {r.status_code}"


class TestAdminReports:
    """Test admin report endpoints"""

    def test_get_reports(self, admin_token):
        r = admin_token.get(f"{BASE_URL}/api/admin/reports")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"Total reports: {len(data)}")
        review_reports = [x for x in data if x.get("target_type") == "review"]
        print(f"Review reports: {len(review_reports)}")

    def test_delete_review_from_report(self, admin_token, customer_token, review_id):
        """Use the review created in fixture, report it and delete via admin endpoint"""
        # Report the existing review
        rp = customer_token.post(f"{BASE_URL}/api/reports",
                           json={"target_type": "review", "target_id": review_id, "reason": "TEST_delete_test_2"})
        assert rp.status_code == 200, f"Create report: {rp.text}"
        report_id = rp.json().get("report_id")

        d = admin_token.delete(f"{BASE_URL}/api/admin/reports/{report_id}/delete-review")
        assert d.status_code == 200, f"Delete review from report: {d.text}"
        assert d.json().get("deleted") == True

        reports = admin_token.get(f"{BASE_URL}/api/admin/reports").json()
        report_ids = [x.get("report_id") for x in reports]
        assert report_id not in report_ids, "Report should be deleted"
        print("delete-review endpoint: PASS")

    def test_admin_reports_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/admin/reports")
        assert r.status_code in [401, 403]
