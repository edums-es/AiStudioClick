"""
n8n Router — Blueprint management + idempotent workflow deployment.

Collections:
  blueprints:  Stores the original RF JSON for re-editing.
  deployments: Stores n8n workflow_id, status, and last deployed timestamp.

Idempotency:
  1. If blueprint already has a deployment with n8n_workflow_id → PUT /workflows/{id}
  2. Otherwise → POST /workflows
  3. Credentials (OpenAI/Anthropic) are NEVER sent from frontend — they live in n8n env vars.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from bson import ObjectId
from datetime import datetime, timezone
import logging

from core.database import get_db
from core.auth import get_current_user
from services.n8n_translator import WorkflowTranslator
from services.n8n_client import N8nClient, N8nClientError

router = APIRouter()
logger = logging.getLogger(__name__)
translator = WorkflowTranslator()


class BlueprintSave(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    agent_id: Optional[str] = None


class DeployRequest(BaseModel):
    blueprint_id: str
    activate: bool = False


def fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ─────────────────────────────────────────────
# Blueprint Endpoints
# ─────────────────────────────────────────────

@router.get("/blueprints")
async def list_blueprints(user: dict = Depends(get_current_user)):
    db = get_db()
    blueprints = await db.blueprints.find(
        {"tenant_id": user["tenant_id"]}
    ).sort("updated_at", -1).to_list(100)
    return [fmt(b) for b in blueprints]


@router.post("/blueprints")
async def save_blueprint(data: BlueprintSave, user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()

    # Validate graph structure
    validation = translator.validate_graph(data.nodes, data.edges)

    doc = {
        "name": data.name,
        "description": data.description,
        "nodes": data.nodes,
        "edges": data.edges,
        "agent_id": data.agent_id,
        "tenant_id": user["tenant_id"],
        "created_by": user.get("id"),
        "validation": validation,
        "node_count": len(data.nodes),
        "edge_count": len(data.edges),
        "created_at": now,
        "updated_at": now,
    }
    result = await db.blueprints.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("/blueprints/{blueprint_id}")
async def get_blueprint(blueprint_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    bp = await db.blueprints.find_one(
        {"_id": ObjectId(blueprint_id), "tenant_id": user["tenant_id"]}
    )
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint não encontrado")
    return fmt(bp)


@router.get("/blueprints/{blueprint_id}/preview")
async def preview_n8n_translation(blueprint_id: str, user: dict = Depends(get_current_user)):
    """Preview the n8n JSON that would be sent — useful for debugging."""
    db = get_db()
    bp = await db.blueprints.find_one(
        {"_id": ObjectId(blueprint_id), "tenant_id": user["tenant_id"]}
    )
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint não encontrado")

    n8n_workflow = translator.translate_to_n8n(bp["nodes"], bp["edges"], bp["name"])
    return {
        "blueprint_id": blueprint_id,
        "n8n_workflow": n8n_workflow,
        "validation": translator.validate_graph(bp["nodes"], bp["edges"]),
    }


# ─────────────────────────────────────────────
# Deploy Endpoints (Idempotent)
# ─────────────────────────────────────────────

@router.post("/deploy")
async def deploy_workflow(data: DeployRequest, user: dict = Depends(get_current_user)):
    """
    Deploy a blueprint to n8n.
    Idempotent: checks existing deployment and uses PUT if workflow_id exists.
    Credentials (OpenAI/Anthropic) are injected via n8n environment, NEVER via frontend.
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()

    # Load blueprint
    bp = await db.blueprints.find_one(
        {"_id": ObjectId(data.blueprint_id), "tenant_id": user["tenant_id"]}
    )
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint não encontrado")

    # Validate
    validation = translator.validate_graph(bp["nodes"], bp["edges"])
    if not validation["valid"]:
        raise HTTPException(status_code=422, detail={"errors": validation["errors"]})

    # Translate RF → n8n
    n8n_workflow = translator.translate_to_n8n(bp["nodes"], bp["edges"], bp["name"])

    # Check for existing deployment (idempotency)
    existing_deployment = await db.deployments.find_one(
        {"blueprint_id": data.blueprint_id, "tenant_id": user["tenant_id"]}
    )

    # Load tenant n8n config (overrides env vars)
    tenant = await db.tenants.find_one({"_id": ObjectId(user["tenant_id"])})
    tenant_n8n = (tenant or {}).get("n8n_config", {})
    client = N8nClient(
        base_url=tenant_n8n.get("api_url", ""),
        api_key=tenant_n8n.get("api_key", ""),
    )

    if not client.is_configured:
        # Save blueprint but mark as pending (n8n not configured)
        result = {
            "success": False,
            "status": "not_configured",
            "message": "n8n não está configurado. Acesse Configurações → Integração n8n para configurar.",
            "n8n_workflow_preview": n8n_workflow,
            "blueprint_id": data.blueprint_id,
        }
        await db.deployments.update_one(
            {"blueprint_id": data.blueprint_id, "tenant_id": user["tenant_id"]},
            {"$set": {
                "blueprint_id": data.blueprint_id,
                "tenant_id": user["tenant_id"],
                "status": "pending",
                "n8n_workflow": n8n_workflow,
                "deployed_at": now,
                "deployed_by": user.get("id"),
            }},
            upsert=True,
        )
        return result

    try:
        if existing_deployment and existing_deployment.get("n8n_workflow_id"):
            # UPDATE existing workflow (idempotent)
            n8n_result = await client.update_workflow(
                existing_deployment["n8n_workflow_id"], n8n_workflow
            )
        else:
            # CREATE new workflow
            n8n_result = await client.create_workflow(n8n_workflow)

        n8n_workflow_id = n8n_result.get("workflow_id")

        # Activate if requested
        if data.activate and n8n_workflow_id:
            await client.activate_workflow(n8n_workflow_id)

        # Save / update deployment record
        await db.deployments.update_one(
            {"blueprint_id": data.blueprint_id, "tenant_id": user["tenant_id"]},
            {"$set": {
                "blueprint_id": data.blueprint_id,
                "tenant_id": user["tenant_id"],
                "n8n_workflow_id": n8n_workflow_id,
                "status": "active" if data.activate else "deployed",
                "n8n_url": f"{client.base_url}/workflow/{n8n_workflow_id}",
                "node_count": len(bp["nodes"]),
                "deployed_at": now,
                "deployed_by": user.get("id"),
            }},
            upsert=True,
        )

        return {
            "success": True,
            "status": "active" if data.activate else "deployed",
            "n8n_workflow_id": n8n_workflow_id,
            "n8n_url": f"{client.base_url}/workflow/{n8n_workflow_id}",
            "message": f"Workflow {'ativado' if data.activate else 'deployado'} com sucesso no n8n.",
        }

    except N8nClientError as e:
        # Save error in deployments
        await db.deployments.update_one(
            {"blueprint_id": data.blueprint_id, "tenant_id": user["tenant_id"]},
            {"$set": {"status": "error", "error": str(e), "deployed_at": now}},
            upsert=True,
        )
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/deployments/{blueprint_id}")
async def get_deployment(blueprint_id: str, user: dict = Depends(get_current_user)):
    """Get deployment status for a blueprint."""
    db = get_db()
    dep = await db.deployments.find_one(
        {"blueprint_id": blueprint_id, "tenant_id": user["tenant_id"]}
    )
    if not dep:
        return {"status": "not_deployed", "blueprint_id": blueprint_id}
    return fmt(dep)


@router.post("/deployments/{blueprint_id}/activate")
async def activate_deployment(blueprint_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    dep = await db.deployments.find_one(
        {"blueprint_id": blueprint_id, "tenant_id": user["tenant_id"]}
    )
    if not dep or not dep.get("n8n_workflow_id"):
        raise HTTPException(status_code=404, detail="Deploy não encontrado. Faça o deploy primeiro.")

    client = N8nClient()
    try:
        result = await client.activate_workflow(dep["n8n_workflow_id"])
        await db.deployments.update_one(
            {"blueprint_id": blueprint_id},
            {"$set": {"status": "active"}}
        )
        return result
    except N8nClientError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/deployments/{blueprint_id}/deactivate")
async def deactivate_deployment(blueprint_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    dep = await db.deployments.find_one(
        {"blueprint_id": blueprint_id, "tenant_id": user["tenant_id"]}
    )
    if not dep or not dep.get("n8n_workflow_id"):
        raise HTTPException(status_code=404, detail="Deploy não encontrado.")

    client = N8nClient()
    try:
        result = await client.deactivate_workflow(dep["n8n_workflow_id"])
        await db.deployments.update_one(
            {"blueprint_id": blueprint_id},
            {"$set": {"status": "deployed"}}
        )
        return result
    except N8nClientError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/status")
async def n8n_status(user: dict = Depends(get_current_user)):
    """Check if n8n is configured and reachable."""
    client = N8nClient()
    if not client.is_configured:
        return {
            "configured": False,
            "message": "Configure N8N_API_URL e N8N_API_KEY no .env para habilitar integração n8n.",
        }
    try:
        async with __import__("httpx").AsyncClient(timeout=5.0) as c:
            resp = await c.get(
                f"{client.base_url}/api/v1/workflows",
                headers={"X-N8N-API-KEY": client.api_key, "Accept": "application/json"},
            )
            return {"configured": True, "reachable": resp.status_code < 500, "status_code": resp.status_code}
    except Exception as e:
        return {"configured": True, "reachable": False, "error": str(e)}
