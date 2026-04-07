from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

from core.database import get_db
from core.auth import get_current_user

router = APIRouter()


class SkillCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    category: Optional[str] = "custom"
    prompt_base: Optional[str] = ""
    inputs: Optional[List[dict]] = []
    output_schema: Optional[dict] = {}
    guardrails: Optional[List[str]] = []


def fmt(s: dict) -> dict:
    s["id"] = str(s.pop("_id"))
    return s


@router.get("")
async def list_skills(user: dict = Depends(get_current_user)):
    db = get_db()
    skills = await db.skills.find({
        "$or": [{"is_native": True}, {"tenant_id": user["tenant_id"]}]
    }).to_list(200)
    return [fmt(s) for s in skills]


@router.post("")
async def create_skill(data: SkillCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        **data.model_dump(),
        "tenant_id": user["tenant_id"],
        "is_native": False,
        "created_by": user.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.skills.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/{skill_id}")
async def update_skill(skill_id: str, data: SkillCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.skills.update_one(
        {"_id": ObjectId(skill_id), "tenant_id": user["tenant_id"], "is_native": False},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Skill não encontrada ou é nativa")
    skill = await db.skills.find_one({"_id": ObjectId(skill_id)})
    return fmt(skill)


@router.delete("/{skill_id}")
async def delete_skill(skill_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.skills.delete_one(
        {"_id": ObjectId(skill_id), "tenant_id": user["tenant_id"], "is_native": False}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Skill não encontrada ou é nativa")
    return {"message": "Skill excluída"}
