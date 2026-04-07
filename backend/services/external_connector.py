"""
ExternalConnectorService — Generic layer for external tool/API integrations
======================================================================
Architecture:
- AbstractExternalConnector: Base interface for all external connectors
- RestApiConnector: Generic REST API calls
- WebhookConnector: Webhook sender
- VoiceProviderStub: Placeholder for future voice/call providers

MCP Future Note:
This service is the foundation for MCP-compatible connector protocol.
Each connector type maps to a tool provider in the MCP model.
Add MCP server connections by implementing AbstractExternalConnector.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class AbstractExternalConnector(ABC):
    """
    Base interface for all external connectors.
    Future MCP servers should implement this interface.
    """

    @abstractmethod
    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        ...

    @abstractmethod
    def get_available_actions(self) -> list:
        ...


class RestApiConnector(AbstractExternalConnector):
    """Generic REST API connector for any HTTP endpoint."""

    def __init__(self, config: Dict[str, Any]):
        self.base_url = config.get("base_url", "")
        self.headers = config.get("headers", {})
        self.auth = config.get("auth", {})

    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[RestApiConnector] execute action={action} url={self.base_url}")
        # TODO: Implement with httpx for production use
        return {"success": True, "action": action, "mock": True}

    def get_available_actions(self) -> list:
        return ["GET", "POST", "PUT", "DELETE", "PATCH"]


class WebhookConnector(AbstractExternalConnector):
    """Sends data to a configured webhook endpoint."""

    def __init__(self, config: Dict[str, Any]):
        self.url = config.get("url", "")
        self.secret = config.get("secret", "")

    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[WebhookConnector] trigger url={self.url}")
        # TODO: Implement with httpx for production use
        return {"success": True, "webhook_url": self.url, "mock": True}

    def get_available_actions(self) -> list:
        return ["trigger"]


class VoiceProviderStub(AbstractExternalConnector):
    """
    Stub for future voice/call provider integrations.
    Supports: Twilio, Vapi, Bland.ai, Retell, or custom voice providers.
    Architecture is ready — implement execute() with the provider's SDK.
    """

    def __init__(self, config: Dict[str, Any]):
        self.provider = config.get("provider", "stub")
        self.config = config

    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[VoiceProviderStub] action={action} provider={self.provider}")
        return {
            "success": True,
            "message": f"Voice action '{action}' queued via {self.provider} (stub)",
            "call_id": "stub-call-001",
        }

    def get_available_actions(self) -> list:
        return ["initiate_call", "transfer_call", "end_call", "send_sms"]


class ExternalConnectorService:
    """
    Factory for external connectors.
    Usage:
        service = ExternalConnectorService(connector_config)
        result = await service.get_connector().execute("POST", {...})
    """

    CONNECTOR_MAP = {
        "rest": RestApiConnector,
        "webhook": WebhookConnector,
        "voice": VoiceProviderStub,
    }

    def __init__(self, config: Dict[str, Any]):
        self.connector_type = config.get("type", "rest")
        self.config = config

    def get_connector(self) -> AbstractExternalConnector:
        connector_cls = self.CONNECTOR_MAP.get(self.connector_type, RestApiConnector)
        return connector_cls(self.config)
