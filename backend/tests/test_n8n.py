"""
Tests for n8n endpoints: blueprints, deploy (not_configured), deployment status
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ── Auth fixture ──────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def auth_headers():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@clickmassa.com",
        "password": "admin123"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    token = data.get("token") or data.get("access_token")
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ── n8n Status ────────────────────────────────────────────────────────
class TestN8nStatus:
    def test_get_status_not_configured(self, auth_headers):
        """N8N_API_URL is empty, should return configured=False"""
        resp = requests.get(f"{BASE_URL}/api/n8n/status", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["configured"] == False
        assert "message" in data
        print(f"n8n status: {data}")


# ── Blueprints CRUD ───────────────────────────────────────────────────
class TestBlueprints:
    blueprint_id = None

    def test_list_blueprints_empty_or_populated(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/n8n/blueprints", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        print(f"Blueprints count: {len(resp.json())}")

    def test_save_blueprint(self, auth_headers):
        payload = {
            "name": "TEST_Blueprint_1",
            "description": "Test blueprint for n8n",
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Webhook Trigger"}},
                {"id": "ai-1", "type": "ai_agent", "position": {"x": 350, "y": 100}, "data": {"label": "AI Agent", "model": "gpt-4o"}},
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "ai-1"}
            ],
        }
        resp = requests.post(f"{BASE_URL}/api/n8n/blueprints", json=payload, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert data["name"] == "TEST_Blueprint_1"
        assert data["node_count"] == 2
        assert data["edge_count"] == 1
        assert "validation" in data
        TestBlueprints.blueprint_id = data["id"]
        print(f"Created blueprint id: {data['id']}")

    def test_get_blueprint_by_id(self, auth_headers):
        bp_id = TestBlueprints.blueprint_id
        if not bp_id:
            pytest.skip("No blueprint_id from previous test")
        resp = requests.get(f"{BASE_URL}/api/n8n/blueprints/{bp_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == bp_id
        assert data["name"] == "TEST_Blueprint_1"
        print(f"Retrieved blueprint: {data['id']}")

    def test_preview_translation(self, auth_headers):
        bp_id = TestBlueprints.blueprint_id
        if not bp_id:
            pytest.skip("No blueprint_id from previous test")
        resp = requests.get(f"{BASE_URL}/api/n8n/blueprints/{bp_id}/preview", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "n8n_workflow" in data
        assert "validation" in data
        workflow = data["n8n_workflow"]
        assert "nodes" in workflow
        assert "connections" in workflow
        assert workflow["name"] == "TEST_Blueprint_1"
        print(f"Preview workflow nodes: {len(workflow['nodes'])}")

    def test_get_blueprint_not_found(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/n8n/blueprints/000000000000000000000000", headers=auth_headers)
        assert resp.status_code == 404


# ── Deploy (not_configured) ───────────────────────────────────────────
class TestDeploy:
    def test_deploy_returns_not_configured(self, auth_headers):
        """N8N not configured, deploy should return status=not_configured"""
        bp_id = TestBlueprints.blueprint_id
        if not bp_id:
            pytest.skip("No blueprint_id from blueprints test")
        resp = requests.post(f"{BASE_URL}/api/n8n/deploy", json={
            "blueprint_id": bp_id,
            "activate": False
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "not_configured"
        assert data["success"] == False
        assert "n8n_workflow_preview" in data
        print(f"Deploy response: {data['status']} - {data['message']}")

    def test_get_deployment_status_after_deploy(self, auth_headers):
        bp_id = TestBlueprints.blueprint_id
        if not bp_id:
            pytest.skip("No blueprint_id")
        resp = requests.get(f"{BASE_URL}/api/n8n/deployments/{bp_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # After a not_configured deploy, status should be "pending"
        assert data["status"] in ["pending", "not_deployed"]
        print(f"Deployment status: {data['status']}")

    def test_get_deployment_not_found(self, auth_headers):
        """Non-existent blueprint should return not_deployed"""
        resp = requests.get(f"{BASE_URL}/api/n8n/deployments/nonexistent-bp", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "not_deployed"

    def test_deploy_empty_blueprint_fails_validation(self, auth_headers):
        """Blueprint with no nodes should fail with 422"""
        payload = {
            "name": "TEST_Empty_Blueprint",
            "description": "Empty - should fail",
            "nodes": [],
            "edges": [],
        }
        # First save empty blueprint
        save_resp = requests.post(f"{BASE_URL}/api/n8n/blueprints", json=payload, headers=auth_headers)
        assert save_resp.status_code == 200
        empty_bp_id = save_resp.json()["id"]

        deploy_resp = requests.post(f"{BASE_URL}/api/n8n/deploy", json={
            "blueprint_id": empty_bp_id, "activate": False
        }, headers=auth_headers)
        assert deploy_resp.status_code == 422
        print(f"Empty blueprint deploy correctly rejected: {deploy_resp.status_code}")
