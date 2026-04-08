"""
Webhook Router — recebe mensagens do Clickmassa e responde via LLM.

O Clickmassa envia mensagens via POST para:
  POST /api/webhook/clickmassa/{tenant_id}

Payload esperado:
  numero_cliente, sessionId, mensagem_cliente, url_envio
"""
import logging
from typing import Optional

import httpx
from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from core.database import get_db
from services.llm_service import run_llm

router = APIRouter()
logger = logging.getLogger(__name__)


class ClickmassaWebhookPayload(BaseModel):
    numero_cliente: str
    sessionId: str
    mensagem_cliente: str
    url_envio: str


async def _process_and_reply(
    tenant_id: str,
    payload: ClickmassaWebhookPayload,
):
    """Background task: processa a mensagem com LLM e envia resposta ao Clickmassa."""
    db = get_db()

    # Busca integração Clickmassa ativa do tenant
    integration = await db.integrations.find_one({
        "tenant_id": tenant_id,
        "provider": "clickmassa",
        "status": "connected",
    })
    credentials = (integration or {}).get("credentials", {})
    api_token = credentials.get("api_token", "")

    # Processa com LLM
    response_text = await run_llm(
        prompt=payload.mensagem_cliente,
        system=(
            "Você é um assistente de atendimento inteligente. "
            "Responda de forma clara, breve e em português do Brasil."
        ),
        model="gpt-4o",
        session_id=f"webhook_{tenant_id}_{payload.sessionId}",
    )

    # Envia resposta de volta via URL fornecida pelo Clickmassa
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                payload.url_envio,
                headers={
                    "Authorization": f"Bearer {api_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "body": response_text,
                    "number": payload.numero_cliente,
                    "externalKey": payload.sessionId,
                },
            )
            logger.info(f"[Webhook] Resposta enviada ao Clickmassa: {resp.status_code}")
    except Exception as e:
        logger.error(f"[Webhook] Falha ao enviar resposta: {e}")

    # Salva log da execução
    try:
        await db.execution_logs.insert_one({
            "agent_id": None,
            "tenant_id": tenant_id,
            "status": "completed",
            "source": "webhook",
            "input_data": {
                "number": payload.numero_cliente,
                "session_id": payload.sessionId,
                "message": payload.mensagem_cliente,
            },
            "output_data": {"response": response_text},
        })
    except Exception:
        pass


@router.post("/clickmassa/{tenant_id}")
async def receive_clickmassa_message(
    tenant_id: str,
    payload: ClickmassaWebhookPayload,
    background_tasks: BackgroundTasks,
):
    """
    Recebe mensagem do Clickmassa, processa com LLM em background e responde.
    Retorna 200 imediatamente (o Clickmassa exige resposta rápida).
    """
    # Validar que o tenant existe
    db = get_db()
    try:
        oid = ObjectId(tenant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="tenant_id inválido")
    tenant = await db.tenants.find_one({"_id": oid})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")

    background_tasks.add_task(_process_and_reply, tenant_id, payload)
    return {"received": True, "session_id": payload.sessionId}
