from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from bson import ObjectId
from datetime import datetime, timezone

from core.database import get_db
from core.auth import get_current_user

router = APIRouter()


class MindMapCreate(BaseModel):
    name: str
    nodes: Optional[List[Dict[str, Any]]] = []
    edges: Optional[List[Dict[str, Any]]] = []


class MindMapUpdate(BaseModel):
    name: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None


def fmt(m: dict) -> dict:
    m["id"] = str(m.pop("_id"))
    return m


@router.get("")
async def list_mindmaps(user: dict = Depends(get_current_user)):
    db = get_db()
    maps = await db.mindmaps.find({"tenant_id": user["tenant_id"]}).sort("created_at", -1).to_list(50)
    return [fmt(m) for m in maps]


@router.post("")
async def create_mindmap(data: MindMapCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "name": data.name, "nodes": data.nodes, "edges": data.edges,
        "tenant_id": user["tenant_id"], "created_by": user.get("id"),
        "created_at": now, "updated_at": now,
    }
    result = await db.mindmaps.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("/{map_id}")
async def get_mindmap(map_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    m = await db.mindmaps.find_one({"_id": ObjectId(map_id), "tenant_id": user["tenant_id"]})
    if not m:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")
    return fmt(m)


@router.put("/{map_id}")
async def update_mindmap(map_id: str, data: MindMapUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.mindmaps.update_one(
        {"_id": ObjectId(map_id), "tenant_id": user["tenant_id"]},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")
    m = await db.mindmaps.find_one({"_id": ObjectId(map_id)})
    return fmt(m)


@router.delete("/{map_id}")
async def delete_mindmap(map_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.mindmaps.delete_one(
        {"_id": ObjectId(map_id), "tenant_id": user["tenant_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")
    return {"message": "Mapa excluído"}
