"""
Backend API tests for AI Studio Click Massa
Tests: auth, agents, templates, skills, integrations, executions, dashboard
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestAuth:
    """Auth endpoint tests"""

    def test_login_success(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@clickmassa.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        # Login returns user fields directly + token
        assert data["email"] == "admin@clickmassa.com"

    def test_login_invalid(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrong"
        })
        assert response.status_code in [401, 400]

    def test_get_me(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data

    def test_register(self):
        import time
        ts = int(time.time())
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_user_{ts}@example.com",
            "password": "Test1234!",
            "name": "Test User"
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "token" in data or "user" in data


class TestDashboard:
    """Dashboard stats"""

    def test_dashboard_stats(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Should have some stats keys
        assert isinstance(data, dict)


class TestAgents:
    """Agents CRUD"""

    def test_list_agents(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/agents", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_agent(self, auth_headers):
        response = requests.post(f"{BASE_URL}/api/agents", headers=auth_headers, json={
            "name": "TEST_Agent",
            "description": "Test agent",
            "type": "assistant"
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data or "_id" in data


class TestTemplates:
    """Templates"""

    def test_list_templates(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/templates", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected 6+ templates, got {len(data)}"

    def test_use_template(self, auth_headers):
        # Get templates first
        r = requests.get(f"{BASE_URL}/api/templates", headers=auth_headers)
        templates = r.json()
        if not templates:
            pytest.skip("No templates found")
        template_id = templates[0].get("id") or templates[0].get("_id")
        response = requests.post(f"{BASE_URL}/api/templates/{template_id}/clone", headers=auth_headers)
        assert response.status_code in [200, 201]


class TestSkills:
    """Skills"""

    def test_list_skills(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/skills", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 8, f"Expected 8+ skills, got {len(data)}"


class TestIntegrations:
    """Integrations"""

    def test_list_integrations(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/integrations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_clickmassa_connected(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/integrations", headers=auth_headers)
        data = response.json()
        cm = next((i for i in data if "click" in i.get("name","").lower() or "clickmassa" in i.get("provider","").lower()), None)
        assert cm is not None, "Click Massa integration not found"
        assert cm.get("status") == "connected" or cm.get("connected") == True

    def test_clickmassa_test_connection(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/integrations", headers=auth_headers)
        data = response.json()
        cm = next((i for i in data if "click" in i.get("name","").lower() or "clickmassa" in i.get("provider","").lower()), None)
        if not cm:
            pytest.skip("Click Massa integration not found")
        integration_id = cm.get("id") or cm.get("_id")
        r = requests.post(f"{BASE_URL}/api/integrations/{integration_id}/test", headers=auth_headers)
        assert r.status_code == 200


class TestExecutions:
    """Executions"""

    def test_list_executions(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/executions", headers=auth_headers)
        assert response.status_code == 200


class TestMindmap:
    """Mind map"""

    def test_list_mindmaps(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/mindmap", headers=auth_headers)
        assert response.status_code == 200


@pytest.fixture(scope="session")
def auth_headers():
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@clickmassa.com",
        "password": "admin123"
    })
    if response.status_code != 200:
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}
