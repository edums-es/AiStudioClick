"""
Workspace Router — configurações por tenant + WebSocket de execução ao vivo.

Endpoints:
  GET  /api/workspace/n8n-config    → config do motor de execução por tenant
  PUT  /api/workspace/n8n-config    → atualiza config do motor por tenant
  GET  /api/workspace/ws-token      → gera token de curta duração para WebSocket
  WS   /api/workspace/ws/run/{id}   → executa agente ao vivo via WebSocket
"""

import logging
import secrets
from typing import Optional
from datetime import datetime, timezone, timedelta

import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

from core.auth import get_current_user, get_jwt_secret, JWT_ALGORITHM
from core.database import get_db
from services.execution_service import ExecutionEngine

router = APIRouter()
logger = logging.getLogger(__name__)
engine = ExecutionEngine()

# In-memory store for short-lived WS tokens (one-use, 60s TTL)
# Em produção substituir por Redis
_ws_tokens: dict = {}


# ─────────────────────────────────────────────
# Motor de Execução (n8n config per-tenant)
# ─────────────────────────────────────────────

class EngineConfigUpdate(BaseModel):
    api_url: str = ""
    api_key: str = ""


@router.get("/n8n-config")
async def get_engine_config(user: dict = Depends(get_current_user)):
    db = get_db()
    tenant = await db.tenants.find_one({"_id": ObjectId(user["tenant_id"])})
    config = (tenant or {}).get("n8n_config", {"api_url": "", "api_key": ""})
    masked = config.get("api_key", "")
    if masked and len(masked) > 8:
        masked = masked[:4] + "•" * (len(masked) - 8) + masked[-4:]
    return {
        "api_url": config.get("api_url", ""),
        "api_key_masked": masked,
        "configured": bool(config.get("api_url") and config.get("api_key")),
    }


@router.put("/n8n-config")
async def update_engine_config(data: EngineConfigUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.tenants.update_one(
        {"_id": ObjectId(user["tenant_id"])},
        {"$set": {
            "n8n_config": {
                "api_url": data.api_url.rstrip("/"),
                "api_key": data.api_key,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        }},
    )
    return {"success": True, "message": "Configuração salva com sucesso!"}


# ─────────────────────────────────────────────
# WS Token — curta duração para WebSocket
# ─────────────────────────────────────────────

@router.get("/ws-token")
async def get_ws_token(user: dict = Depends(get_current_user)):
    """Gera token de 60s para autenticar conexão WebSocket."""
    token = secrets.token_urlsafe(32)
    _ws_tokens[token] = {
        "user_id": user["id"],
        "tenant_id": user["tenant_id"],
        "expires": datetime.now(timezone.utc) + timedelta(seconds=60),
    }
    return {"ws_token": token, "expires_in": 60}


# ─────────────────────────────────────────────
# WebSocket — Live Execution
# ─────────────────────────────────────────────

def _decode_jwt_token(token: str) -> Optional[dict]:
    """Decode JWT for WebSocket authentication."""
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return {"user_id": payload.get("sub"), "tenant_id": payload.get("tenant_id")}
    except Exception:
        return None


@router.websocket("/ws/run/{agent_id}")
async def run_agent_websocket(
    websocket: WebSocket,
    agent_id: str,
    token: Optional[str] = Query(default=None),
    input_text: str = Query(default=""),
):
    await websocket.accept()

    user_data = None

    # 1. Try short-lived ws_token first (one-use, 60s TTL)
    if token and token in _ws_tokens:
        ws_entry = _ws_tokens.pop(token)
        if datetime.now(timezone.utc) < ws_entry["expires"]:
            user_data = {"user_id": ws_entry["user_id"], "tenant_id": ws_entry["tenant_id"]}

    # 2. Fallback: JWT (for backward compat / testing)
    if not user_data and token:
        user_data = _decode_jwt_token(token)

    if not user_data:
        await websocket.send_json({"type": "error", "error": "Token inválido ou expirado. Faça login novamente."})
        await websocket.close(code=4001)
        return

    tenant_id = user_data["tenant_id"]
    user_id = user_data["user_id"]
    db = get_db()

    # Load agent
    try:
        agent = await db.agents.find_one({"_id": ObjectId(agent_id), "tenant_id": tenant_id})
    except Exception:
        agent = None

    if not agent:
        await websocket.send_json({"type": "error", "error": "Agente não encontrado"})
        await websocket.close(code=4004)
        return

    flow = agent.get("flow_definition") or {"nodes": [], "edges": []}
    nodes = flow.get("nodes", [])
    edges = flow.get("edges", [])

    if not nodes:
        await websocket.send_json({
            "type": "error",
            "error": "Este agente não possui nós no fluxo. Adicione nós no Builder primeiro.",
        })
        await websocket.close(code=4005)
        return

    # Create execution log
    now = datetime.now(timezone.utc).isoformat()
    exec_result = await db.execution_logs.insert_one({
        "agent_id": agent_id,
        "tenant_id": tenant_id,
        "triggered_by": user_id,
        "status": "running",
        "input_data": {"text": input_text},
        "output_data": None,
        "error": None,
        "started_at": now,
        "completed_at": None,
        "duration_ms": None,
        "source": "live_run",
    })
    exec_id = str(exec_result.inserted_id)
    await websocket.send_json({"type": "exec_id", "exec_id": exec_id})

    import time
    t_start = time.time()

    try:
        result = await engine.run_flow(
            nodes=nodes, edges=edges,
            input_text=input_text, websocket=websocket, session_id=exec_id,
        )
        duration_ms = int((time.time() - t_start) * 1000)
        output = result.get("output", "")
        await db.execution_logs.update_one(
            {"_id": ObjectId(exec_id)},
            {"$set": {
                "status": "completed" if "error" not in result else "failed",
                "output_data": {"result": str(output)[:2000]},
                "error": result.get("error"),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "duration_ms": duration_ms,
            }},
        )

    except WebSocketDisconnect:
        await db.execution_logs.update_one(
            {"_id": ObjectId(exec_id)},
            {"$set": {"status": "cancelled", "completed_at": datetime.now(timezone.utc).isoformat()}},
        )
    except Exception as e:
        logger.error(f"[WS] Execution error: {e}")
        try:
            await websocket.send_json({"type": "execution_error", "error": str(e)})
        except Exception:
            pass
        await db.execution_logs.update_one(
            {"_id": ObjectId(exec_id)},
            {"$set": {"status": "failed", "error": str(e), "completed_at": datetime.now(timezone.utc).isoformat()}},
        )
