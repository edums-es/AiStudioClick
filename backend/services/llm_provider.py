"""
LLM Provider Layer — interface abstrata para providers de IA plugáveis.

Providers disponíveis:
  - OpenAIProvider  : OpenAI via emergentintegrations (EMERGENT_LLM_KEY)
  - MockLLMProvider : respostas simuladas para demo/dev sem chave

get_llm_provider() retorna o melhor provider disponível.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)


class AbstractLLMProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, system: Optional[str] = None, **kwargs) -> Dict[str, Any]: ...

    @abstractmethod
    def get_model_name(self) -> str: ...


class MockLLMProvider(AbstractLLMProvider):
    """Demo provider com respostas domain-specific realistas."""

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
        logger.info(f"[MockLLM] Completando prompt ({len(prompt)} chars)")
        return {
            "content": response,
            "model": "mock-llm-v1",
            "usage": {"total_tokens": len(prompt.split()) + len(response.split())},
        }

    def get_model_name(self) -> str:
        return "mock-llm-v1 (demo)"


class OpenAIProvider(AbstractLLMProvider):
    """OpenAI GPT-4o via emergentintegrations com EMERGENT_LLM_KEY."""

    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        self.model = "gpt-4o"

    async def complete(self, prompt: str, system: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import uuid
        session_id = kwargs.get("session_id", str(uuid.uuid4()))
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system or "Você é um assistente de IA executando um fluxo de automação no AI Studio.",
        ).with_model("openai", self.model)
        response = await chat.send_message(UserMessage(text=prompt))
        return {
            "content": response or "",
            "model": self.model,
            "usage": {},
        }

    def get_model_name(self) -> str:
        return f"openai/{self.model} (emergentintegrations)"


def get_llm_provider() -> AbstractLLMProvider:
    """Factory — retorna OpenAI se EMERGENT_LLM_KEY estiver configurado, senão Mock."""
    if os.environ.get("EMERGENT_LLM_KEY"):
        try:
            logger.info("[LLMProvider] EMERGENT_LLM_KEY encontrado — usando OpenAIProvider")
            return OpenAIProvider()
        except Exception as e:
            logger.warning(f"[LLMProvider] OpenAIProvider falhou ao inicializar: {e} — usando Mock")
    logger.info("[LLMProvider] Usando MockLLMProvider (modo demo)")
    return MockLLMProvider()
