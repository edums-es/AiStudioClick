from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

from core.database import get_db
from core.auth import get_current_user
from services.clickmassa import ClickMassaConnector

router = APIRouter()


def _oid(id_str: str, name: str = "recurso") -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail=f"ID de {name} inválido")


class IntegrationCreate(BaseModel):
    provider: str
    name: str
    credentials: Optional[Dict[str, Any]] = {}
    config: Optional[Dict[str, Any]] = {}


def fmt(i: dict) -> dict:
    i["id"] = str(i.pop("_id"))
    i.pop("credentials", None)
    return i


@router.get("")
async def list_integrations(user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.integrations.find({"tenant_id": user["tenant_id"]}).to_list(100)
    return [fmt(i) for i in items]


@router.post("")
async def create_integration(data: IntegrationCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        "provider": data.provider, "name": data.name,
        "credentials": data.credentials, "config": data.config,
        "status": "disconnected", "tenant_id": user["tenant_id"],
        "created_at": datetime.now(timezone.utc).isoformat(), "last_tested": None,
    }
    result = await db.integrations.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc.pop("credentials", None)
    return doc


@router.post("/{integration_id}/test")
async def test_integration(integration_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    integration = await db.integrations.find_one(
        {"_id": _oid(integration_id, "integração"), "tenant_id": user["tenant_id"]}
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integração não encontrada")

    if integration["provider"] == "clickmassa":
        connector = ClickMassaConnector(integration.get("credentials", {}))
        result = await connector.test_connection()
        # Adiciona flag is_mock para uso no frontend (badge "Demo")
        result["is_mock"] = connector.is_mock
    else:
        result = {"success": True, "message": "Conexão simulada com sucesso (mock)", "is_mock": True}

    status = "connected" if result.get("success") else "error"
    await db.integrations.update_one(
        {"_id": ObjectId(integration_id)},
        {"$set": {"status": status, "last_tested": datetime.now(timezone.utc).isoformat()}}
    )
    return {**result, "status": status}


@router.put("/{integration_id}")
async def update_integration(
    integration_id: str, data: IntegrationCreate, user: dict = Depends(get_current_user)
):
    db = get_db()
    result = await db.integrations.update_one(
        {"_id": _oid(integration_id, "integração"), "tenant_id": user["tenant_id"]},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Integração não encontrada")
    integration = await db.integrations.find_one({"_id": _oid(integration_id)})
    return fmt(integration)


@router.delete("/{integration_id}")
async def delete_integration(integration_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.integrations.delete_one(
        {"_id": _oid(integration_id, "integração"), "tenant_id": user["tenant_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Integração não encontrada")
    return {"message": "Integração excluída"}
