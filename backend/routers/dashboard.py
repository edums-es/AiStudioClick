from fastapi import APIRouter, Depends

from core.database import get_db
from core.auth import get_current_user

router = APIRouter()


@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    db = get_db()
    tenant_id = user["tenant_id"]

    agents_count = await db.agents.count_documents({"tenant_id": tenant_id})
    templates_count = await db.agent_templates.count_documents({
        "$or": [{"is_native": True}, {"tenant_id": tenant_id}]
    })
    skills_count = await db.skills.count_documents({
        "$or": [{"is_native": True}, {"tenant_id": tenant_id}]
    })
    integrations_count = await db.integrations.count_documents({"tenant_id": tenant_id})
    active_integrations = await db.integrations.count_documents(
        {"tenant_id": tenant_id, "status": "connected"}
    )
    executions_count = await db.execution_logs.count_documents({"tenant_id": tenant_id})

    recent_executions = await db.execution_logs.find(
        {"tenant_id": tenant_id}
    ).sort("created_at", -1).to_list(5)
    for e in recent_executions:
        e["id"] = str(e.pop("_id"))

    recent_agents = await db.agents.find(
        {"tenant_id": tenant_id}
    ).sort("created_at", -1).to_list(5)
    for a in recent_agents:
        a["id"] = str(a.pop("_id"))

    return {
        "agents_count": agents_count,
        "templates_count": templates_count,
        "skills_count": skills_count,
        "integrations_count": integrations_count,
        "active_integrations": active_integrations,
        "executions_count": executions_count,
        "recent_executions": recent_executions,
        "recent_agents": recent_agents,
    }
