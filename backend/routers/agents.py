from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId

from core.database import get_db
from core.auth import get_current_user

router = APIRouter()


def _oid(id_str: str, name: str = "recurso") -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail=f"ID de {name} inválido")


class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    flow_definition: Optional[Dict[str, Any]] = {"nodes": [], "edges": []}


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    flow_definition: Optional[Dict[str, Any]] = None


def fmt(agent: dict) -> dict:
    agent["id"] = str(agent.pop("_id"))
    return agent


@router.get("")
async def list_agents(user: dict = Depends(get_current_user)):
    db = get_db()
    agents = await db.agents.find(
        {"tenant_id": user["tenant_id"]}
    ).sort("created_at", -1).to_list(100)
    return [fmt(a) for a in agents]


@router.post("")
async def create_agent(data: AgentCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "name": data.name, "description": data.description,
        "status": "draft", "flow_definition": data.flow_definition,
        "tenant_id": user["tenant_id"], "created_by": user.get("id"),
        "version": 1, "created_at": now, "updated_at": now,
    }
    result = await db.agents.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("/{agent_id}")
async def get_agent(agent_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    agent = await db.agents.find_one(
        {"_id": _oid(agent_id, "agente"), "tenant_id": user["tenant_id"]}
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    return fmt(agent)


@router.put("/{agent_id}")
async def update_agent(agent_id: str, data: AgentUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    oid = _oid(agent_id, "agente")
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.agents.update_one(
        {"_id": oid, "tenant_id": user["tenant_id"]}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    agent = await db.agents.find_one({"_id": oid})
    return fmt(agent)


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.agents.delete_one(
        {"_id": _oid(agent_id, "agente"), "tenant_id": user["tenant_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    return {"message": "Agente excluído"}


@router.post("/{agent_id}/publish")
async def publish_agent(agent_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.agents.update_one(
        {"_id": _oid(agent_id, "agente"), "tenant_id": user["tenant_id"]},
        {"$set": {"status": "active", "published_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    return {"message": "Agente publicado"}
