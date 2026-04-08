"""
LLM Service — integração com emergentintegrations para execução de nós LLM no fluxo.
"""
import os
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


async def run_llm(
    prompt: str,
    system: str = "",
    model: str = "gpt-4o",
    session_id: str = "default",
) -> str:
    """Call LLM and return the text response."""
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        logger.warning("[LLM] EMERGENT_LLM_KEY não configurado — retornando simulação")
        return f"[Simulado] Resposta para: {prompt[:120]}"

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system or "Você é um assistente de IA executando um fluxo de automação no AI Studio.",
        ).with_model("openai", model)

        response = await chat.send_message(UserMessage(text=prompt))
        return response or "[LLM retornou resposta vazia]"
    except Exception as e:
        logger.error(f"[LLM] Erro: {e}")
        return f"[Erro LLM] {str(e)}"
