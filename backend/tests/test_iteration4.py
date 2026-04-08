"""Iteration 4 tests — Security, Webhook, Integrations, Agents, Regression"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

LOGIN_PAYLOAD = {"email": "admin@clickmassa.com", "password": "admin123"}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session(session):
    resp = session.post(f"{BASE_URL}/api/auth/login", json=LOGIN_PAYLOAD)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    # cookies set via Set-Cookie header (httpOnly)
    return session


# ---- SECURITY ----

class TestSecurity:
    """Security tests: password validation, httpOnly cookies, invalid ID handling"""

    def test_register_short_password_returns_422(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test", "email": "shortpwd@test.com", "password": "abc"
        })
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}"
        body = resp.json()
        detail_str = str(body)
        assert "8" in detail_str or "Senha" in detail_str, f"Error message not clear: {detail_str}"
        print("PASS: register short password returns 422")

    def test_login_sets_httponly_cookies(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json=LOGIN_PAYLOAD)
        assert resp.status_code == 200
        set_cookie = resp.headers.get("set-cookie", "")
        # Check both cookies present and HttpOnly flag
        assert "access_token" in set_cookie, "access_token cookie missing"
        assert "HttpOnly" in set_cookie, "HttpOnly flag missing in cookies"
        print(f"PASS: httpOnly cookies set. Set-Cookie snippet: {set_cookie[:120]}")

    def test_get_agent_invalid_id_returns_400(self, auth_session):
        resp = auth_session.get(f"{BASE_URL}/api/agents/INVALID-ID-XYZ")
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "inválido" in data.get("detail", "").lower() or "invalid" in data.get("detail", "").lower()
        print("PASS: invalid agent ID returns 400")


# ---- WEBHOOK ----

class TestWebhook:
    """Webhook endpoint tests"""

    def test_webhook_clickmassa_returns_received(self):
        # Use a fake tenant_id — just check the response shape, not LLM execution
        resp = requests.post(f"{BASE_URL}/api/webhook/clickmassa/test-tenant-123", json={
            "numero_cliente": "+5511999999999",
            "sessionId": "sess-abc-123",
            "mensagem_cliente": "Olá, preciso de ajuda",
            "url_envio": "https://httpbin.org/post"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("received") == True, f"Expected received=True: {data}"
        assert data.get("session_id") == "sess-abc-123", f"session_id mismatch: {data}"
        print(f"PASS: webhook returns {data}")


# ---- INTEGRATIONS ----

class TestIntegrations:
    """Integration CRUD and test endpoint"""

    def test_create_integration_and_test_returns_is_mock(self, auth_session):
        # Create a clickmassa integration without real credentials
        resp = auth_session.post(f"{BASE_URL}/api/integrations", json={
            "provider": "clickmassa",
            "name": "TEST_Demo Integration",
            "credentials": {},
            "config": {}
        })
        assert resp.status_code == 200, f"Create failed: {resp.text}"
        data = resp.json()
        integration_id = data["id"]
        print(f"Created integration: {integration_id}")

        # Test connection — should return is_mock=True
        test_resp = auth_session.post(f"{BASE_URL}/api/integrations/{integration_id}/test")
        assert test_resp.status_code == 200, f"Test failed: {test_resp.text}"
        test_data = test_resp.json()
        assert "is_mock" in test_data, f"is_mock field missing: {test_data}"
        assert test_data["is_mock"] == True, f"Expected is_mock=True: {test_data}"
        print(f"PASS: test returns is_mock=True: {test_data}")

        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/integrations/{integration_id}")


# ---- REGRESSION ----

class TestRegression:
    """Regression: login, dashboard, agents list"""

    def test_login_admin(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json=LOGIN_PAYLOAD)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("email") == "admin@clickmassa.com"
        print("PASS: admin login works")

    def test_me_endpoint(self, auth_session):
        resp = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert "email" in data
        print(f"PASS: /me returns user: {data.get('email')}")

    def test_agents_list(self, auth_session):
        resp = auth_session.get(f"{BASE_URL}/api/agents")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        print(f"PASS: agents list returns {len(resp.json())} agents")
