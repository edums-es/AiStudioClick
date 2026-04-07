"""
LLM Provider Layer — Abstract interface for pluggable AI model providers
======================================================================
Architecture:
- AbstractLLMProvider: Defines the contract for all LLM providers
- MockLLMProvider: Demo/testing provider with realistic responses
- get_llm_provider(): Factory — returns real provider if credentials present, else mock

Future integrations (implement the provider class and update get_llm_provider):
- OpenAIProvider (OPENAI_API_KEY)
- AnthropicProvider (ANTHROPIC_API_KEY)
- GeminiProvider (GOOGLE_API_KEY)

MCP Future Note:
This layer is designed to be extended as an MCP tool provider.
The AbstractLLMProvider interface can map directly to MCP tool schemas.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)


class AbstractLLMProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, system: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        ...

    @abstractmethod
    def get_model_name(self) -> str:
        ...


class MockLLMProvider(AbstractLLMProvider):
    """Demo LLM provider with realistic domain-specific responses."""

    _responses = {
        "qualif": "Lead qualificado. Score: 8/10. Interesse alto em automação de vendas. Próxima ação: Agendar demo técnica.",
        "agenda": "Reunião agendada para próxima semana. Confirmação enviada ao contato via WhatsApp.",
        "classif": "Intenção: Compra. Confiança: 87%. Produto: Plano Enterprise. Ação sugerida: Enviar proposta.",
        "resum": "Resumo: Cliente interessado em automação de CRM. Solicitou proposta e demo. Sentimento positivo.",
        "recup": "Mensagem de reativação gerada: 'Olá! Notamos que faz alguns dias que não conversamos. Posso ajudar em algo?'",
        "cobr": "Lembrete de pagamento gerado de forma amigável e personalizada para o perfil do cliente.",
        "default": "Ação executada com sucesso pelo agente. Resultado disponível no painel de execuções.",
    }

    async def complete(self, prompt: str, system: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        p = prompt.lower()
        key = next((k for k in self._responses if k in p), "default")
        response = self._responses[key]
        logger.info(f"[MockLLM] Completing prompt ({len(prompt)} chars)")
        return {
            "content": response,
            "model": "mock-llm-v1",
            "usage": {
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(response.split()),
                "total_tokens": len(prompt.split()) + len(response.split()),
            },
        }

    def get_model_name(self) -> str:
        return "mock-llm-v1 (demo)"


def get_llm_provider() -> AbstractLLMProvider:
    """Factory for LLM provider. Priority: OpenAI > Anthropic > Gemini > Mock."""
    if os.environ.get("OPENAI_API_KEY"):
        logger.info("OPENAI_API_KEY found — OpenAI provider ready to implement")
    if os.environ.get("ANTHROPIC_API_KEY"):
        logger.info("ANTHROPIC_API_KEY found — Anthropic provider ready to implement")
    logger.info("Using MockLLMProvider (demo mode)")
    return MockLLMProvider()
