"""Tests for POST /api/generate/agent endpoint"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_cookies():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@clickmassa.com", "password": "admin123"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.cookies

class TestGenerateAgent:
    """Tests for generate/agent endpoint"""

    def test_generate_valid_prompt(self, auth_cookies):
        """Valid prompt should return agent structure"""
        resp = requests.post(
            f"{BASE_URL}/api/generate/agent",
            json={"prompt": "Agente de atendimento via WhatsApp com qualificação de leads"},
            cookies=auth_cookies,
            timeout=30
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "agent_name" in data
        assert "description" in data
        assert "summary" in data
        assert "flow_definition" in data
        assert "required_credentials" in data

        flow = data["flow_definition"]
        assert "nodes" in flow
        assert "edges" in flow
        assert len(flow["nodes"]) > 0

        # Check node structure
        node = flow["nodes"][0]
        assert "id" in node
        assert "type" in node
        assert "position" in node
        assert "data" in node
        assert "x" in node["position"]
        assert "y" in node["position"]

        print(f"Generated agent: {data['agent_name']}, {len(flow['nodes'])} nodes, {len(flow['edges'])} edges")

    def test_generate_short_prompt_returns_400(self, auth_cookies):
        """Short prompt (<10 chars) should return 400"""
        resp = requests.post(
            f"{BASE_URL}/api/generate/agent",
            json={"prompt": "short"},
            cookies=auth_cookies,
            timeout=10
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        print("Short prompt correctly rejected with 400")

    def test_generate_no_auth_returns_401_or_403(self):
        """No authentication should return 401 or 403"""
        resp = requests.post(
            f"{BASE_URL}/api/generate/agent",
            json={"prompt": "Agente de atendimento via WhatsApp"},
            timeout=10
        )
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
        print(f"Unauthenticated request correctly rejected with {resp.status_code}")

    def test_generate_edges_structure(self, auth_cookies):
        """Edges should have id, source, target"""
        resp = requests.post(
            f"{BASE_URL}/api/generate/agent",
            json={"prompt": "Agente simples de notificação por email quando recebe formulário"},
            cookies=auth_cookies,
            timeout=30
        )
        assert resp.status_code == 200
        data = resp.json()
        edges = data["flow_definition"]["edges"]
        if edges:
            edge = edges[0]
            assert "id" in edge
            assert "source" in edge
            assert "target" in edge
            print(f"Edge structure OK: {edge}")
        else:
            print("No edges returned (single node flow)")
