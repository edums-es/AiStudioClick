"""
ClickMassaConnector — Service Layer for Click Massa API Integration
================================================================
Architecture:
- AbstractConnectorProtocol: Base interface (MCP-ready foundation)
- MockClickMassaProvider: Realistic mock for demo/development
- ClickMassaConnector: Tenant-scoped connector, provider-swappable

Future Evolution:
- Replace MockClickMassaProvider with RealClickMassaProvider when API docs are available
- Set credentials = {"api_key": "real_key", "workspace_id": "ws_xxx"} to switch providers
- The connector architecture is compatible with future MCP server integrations
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AbstractConnectorProtocol(ABC):
    """Base protocol for all external service connectors — MCP-compatible interface."""

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


class MockClickMassaProvider(AbstractConnectorProtocol):
    """
    Realistic mock implementation of Click Massa API.
    Provides sensible responses for all operations in demo mode.
    Replace with RealClickMassaProvider when credentials are available.
    """

    _contacts = [
        {"id": "cm001", "name": "João Silva", "phone": "+5511999990001",
         "email": "joao@empresa.com", "tags": ["lead", "quente"], "stage": "qualificado"},
        {"id": "cm002", "name": "Maria Santos", "phone": "+5511999990002",
         "email": "maria@empresa.com", "tags": ["lead"], "stage": "prospecto"},
        {"id": "cm003", "name": "Carlos Oliveira", "phone": "+5511999990003",
         "email": "carlos@empresa.com", "tags": ["cliente"], "stage": "fechado"},
    ]

    async def test_connection(self) -> Dict[str, Any]:
        logger.info("[ClickMassa Mock] Testing connection")
        return {
            "success": True,
            "message": "Conexão com Click Massa estabelecida (modo demo)",
            "provider": "Click Massa Mock v1.0",
            "latency_ms": 120,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def get_contact(self, phone: str) -> Optional[Dict[str, Any]]:
        for c in self._contacts:
            if c["phone"] == phone:
                return c
        return None

    async def create_contact(self, data: Dict[str, Any]) -> Dict[str, Any]:
        contact = {
            "id": f"cm{len(self._contacts) + 1:03d}",
            **data,
            "created_at": datetime.utcnow().isoformat(),
        }
        self._contacts.append(contact)
        logger.info(f"[ClickMassa Mock] Contact created: {contact['id']}")
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

    async def send_to_call(self, contact_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Stub for future voice provider integration via external connector."""
        return {
            "success": True,
            "message": "Contato enfileirado para call (mock)",
            "contact_id": contact_id,
        }


class ClickMassaConnector:
    """
    Main ClickMassa connector — tenant-scoped, provider-swappable.

    Usage:
        connector = ClickMassaConnector(credentials)
        result = await connector.test_connection()

    To switch to real API:
        Pass credentials = {"api_key": "...", "workspace_id": "..."}
        Implement RealClickMassaProvider and update _resolve_provider()
    """

    def __init__(self, credentials: Dict[str, Any] = None):
        self.credentials = credentials or {}
        self._provider = self._resolve_provider()

    def _resolve_provider(self) -> AbstractConnectorProtocol:
        # Future: if self.credentials.get("api_key"): return RealClickMassaProvider(self.credentials)
        return MockClickMassaProvider()

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
