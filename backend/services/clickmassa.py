"""
ClickMassaConnector — Conector para a API do Clickmassa.
Arquitetura com providers intercambiáveis:
  - MockClickMassaProvider  : modo demo/dev (sem credenciais)
  - RealClickMassaProvider  : API real (com server_url + api_token)
  
_resolve_provider() escolhe automaticamente baseado nas credenciais.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import httpx

logger = logging.getLogger(__name__)


class AbstractConnectorProtocol(ABC):
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]: ...
    @abstractmethod
    async def get_contact(self, phone: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    async def create_contact(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    async def update_contact(self, contact_id: str, data: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    async def apply_tag(self, contact_id: str, tag: str) -> Dict[str, Any]: ...


# ─── MOCK ────────────────────────────────────────────────────────────────────

class MockClickMassaProvider(AbstractConnectorProtocol):
    """Mock realista para demo/desenvolvimento. Sem chamadas de rede."""

    _contacts = [
        {"id": "cm001", "name": "João Silva", "phone": "+5511999990001",
         "email": "joao@empresa.com", "tags": ["lead", "quente"], "stage": "qualificado"},
        {"id": "cm002", "name": "Maria Santos", "phone": "+5511999990002",
         "email": "maria@empresa.com", "tags": ["lead"], "stage": "prospecto"},
        {"id": "cm003", "name": "Carlos Oliveira", "phone": "+5511999990003",
         "email": "carlos@empresa.com", "tags": ["cliente"], "stage": "fechado"},
    ]

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "Conexão com Click Massa estabelecida (modo demo)",
            "provider": "Click Massa Mock v1.0",
            "is_mock": True,
            "latency_ms": 120,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def get_contact(self, phone: str) -> Optional[Dict[str, Any]]:
        return next((c for c in self._contacts if c["phone"] == phone), None)

    async def create_contact(self, data: Dict[str, Any]) -> Dict[str, Any]:
        contact = {"id": f"cm{len(self._contacts) + 1:03d}", **data,
                   "created_at": datetime.utcnow().isoformat()}
        self._contacts.append(contact)
        return contact

    async def update_contact(self, contact_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        for i, c in enumerate(self._contacts):
            if c["id"] == contact_id:
                self._contacts[i] = {**c, **data, "updated_at": datetime.utcnow().isoformat()}
                return self._contacts[i]
        return {"error": "Contact not found", "id": contact_id}

    async def apply_tag(self, contact_id: str, tag: str) -> Dict[str, Any]:
        for c in self._contacts:
            if c["id"] == contact_id:
                tags = c.get("tags", [])
                if tag not in tags:
                    tags.append(tag)
                    c["tags"] = tags
                return {"success": True, "contact_id": contact_id, "tag": tag}
        return {"success": False, "error": "Contact not found"}

    async def send_message(self, number: str, body: str, **kwargs) -> Dict[str, Any]:
        return {"success": True, "message": "Mensagem simulada (mock)", "number": number}

    async def send_to_call(self, contact_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        return {"success": True, "message": "Contato enfileirado para call (mock)", "contact_id": contact_id}


# ─── REAL ────────────────────────────────────────────────────────────────────

class RealClickMassaProvider(AbstractConnectorProtocol):
    """
    Implementação real do conector Clickmassa.
    Docs: https://docs-68.gitbook.io/documentacao/api-de-contatos
    
    Credenciais necessárias:
      server_url  : https://enterprise-{server}api.{dominio}
      api_token   : Bearer token gerado no PUSH
      channel_id  : ID da integração API/Webhook (para send_message)
    """

    def __init__(self, credentials: Dict[str, Any]):
        self.server_url = credentials.get("server_url", "").rstrip("/")
        self.api_token = credentials.get("api_token", "")
        self.channel_id = credentials.get("channel_id", "")
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    async def test_connection(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.server_url}/v1/contacts/", headers=self.headers)
                if resp.status_code in (200, 201):
                    return {
                        "success": True,
                        "message": "Conexão com Clickmassa estabelecida com sucesso!",
                        "provider": "Clickmassa Real API",
                        "is_mock": False,
                        "latency_ms": int(resp.elapsed.total_seconds() * 1000),
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                return {
                    "success": False,
                    "message": f"Erro HTTP {resp.status_code}: verifique o token e URL.",
                }
        except httpx.ConnectError:
            return {"success": False, "message": "Não foi possível conectar. Verifique a URL do servidor."}
        except Exception as e:
            return {"success": False, "message": f"Erro de conexão: {str(e)}"}

    async def get_contact(self, phone: str) -> Optional[Dict[str, Any]]:
        clean = phone.replace("+", "").replace(" ", "").replace("-", "")
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{self.server_url}/v1/contacts/number/{clean}", headers=self.headers)
            return resp.json() if resp.status_code == 200 else None

    async def create_contact(self, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = {
            "name": data.get("name", ""),
            "number": data.get("phone", "").replace("+", ""),
            "email": data.get("email", ""),
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{self.server_url}/v1/contacts/", headers=self.headers, json=payload)
            return resp.json()

    async def update_contact(self, contact_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.patch(f"{self.server_url}/v1/contacts/{contact_id}", headers=self.headers, json=data)
            return resp.json()

    async def apply_tag(self, contact_id: str, tag: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            get_resp = await client.get(f"{self.server_url}/v1/contacts/{contact_id}", headers=self.headers)
            existing_tags = get_resp.json().get("tags", []) if get_resp.status_code == 200 else []
            if tag not in existing_tags:
                existing_tags.append(tag)
            resp = await client.patch(
                f"{self.server_url}/v1/contacts/{contact_id}",
                headers=self.headers,
                json={"tags": existing_tags},
            )
            return {"success": resp.status_code in (200, 201), "contact_id": contact_id, "tag": tag}

    async def send_message(self, number: str, body: str, external_key: str = None) -> Dict[str, Any]:
        payload = {"body": body, "number": number.replace("+", "")}
        if external_key:
            payload["externalKey"] = external_key
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{self.server_url}/v1/api/external/{self.channel_id}",
                headers=self.headers,
                json=payload,
            )
            return {"success": resp.status_code in (200, 201), "response": resp.json() if resp.content else {}}


# ─── CONNECTOR ───────────────────────────────────────────────────────────────

class ClickMassaConnector:
    """Conector principal — tenant-scoped, provider automático baseado nas credenciais."""

    def __init__(self, credentials: Dict[str, Any] = None):
        self.credentials = credentials or {}
        self._provider = self._resolve_provider()

    def _resolve_provider(self) -> AbstractConnectorProtocol:
        if self.credentials.get("api_token") and self.credentials.get("server_url"):
            logger.info("[ClickMassa] Usando RealClickMassaProvider")
            return RealClickMassaProvider(self.credentials)
        logger.info("[ClickMassa] Usando MockClickMassaProvider (modo demo)")
        return MockClickMassaProvider()

    @property
    def is_mock(self) -> bool:
        return isinstance(self._provider, MockClickMassaProvider)

    async def test_connection(self) -> Dict[str, Any]:
        return await self._provider.test_connection()

    async def get_contact(self, phone: str) -> Optional[Dict[str, Any]]:
        return await self._provider.get_contact(phone)

    async def create_contact(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._provider.create_contact(data)

    async def update_contact(self, contact_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._provider.update_contact(contact_id, data)

    async def apply_tag(self, contact_id: str, tag: str) -> Dict[str, Any]:
        return await self._provider.apply_tag(contact_id, tag)
