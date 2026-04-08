"""
Geração de agentes via IA — o usuário descreve em linguagem natural
e o LLM gera o flow_definition (React Flow JSON) + credenciais necessárias.
"""
import json
import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from services.llm_service import run_llm

router = APIRouter(prefix="/generate", tags=["generate"])
logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """Você é um arquiteto especialista em automações e agentes de IA.
Analise o pedido do usuário e gere um workflow completo e funcional.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem ```json, sem nenhum texto adicional fora do JSON.

Estrutura OBRIGATÓRIA:
{
  "agent_name": "Nome curto e descritivo (max 50 chars)",
  "description": "Descrição técnica em uma frase",
  "summary": "Explicação amigável do que o agente faz, em 2-3 frases, sem jargão técnico, em português",
  "flow_definition": {
    "nodes": [ <lista de nós> ],
    "edges": [ <lista de conexões> ]
  },
  "required_credentials": [ <lista de serviços necessários> ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIPOS DE NÓS DISPONÍVEIS (use EXATAMENTE estes valores no campo "type"):

  "trigger"          → ponto de entrada: webhook, mensagem recebida, início manual
  "schedule_trigger" → agendamento automático (cron)
  "ai_agent"         → agente de IA com raciocínio avançado (LLM + memória)
  "prompt"           → processamento simples de texto com LLM
  "condition"        → bifurcação Se/Então
  "http_request"     → chamada a API externa / REST
  "clickmassa"       → ações no CRM Clickmassa (send_message, create_contact, apply_tag)
  "set_variables"    → transformar, mapear ou extrair dados
  "code"             → lógica JavaScript customizada
  "delay"            → aguardar um tempo antes de continuar
  "voice_call"       → chamada de voz via provedor externo (Vapi.ai, Twilio)
  "output"           → resultado final / resposta ao usuário

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE CADA NÓ:
{
  "id": "tipo-numero"  (ex: "trigger-1", "ai_agent-1", "condition-1"),
  "type": "<um dos tipos acima>",
  "position": { "x": <número>, "y": <número> },
  "data": {
    "label": "Nome amigável para o usuário",
    ... campos adicionais conforme o tipo:
    - ai_agent: "system_prompt": "instrução do agente"
    - condition: "condition": "descrição da condição"
    - http_request: "url": "endpoint", "method": "POST"
    - clickmassa: "action": "send_message|create_contact|apply_tag"
    - schedule_trigger: "schedule": "expressão cron ex: 0 9 * * 1-5"
    - voice_call: "provider": "vapi", "script": "roteiro inicial"
    - code: "code": "// código JavaScript"
  }
}

REGRAS DE LAYOUT (OBRIGATÓRIO):
  - Nó inicial: x=100, y=280
  - Incremento horizontal entre nós sequenciais: 260px
  - Bifurcação (condition): ramo superior y=120, ramo inferior y=440
  - Máximo de 8 nós por workflow
  - Distribua os nós em até 3 colunas se necessário (usar y diferente)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE CADA EDGE (conexão):
{
  "id": "e-<source>-<target>",
  "source": "<id do nó de origem>",
  "target": "<id do nó de destino>",
  "type": "smoothstep"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE CREDENCIAIS NECESSÁRIAS:
Para cada serviço externo que o workflow precisa, inclua:
{
  "service": "Nome do Serviço",
  "icon": "emoji representativo",
  "description": "Para que este serviço é usado neste agente",
  "fields": [
    {
      "key": "chave_interna_sem_espaços",
      "label": "Nome amigável do campo",
      "type": "text | password | url | email",
      "required": true,
      "placeholder": "exemplo ou dica de onde encontrar"
    }
  ]
}

Se o workflow não precisar de credenciais externas: "required_credentials": []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLOS DE CREDENCIAIS COMUNS:
- WhatsApp/Evolution API: fields: [{key:"server_url"},{key:"api_token"}]
- Google Calendar: fields: [{key:"client_id"},{key:"client_secret"}]
- Google Sheets: fields: [{key:"spreadsheet_id"},{key:"service_account_json"}]
- Slack: fields: [{key:"webhook_url"},{key:"bot_token"}]
- Email SMTP: fields: [{key:"host"},{key:"port"},{key:"user"},{key:"password"}]
- Clickmassa CRM: fields: [{key:"server_url"},{key:"api_token"}]
- n8n (Motor): fields: [{key:"api_url"},{key:"api_key"}]

Responda SOMENTE com o JSON. Nenhum texto antes ou depois.
"""


class GenerateRequest(BaseModel):
    prompt: str


def _parse_llm_json(text: str) -> dict:
    """Parse JSON from LLM response, handling common formatting issues."""
    clean = text.strip()

    # Remove markdown code fences
    if "```" in clean:
        parts = clean.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                clean = part
                break

    # Try direct parse first
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass

    # Try to extract first {...} block
    match = re.search(r"\{.*\}", clean, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("Resposta da IA não contém JSON válido")


def _sanitize_flow(data: dict) -> dict:
    """Ensure the flow_definition has valid React Flow structure."""
    flow = data.get("flow_definition", {})
    nodes = flow.get("nodes", [])
    edges = flow.get("edges", [])

    # Ensure each node has required fields
    valid_types = {
        "trigger", "schedule_trigger", "ai_agent", "prompt", "condition",
        "delay", "http_request", "clickmassa", "skill_executor", "code",
        "set_variables", "output", "voice_call",
    }
    for node in nodes:
        if node.get("type") not in valid_types:
            node["type"] = "prompt"
        if "id" not in node:
            node["id"] = f"{node['type']}-{uuid.uuid4().hex[:6]}"
        node.setdefault("position", {"x": 100, "y": 250})
        node.setdefault("data", {"label": node.get("type", "Nó")})

    # Ensure edges have required fields
    for edge in edges:
        if "id" not in edge:
            edge["id"] = f"e-{edge.get('source','s')}-{edge.get('target','t')}"
        edge.setdefault("type", "smoothstep")

    data["flow_definition"] = {"nodes": nodes, "edges": edges}
    return data


@router.post("/agent")
async def generate_agent(
    req: GenerateRequest,
    user: dict = Depends(get_current_user),
):
    """
    Recebe um prompt em linguagem natural e retorna um flow_definition
    React Flow completo + lista de credenciais necessárias.
    """
    if not req.prompt or len(req.prompt.strip()) < 10:
        raise HTTPException(status_code=400, detail="Prompt muito curto. Descreva melhor o que o agente deve fazer.")

    raw = await run_llm(
        prompt=req.prompt,
        system=SYSTEM_PROMPT,
        model="gpt-4o",
        session_id=f"generate-{user['id']}-{uuid.uuid4().hex[:8]}",
    )

    # Check if we got a simulated response (no LLM key configured)
    if raw.startswith("[Simulado]") or raw.startswith("[Erro LLM]"):
        logger.warning("[Generate] LLM não disponível — retornando template demo")
        return _demo_flow(req.prompt)

    try:
        data = _parse_llm_json(raw)
    except ValueError as e:
        logger.error(f"[Generate] Falha ao parsear JSON: {e}\nRaw: {raw[:500]}")
        return _demo_flow(req.prompt)

    data = _sanitize_flow(data)
    return data


def _demo_flow(prompt: str) -> dict:
    """Fallback demo flow when LLM is not available."""
    return {
        "agent_name": "Agente de Atendimento Demo",
        "description": "Agente gerado em modo demo (configure EMERGENT_LLM_KEY para usar IA real)",
        "summary": (
            "Este é um agente de demonstração criado sem IA. "
            "Configure a chave LLM nas integrações para gerar agentes personalizados. "
            "O fluxo abaixo mostra a estrutura padrão de um agente de atendimento."
        ),
        "flow_definition": {
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 280},
                 "data": {"label": "Mensagem Recebida"}},
                {"id": "ai_agent-1", "type": "ai_agent", "position": {"x": 360, "y": 280},
                 "data": {"label": "Agente IA", "system_prompt": "Você é um assistente de atendimento."}},
                {"id": "condition-1", "type": "condition", "position": {"x": 620, "y": 280},
                 "data": {"label": "Precisa de Humano?", "condition": "score < 0.7"}},
                {"id": "output-1", "type": "output", "position": {"x": 880, "y": 120},
                 "data": {"label": "Resposta Automática", "format": "text"}},
                {"id": "output-2", "type": "output", "position": {"x": 880, "y": 440},
                 "data": {"label": "Encaminhar Humano", "format": "text"}},
            ],
            "edges": [
                {"id": "e-t1-a1", "source": "trigger-1", "target": "ai_agent-1", "type": "smoothstep"},
                {"id": "e-a1-c1", "source": "ai_agent-1", "target": "condition-1", "type": "smoothstep"},
                {"id": "e-c1-o1", "source": "condition-1", "target": "output-1", "type": "smoothstep"},
                {"id": "e-c1-o2", "source": "condition-1", "target": "output-2", "type": "smoothstep"},
            ],
        },
        "required_credentials": [
            {
                "service": "Motor de Execução (n8n)",
                "icon": "⚙️",
                "description": "Necessário para publicar e ativar o agente",
                "fields": [
                    {"key": "api_url", "label": "URL do Servidor", "type": "url",
                     "required": True, "placeholder": "https://seu-servidor.exemplo.com"},
                    {"key": "api_key", "label": "Chave de Acesso", "type": "password",
                     "required": True, "placeholder": "Sua chave de API"},
                ],
            }
        ],
    }
