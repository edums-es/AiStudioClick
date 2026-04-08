from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
import time

from core.database import get_db
from core.auth import get_current_user

router = APIRouter()


def _oid(id_str: str, name: str = "recurso") -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail=f"ID de {name} inválido")


class RunAgentInput(BaseModel):
    input_data: Optional[dict] = {}


def fmt(e: dict) -> dict:
    e["id"] = str(e.pop("_id"))
    return e


@router.get("")
async def list_executions(user: dict = Depends(get_current_user)):
    db = get_db()
    executions = await db.execution_logs.find(
        {"tenant_id": user["tenant_id"]}
    ).sort("created_at", -1).to_list(50)
    return [fmt(e) for e in executions]


@router.get("/{execution_id}")
async def get_execution(execution_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    e = await db.execution_logs.find_one(
        {"_id": _oid(execution_id, "execução"), "tenant_id": user["tenant_id"]}
    )
    if not e:
        raise HTTPException(status_code=404, detail="Execução não encontrada")
    return fmt(e)


@router.post("/agent/{agent_id}/run")
async def run_agent(agent_id: str, data: RunAgentInput, user: dict = Depends(get_current_user)):
    db = get_db()
    agent = await db.agents.find_one(
        {"_id": _oid(agent_id, "agente"), "tenant_id": user["tenant_id"]}
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agente não encontrado")

    start = time.time()
    doc = {
        "agent_id": agent_id,
        "agent_name": agent.get("name", ""),
        "tenant_id": user["tenant_id"],
        "triggered_by": user.get("id"),
        "status": "success",
        "input": data.input_data,
        "output": {"message": f"Agente '{agent.get('name')}' executado com sucesso (demo)"},
        "duration_ms": int((time.time() - start) * 1000) + 350,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.execution_logs.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc
