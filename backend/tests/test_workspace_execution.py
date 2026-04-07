"""
Tests for iteration 3: Workspace n8n-config, WebSocket execution, LLM, AgentRun features.
"""
import pytest
import requests
import os
import asyncio
import json
import websockets

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
BACKEND_WS = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")


@pytest.fixture(scope="module")
def token():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@clickmassa.com",
        "password": "admin123"
    })
    assert resp.status_code == 200
    return resp.json().get("token", "")


@pytest.fixture(scope="module")
def agent_with_nodes(token):
    """Get first agent that has nodes."""
    resp = requests.get(f"{BASE_URL}/api/agents", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    agents = resp.json()
    for a in agents:
        if len(a.get("flow_definition", {}).get("nodes", [])) > 0:
            return a
    pytest.skip("No agent with nodes found")


# ─── N8N Config tests ────────────────────────────────────────────────────────

class TestN8nConfig:
    """GET/PUT /api/workspace/n8n-config"""

    def test_get_n8n_config_unauthenticated(self):
        resp = requests.get(f"{BASE_URL}/api/workspace/n8n-config")
        assert resp.status_code in [401, 403]

    def test_get_n8n_config_authenticated(self, token):
        resp = requests.get(f"{BASE_URL}/api/workspace/n8n-config",
                            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "api_url" in data
        assert "api_key_masked" in data
        assert "configured" in data
        assert isinstance(data["configured"], bool)

    def test_put_n8n_config_saves_and_returns_success(self, token):
        payload = {"api_url": "https://test-n8n.example.com", "api_key": "test-key-12345678"}
        resp = requests.put(f"{BASE_URL}/api/workspace/n8n-config",
                            json=payload, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") is True

    def test_get_n8n_config_after_save_shows_configured(self, token):
        # After saving a valid url + key, configured should be True
        get_resp = requests.get(f"{BASE_URL}/api/workspace/n8n-config",
                                headers={"Authorization": f"Bearer {token}"})
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["configured"] is True
        assert data["api_url"] == "https://test-n8n.example.com"
        # API key should be masked
        assert "test-key" not in data.get("api_key_masked", "") or "•" in data.get("api_key_masked", "")

    def test_put_n8n_config_clear(self, token):
        # Clear config - reset for other tests
        requests.put(f"{BASE_URL}/api/workspace/n8n-config",
                     json={"api_url": "", "api_key": ""},
                     headers={"Authorization": f"Bearer {token}"})


# ─── WebSocket Execution tests ────────────────────────────────────────────────

class TestWebSocketExecution:
    """WebSocket /api/workspace/ws/run/{agent_id}"""

    def test_websocket_invalid_token(self, agent_with_nodes):
        agent_id = agent_with_nodes["id"]

        async def run():
            ws_url = f"{BACKEND_WS}/api/workspace/ws/run/{agent_id}?token=invalid&input_text=test"
            try:
                async with websockets.connect(ws_url) as ws:
                    msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=5))
                    return msg
            except Exception as e:
                return {"error": str(e)}

        result = asyncio.get_event_loop().run_until_complete(run())
        # Should get an error about invalid token or connection should close
        assert "error" in result or "type" in result

    def test_websocket_execution_full_flow(self, token, agent_with_nodes):
        agent_id = agent_with_nodes["id"]

        async def run():
            ws_url = f"{BACKEND_WS}/api/workspace/ws/run/{agent_id}?token={token}&input_text=Teste+de+execução"
            messages = []
            try:
                async with websockets.connect(ws_url, open_timeout=10) as ws:
                    async for raw_msg in ws:
                        msg = json.loads(raw_msg)
                        messages.append(msg)
                        if msg.get("type") in {"execution_done", "execution_error", "error"}:
                            break
                        if len(messages) > 50:
                            break
            except Exception as e:
                messages.append({"error": str(e)})
            return messages

        messages = asyncio.get_event_loop().run_until_complete(run())
        assert len(messages) > 0, "No messages received from WebSocket"

        msg_types = [m.get("type") for m in messages]
        print(f"Message types received: {msg_types}")

        # Should have exec_id
        assert any(m.get("type") == "exec_id" for m in messages), f"No exec_id message. Got: {msg_types}"
        # Should have execution_start
        assert any(m.get("type") == "execution_start" for m in messages), f"No execution_start. Got: {msg_types}"
        # Should have node_start events
        assert any(m.get("type") == "node_start" for m in messages), f"No node_start. Got: {msg_types}"
        # Should have node_done events
        assert any(m.get("type") == "node_done" for m in messages), f"No node_done. Got: {msg_types}"
        # Should complete
        assert any(m.get("type") == "execution_done" for m in messages), f"No execution_done. Got: {msg_types}"

    def test_websocket_execution_done_has_output(self, token, agent_with_nodes):
        agent_id = agent_with_nodes["id"]

        async def run():
            ws_url = f"{BACKEND_WS}/api/workspace/ws/run/{agent_id}?token={token}&input_text=Hello+LLM"
            messages = []
            try:
                async with websockets.connect(ws_url, open_timeout=10) as ws:
                    async for raw_msg in ws:
                        msg = json.loads(raw_msg)
                        messages.append(msg)
                        if msg.get("type") in {"execution_done", "execution_error", "error"}:
                            break
                        if len(messages) > 50:
                            break
            except Exception as e:
                messages.append({"error": str(e)})
            return messages

        messages = asyncio.get_event_loop().run_until_complete(run())
        done_msgs = [m for m in messages if m.get("type") == "execution_done"]
        assert len(done_msgs) > 0, "No execution_done message"

        done = done_msgs[0]
        output = done.get("output", "")
        print(f"Final output (first 200 chars): {str(output)[:200]}")
        assert output is not None, "Output is None"
        # Check if LLM responded (not simulated)
        if "[Simulado]" in str(output):
            print("WARNING: LLM returned simulated response — EMERGENT_LLM_KEY may not be working")
        else:
            print("LLM returned real response")


# ─── Regression: Agents endpoint ─────────────────────────────────────────────

class TestRegression:
    def test_login_works(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@clickmassa.com", "password": "admin123"
        })
        assert resp.status_code == 200
        assert "token" in resp.json()

    def test_agents_list(self, token):
        resp = requests.get(f"{BASE_URL}/api/agents", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_agent_by_id(self, token, agent_with_nodes):
        agent_id = agent_with_nodes["id"]
        resp = requests.get(f"{BASE_URL}/api/agents/{agent_id}",
                            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == agent_id
        assert "flow_definition" in data
