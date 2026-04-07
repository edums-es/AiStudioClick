from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone

from core.database import get_db
from core.auth import get_current_user

router = APIRouter()


def fmt(t: dict) -> dict:
    t["id"] = str(t.pop("_id"))
    return t


@router.get("")
async def list_templates(user: dict = Depends(get_current_user)):
    db = get_db()
    templates = await db.agent_templates.find({
        "$or": [{"is_native": True}, {"tenant_id": user["tenant_id"]}]
    }).to_list(200)
    return [fmt(t) for t in templates]


@router.get("/{template_id}")
async def get_template(template_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    t = await db.agent_templates.find_one({"_id": ObjectId(template_id)})
    if not t:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    return fmt(t)


@router.post("/{template_id}/clone")
async def clone_template(template_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    t = await db.agent_templates.find_one({"_id": ObjectId(template_id)})
    if not t:
        raise HTTPException(status_code=404, detail="Template não encontrado")

    now = datetime.now(timezone.utc).isoformat()
    agent_doc = {
        "name": f"{t['name']} (cópia)",
        "description": t.get("description", ""),
        "status": "draft",
        "flow_definition": t.get("flow_definition", {"nodes": [], "edges": []}),
        "tenant_id": user["tenant_id"],
        "created_by": user.get("id"),
        "template_id": template_id,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.agents.insert_one(agent_doc)
    agent_doc["id"] = str(result.inserted_id)
    agent_doc.pop("_id", None)
    return agent_doc
