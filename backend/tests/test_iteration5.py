"""Iteration 5 backend tests - rebranding + ws-token + webhook + voice_call"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    resp = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@clickmassa.com", "password": "admin123"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return s


# --- ws-token ---

def test_ws_token_unauthenticated():
    """Unauthenticated request to ws-token must return 401"""
    r = requests.get(f"{BASE_URL}/api/workspace/ws-token")
    assert r.status_code == 401


def test_ws_token_authenticated(session):
    """Authenticated request must return ws_token + expires_in=60"""
    r = session.get(f"{BASE_URL}/api/workspace/ws-token")
    assert r.status_code == 200
    data = r.json()
    assert "ws_token" in data
    assert isinstance(data["ws_token"], str)
    assert len(data["ws_token"]) > 0
    assert data["expires_in"] == 60


# --- Webhook clickmassa ---

VALID_PAYLOAD = {
    "numero_cliente": "5511999990000",
    "sessionId": "test-session",
    "mensagem_cliente": "Olá",
    "url_envio": "https://httpbin.org/post",
}


def test_webhook_invalid_tenant_id():
    """Invalid ObjectId format must return 400"""
    r = requests.post(f"{BASE_URL}/api/webhook/clickmassa/not_an_objectid", json=VALID_PAYLOAD)
    assert r.status_code == 400


def test_webhook_nonexistent_tenant_id():
    """Valid ObjectId but nonexistent tenant must return 404"""
    r = requests.post(f"{BASE_URL}/api/webhook/clickmassa/aaaaaaaaaaaaaaaaaaaaaaaa", json=VALID_PAYLOAD)
    assert r.status_code == 404


# --- n8n_translator voice_call ---

def test_voice_call_in_n8n_node_map():
    """Verify voice_call is in N8N_NODE_MAP with correct type"""
    import sys
    sys.path.insert(0, "/app/backend")
    from services.n8n_translator import N8N_NODE_MAP
    assert "voice_call" in N8N_NODE_MAP
    assert N8N_NODE_MAP["voice_call"]["type"] == "n8n-nodes-base.httpRequest"
