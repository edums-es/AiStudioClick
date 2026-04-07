"""
n8n API Client — async HTTP client for n8n workflow management.

Supports:
  - POST /workflows      — create new workflow
  - PUT  /workflows/{id} — update existing (idempotent deploy)
  - GET  /workflows/{id} — get workflow status
  - POST /workflows/{id}/activate   — activate workflow
  - POST /workflows/{id}/deactivate — deactivate workflow

Auth: X-N8N-API-KEY header (configured via N8N_API_KEY env var)
Base URL: N8N_API_URL env var (e.g., http://localhost:5678)

When n8n is not configured, all methods return a "not_configured" response
so the rest of the system continues to work (blueprints still saved).
"""

import os
import logging
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

N8N_TIMEOUT = 10.0


class N8nClientError(Exception):
    def __init__(self, message: str, status_code: int = 0):
        super().__init__(message)
        self.status_code = status_code


class N8nClient:
    """Async client for n8n REST API."""

    def __init__(self):
        self.base_url = os.environ.get("N8N_API_URL", "").rstrip("/")
        self.api_key = os.environ.get("N8N_API_KEY", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "X-N8N-API-KEY": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _not_configured_response(self) -> Dict:
        return {
            "success": False,
            "status": "not_configured",
            "message": "n8n não está configurado. Defina N8N_API_URL e N8N_API_KEY no .env para habilitar o deploy.",
        }

    async def create_workflow(self, workflow: Dict[str, Any]) -> Dict:
        """POST /workflows — Create a new workflow."""
        if not self.is_configured:
            return self._not_configured_response()
        try:
            async with httpx.AsyncClient(timeout=N8N_TIMEOUT) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/workflows",
                    headers=self._headers(),
                    json=workflow,
                )
                resp.raise_for_status()
                data = resp.json()
                logger.info(f"[n8n] Workflow created: id={data.get('id')}")
                return {"success": True, "workflow_id": data.get("id"), "data": data}
        except httpx.HTTPStatusError as e:
            logger.error(f"[n8n] Create failed: {e.response.status_code} {e.response.text}")
            raise N8nClientError(f"n8n retornou {e.response.status_code}: {e.response.text}", e.response.status_code)
        except httpx.RequestError as e:
            logger.error(f"[n8n] Connection error: {e}")
            raise N8nClientError(f"Não foi possível conectar ao n8n em {self.base_url}. Verifique se o serviço está rodando.")

    async def update_workflow(self, workflow_id: str, workflow: Dict[str, Any]) -> Dict:
        """PUT /workflows/{id} — Update existing workflow (idempotent deploy)."""
        if not self.is_configured:
            return self._not_configured_response()
        try:
            async with httpx.AsyncClient(timeout=N8N_TIMEOUT) as client:
                resp = await client.put(
                    f"{self.base_url}/api/v1/workflows/{workflow_id}",
                    headers=self._headers(),
                    json=workflow,
                )
                resp.raise_for_status()
                data = resp.json()
                logger.info(f"[n8n] Workflow updated: id={workflow_id}")
                return {"success": True, "workflow_id": workflow_id, "data": data}
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # Workflow was deleted from n8n — create fresh
                logger.warning(f"[n8n] Workflow {workflow_id} not found, creating new")
                return await self.create_workflow(workflow)
            raise N8nClientError(f"n8n retornou {e.response.status_code}: {e.response.text}", e.response.status_code)
        except httpx.RequestError as e:
            raise N8nClientError(f"Não foi possível conectar ao n8n em {self.base_url}.")

    async def get_workflow(self, workflow_id: str) -> Dict:
        """GET /workflows/{id} — Get workflow details and status."""
        if not self.is_configured:
            return self._not_configured_response()
        try:
            async with httpx.AsyncClient(timeout=N8N_TIMEOUT) as client:
                resp = await client.get(
                    f"{self.base_url}/api/v1/workflows/{workflow_id}",
                    headers=self._headers(),
                )
                resp.raise_for_status()
                data = resp.json()
                return {"success": True, "workflow_id": workflow_id, "active": data.get("active", False), "data": data}
        except httpx.HTTPStatusError as e:
            raise N8nClientError(f"n8n retornou {e.response.status_code}", e.response.status_code)
        except httpx.RequestError as e:
            raise N8nClientError(f"Não foi possível conectar ao n8n em {self.base_url}.")

    async def activate_workflow(self, workflow_id: str) -> Dict:
        """PATCH /workflows/{id} — Activate workflow."""
        if not self.is_configured:
            return self._not_configured_response()
        try:
            async with httpx.AsyncClient(timeout=N8N_TIMEOUT) as client:
                resp = await client.patch(
                    f"{self.base_url}/api/v1/workflows/{workflow_id}",
                    headers=self._headers(),
                    json={"active": True},
                )
                resp.raise_for_status()
                logger.info(f"[n8n] Workflow activated: id={workflow_id}")
                return {"success": True, "workflow_id": workflow_id, "active": True}
        except httpx.RequestError as e:
            raise N8nClientError(f"Não foi possível conectar ao n8n.")

    async def deactivate_workflow(self, workflow_id: str) -> Dict:
        """PATCH /workflows/{id} — Deactivate workflow."""
        if not self.is_configured:
            return self._not_configured_response()
        try:
            async with httpx.AsyncClient(timeout=N8N_TIMEOUT) as client:
                resp = await client.patch(
                    f"{self.base_url}/api/v1/workflows/{workflow_id}",
                    headers=self._headers(),
                    json={"active": False},
                )
                resp.raise_for_status()
                return {"success": True, "workflow_id": workflow_id, "active": False}
        except httpx.RequestError as e:
            raise N8nClientError(f"Não foi possível conectar ao n8n.")
