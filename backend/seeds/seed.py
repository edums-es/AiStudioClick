"""Seed script — populates initial data for AI Studio demo."""
import logging
import os
from datetime import datetime, timezone

from core.auth import hash_password, verify_password

logger = logging.getLogger(__name__)

NATIVE_SKILLS = [
    {
        "name": "Qualificar Lead", "category": "vendas",
        "description": "Analisa um lead e calcula score de qualificação (0-10) com próxima ação recomendada.",
        "inputs": [{"name": "lead_data", "type": "object", "required": True}],
        "prompt_base": "Você é especialista em qualificação de leads B2B. Analise o lead e retorne score (0-10) com justificativa e próxima ação.",
        "tools_allowed": ["get_contact", "update_contact"],
        "output_schema": {"score": "number", "justification": "string", "next_action": "string"},
        "guardrails": ["Nunca compartilhe dados sensíveis", "Sempre justifique o score"],
        "is_native": True,
    },
    {
        "name": "Classificar Intenção", "category": "atendimento",
        "description": "Identifica a intenção do contato (compra/suporte/informação/cancelamento) com nível de confiança.",
        "inputs": [{"name": "message", "type": "string", "required": True}],
        "prompt_base": "Classifique a intenção da mensagem. Retorne: intencao, confianca (0-100), acao_sugerida.",
        "tools_allowed": [],
        "output_schema": {"intention": "string", "confidence": "number", "suggested_action": "string"},
        "guardrails": ["Responda sempre em português"],
        "is_native": True,
    },
    {
        "name": "Agendar Reunião", "category": "agendamento",
        "description": "Auxilia no agendamento de reuniões, verificando disponibilidade e confirmando com o contato.",
        "inputs": [
            {"name": "contact_id", "type": "string", "required": True},
            {"name": "preferred_dates", "type": "array"},
        ],
        "prompt_base": "Gerencie agendamentos de forma eficiente e profissional.",
        "tools_allowed": ["get_contact", "calendar_check"],
        "output_schema": {"scheduled": "boolean", "datetime": "string", "confirmation_sent": "boolean"},
        "guardrails": ["Confirme sempre com o contato antes de finalizar"],
        "is_native": True,
    },
    {
        "name": "Criar Contato no CRM", "category": "crm",
        "description": "Cria um novo contato no CRM conectado com os dados fornecidos.",
        "inputs": [
            {"name": "name", "type": "string", "required": True},
            {"name": "phone", "type": "string", "required": True},
            {"name": "email", "type": "string"},
        ],
        "prompt_base": "Crie um contato com os dados fornecidos no CRM.",
        "tools_allowed": ["create_contact"],
        "output_schema": {"contact_id": "string", "success": "boolean"},
        "guardrails": ["Valide o formato do telefone antes de criar"],
        "is_native": True,
    },
    {
        "name": "Aplicar Tag/Etiqueta", "category": "crm",
        "description": "Aplica uma ou mais tags em um contato para segmentação e automação.",
        "inputs": [
            {"name": "contact_id", "type": "string", "required": True},
            {"name": "tags", "type": "array", "required": True},
        ],
        "prompt_base": "Aplique as tags fornecidas no contato especificado.",
        "tools_allowed": ["apply_tag"],
        "output_schema": {"success": "boolean", "tags_applied": "array"},
        "guardrails": ["Máximo de 10 tags por contato"],
        "is_native": True,
    },
    {
        "name": "Resumir Conversa", "category": "análise",
        "description": "Gera resumo estruturado de uma conversa com pontos-chave, sentimento e próximas ações.",
        "inputs": [{"name": "conversation", "type": "string", "required": True}],
        "prompt_base": "Resuma a conversa: pontos principais, sentimento do cliente, ações a tomar.",
        "tools_allowed": [],
        "output_schema": {"summary": "string", "sentiment": "string", "next_actions": "array"},
        "guardrails": ["Seja conciso e objetivo"],
        "is_native": True,
    },
    {
        "name": "Recuperar Lead Parado", "category": "vendas",
        "description": "Estratégia de reengajamento para leads que não respondem há mais de 7 dias.",
        "inputs": [
            {"name": "lead_id", "type": "string", "required": True},
            {"name": "days_inactive", "type": "number"},
        ],
        "prompt_base": "Crie mensagem de reengajamento personalizada e não invasiva para lead inativo.",
        "tools_allowed": ["get_contact", "send_message"],
        "output_schema": {"message": "string", "channel": "string"},
        "guardrails": ["Máximo 3 tentativas de reativação", "Nunca seja insistente"],
        "is_native": True,
    },
    {
        "name": "Enviar para Call Externo", "category": "voz",
        "description": "Encaminha um contato para um provedor de call/voz externo configurado.",
        "inputs": [
            {"name": "contact_id", "type": "string", "required": True},
            {"name": "provider_config", "type": "object"},
        ],
        "prompt_base": "Enfileirar contato para chamada de voz via provedor externo.",
        "tools_allowed": ["send_to_call"],
        "output_schema": {"queued": "boolean", "call_id": "string"},
        "guardrails": ["Verificar horário comercial antes de ligar", "Registrar todas as tentativas"],
        "is_native": True,
    },
]

NATIVE_TEMPLATES = [
    {
        "name": "Qualificação de Lead",
        "description": "Qualifica leads automaticamente com score e próximas ações recomendadas.",
        "category": "vendas",
        "tags": ["lead", "qualificação", "score", "vendas"],
        "is_native": True,
        "flow_definition": {
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 100, "y": 200},
                 "data": {"label": "Entrada do Lead", "description": "Gatilho de entrada"}},
                {"id": "prompt-1", "type": "prompt", "position": {"x": 350, "y": 200},
                 "data": {"label": "Qualificar Lead", "system_instruction": "Especialista em qualificação de leads B2B.", "prompt": "Analise o lead e retorne score."}},
                {"id": "condition-1", "type": "condition", "position": {"x": 600, "y": 200},
                 "data": {"label": "Score >= 7?", "condition_field": "score", "operator": "gte", "condition_value": "7"}},
                {"id": "clickmassa-1", "type": "clickmassa", "position": {"x": 850, "y": 100},
                 "data": {"label": "Tag: Lead Quente", "action": "apply_tag", "tag": "lead-quente"}},
                {"id": "clickmassa-2", "type": "clickmassa", "position": {"x": 850, "y": 300},
                 "data": {"label": "Tag: Nutrição", "action": "apply_tag", "tag": "nutrição"}},
                {"id": "output-1", "type": "output", "position": {"x": 1100, "y": 200},
                 "data": {"label": "Finalizar", "output_type": "json"}},
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "prompt-1", "type": "smoothstep"},
                {"id": "e2", "source": "prompt-1", "target": "condition-1", "type": "smoothstep"},
                {"id": "e3", "source": "condition-1", "target": "clickmassa-1", "sourceHandle": "yes", "type": "smoothstep"},
                {"id": "e4", "source": "condition-1", "target": "clickmassa-2", "sourceHandle": "no", "type": "smoothstep"},
                {"id": "e5", "source": "clickmassa-1", "target": "output-1", "type": "smoothstep"},
                {"id": "e6", "source": "clickmassa-2", "target": "output-1", "type": "smoothstep"},
            ],
        },
    },
    {
        "name": "Agendamento Automático",
        "description": "Fluxo completo para agendamento de reuniões com confirmação automática.",
        "category": "agendamento",
        "tags": ["agendamento", "reunião", "calendário"],
        "is_native": True,
        "flow_definition": {
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 100, "y": 200},
                 "data": {"label": "Solicitação de Reunião"}},
                {"id": "skill-1", "type": "skill_executor", "position": {"x": 350, "y": 200},
                 "data": {"label": "Verificar Disponibilidade", "skill": "Agendar Reunião"}},
                {"id": "clickmassa-1", "type": "clickmassa", "position": {"x": 600, "y": 200},
                 "data": {"label": "Criar Evento", "action": "create_appointment"}},
                {"id": "output-1", "type": "output", "position": {"x": 850, "y": 200},
                 "data": {"label": "Confirmar", "output_type": "message"}},
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "skill-1", "type": "smoothstep"},
                {"id": "e2", "source": "skill-1", "target": "clickmassa-1", "type": "smoothstep"},
                {"id": "e3", "source": "clickmassa-1", "target": "output-1", "type": "smoothstep"},
            ],
        },
    },
    {
        "name": "Recuperação de Lead Parado",
        "description": "Reengaja leads que não responderam nos últimos 7 dias.",
        "category": "reengajamento",
        "tags": ["recuperação", "reengajamento", "inativo", "follow-up"],
        "is_native": True,
        "flow_definition": {
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 200},
                 "data": {"label": "7 dias sem resposta", "trigger_type": "schedule"}},
                {"id": "skill-1", "type": "skill_executor", "position": {"x": 350, "y": 200},
                 "data": {"label": "Gerar Mensagem", "skill": "Recuperar Lead Parado"}},
                {"id": "clickmassa-1", "type": "clickmassa", "position": {"x": 600, "y": 200},
                 "data": {"label": "Enviar Mensagem", "action": "send_message"}},
                {"id": "output-1", "type": "output", "position": {"x": 850, "y": 200},
                 "data": {"label": "Registrar", "output_type": "log"}},
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "skill-1", "type": "smoothstep"},
                {"id": "e2", "source": "skill-1", "target": "clickmassa-1", "type": "smoothstep"},
                {"id": "e3", "source": "clickmassa-1", "target": "output-1", "type": "smoothstep"},
            ],
        },
    },
    {
        "name": "Pós-Venda e Onboarding",
        "description": "Fluxo de pós-venda para garantir satisfação e reduzir churn.",
        "category": "pós-venda",
        "tags": ["pós-venda", "onboarding", "satisfação", "retenção"],
        "is_native": True,
        "flow_definition": {
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 200},
                 "data": {"label": "Novo Cliente", "trigger_type": "event"}},
                {"id": "delay-1", "type": "delay", "position": {"x": 350, "y": 200},
                 "data": {"label": "Aguardar 24h", "delay_hours": 24}},
                {"id": "prompt-1", "type": "prompt", "position": {"x": 600, "y": 200},
                 "data": {"label": "Mensagem de Boas-vindas", "prompt": "Crie mensagem de boas-vindas personalizada"}},
                {"id": "output-1", "type": "output", "position": {"x": 850, "y": 200},
                 "data": {"label": "Enviar", "output_type": "message"}},
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "delay-1", "type": "smoothstep"},
                {"id": "e2", "source": "delay-1", "target": "prompt-1", "type": "smoothstep"},
                {"id": "e3", "source": "prompt-1", "target": "output-1", "type": "smoothstep"},
            ],
        },
    },
    {
        "name": "Suporte Inicial",
        "description": "Triagem e resolução de tickets com escalonamento inteligente.",
        "category": "suporte",
        "tags": ["suporte", "atendimento", "triagem", "escalamento"],
        "is_native": True,
        "flow_definition": {
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 100, "y": 200},
                 "data": {"label": "Ticket Recebido"}},
                {"id": "skill-1", "type": "skill_executor", "position": {"x": 350, "y": 200},
                 "data": {"label": "Classificar Intenção", "skill": "Classificar Intenção"}},
                {"id": "condition-1", "type": "condition", "position": {"x": 600, "y": 200},
                 "data": {"label": "Urgente?", "condition_field": "priority", "operator": "eq", "condition_value": "urgent"}},
                {"id": "output-1", "type": "output", "position": {"x": 850, "y": 100},
                 "data": {"label": "Escalar para Humano", "output_type": "escalate"}},
                {"id": "output-2", "type": "output", "position": {"x": 850, "y": 300},
                 "data": {"label": "Resposta Automática", "output_type": "message"}},
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "skill-1", "type": "smoothstep"},
                {"id": "e2", "source": "skill-1", "target": "condition-1", "type": "smoothstep"},
                {"id": "e3", "source": "condition-1", "target": "output-1", "sourceHandle": "yes", "type": "smoothstep"},
                {"id": "e4", "source": "condition-1", "target": "output-2", "sourceHandle": "no", "type": "smoothstep"},
            ],
        },
    },
    {
        "name": "Cobrança e Lembrete",
        "description": "Envio automático de lembretes de pagamento com personalização por perfil.",
        "category": "financeiro",
        "tags": ["cobrança", "lembrete", "pagamento", "financeiro"],
        "is_native": True,
        "flow_definition": {
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 200},
                 "data": {"label": "3 dias antes do vencimento", "trigger_type": "schedule"}},
                {"id": "prompt-1", "type": "prompt", "position": {"x": 350, "y": 200},
                 "data": {"label": "Gerar Lembrete", "prompt": "Crie lembrete amigável de pagamento"}},
                {"id": "clickmassa-1", "type": "clickmassa", "position": {"x": 600, "y": 200},
                 "data": {"label": "Enviar Lembrete", "action": "send_message"}},
                {"id": "output-1", "type": "output", "position": {"x": 850, "y": 200},
                 "data": {"label": "Registrar", "output_type": "log"}},
            ],
            "edges": [
                {"id": "e1", "source": "trigger-1", "target": "prompt-1", "type": "smoothstep"},
                {"id": "e2", "source": "prompt-1", "target": "clickmassa-1", "type": "smoothstep"},
                {"id": "e3", "source": "clickmassa-1", "target": "output-1", "type": "smoothstep"},
            ],
        },
    },
]


async def run_seed(db):
    logger.info("Running seeds...")
    await _seed_admin(db)
    await _seed_native_skills(db)
    await _seed_native_templates(db)
    logger.info("Seeds completed.")


async def _seed_admin(db):
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@aistudio.com")
    _env_password = os.environ.get("ADMIN_PASSWORD", "")
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"

    if not _env_password:
        if is_production:
            raise RuntimeError(
                "❌ ADMIN_PASSWORD não definido! "
                "Defina a variável de ambiente ADMIN_PASSWORD antes de iniciar em produção."
            )
        logger.warning("⚠️  ADMIN_PASSWORD não definido — usando senha padrão de desenvolvimento (admin123)")
    admin_password = _env_password or "admin123"  # Test credentials only — never use in production

    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        now = datetime.now(timezone.utc).isoformat()
        tenant_doc = {
            "name": "AI Studio Demo",
            "slug": "aistudio-demo",
            "plan": "enterprise",
            "settings": {"timezone": "America/Sao_Paulo", "language": "pt-BR"},
            "created_at": now,
        }
        tenant_result = await db.tenants.insert_one(tenant_doc)
        tenant_id = str(tenant_result.inserted_id)

        user_doc = {
            "name": "Admin AI Studio",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "tenant_id": tenant_id,
            "created_at": now,
        }
        user_result = await db.users.insert_one(user_doc)
        user_id = str(user_result.inserted_id)

        await db.tenants.update_one(
            {"_id": tenant_result.inserted_id}, {"$set": {"owner_id": user_id}}
        )
        await db.memberships.insert_one({
            "user_id": user_id, "tenant_id": tenant_id,
            "role": "admin", "created_at": now,
        })
        await _seed_demo_data(db, tenant_id)
        logger.info(f"Admin created: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")

    _write_test_credentials(admin_email, admin_password)


async def _seed_native_skills(db):
    count = await db.skills.count_documents({"is_native": True})
    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        for s in NATIVE_SKILLS:
            s["created_at"] = now
        await db.skills.insert_many([dict(s) for s in NATIVE_SKILLS])
        logger.info(f"Seeded {len(NATIVE_SKILLS)} native skills")


async def _seed_native_templates(db):
    count = await db.agent_templates.count_documents({"is_native": True})
    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        for t in NATIVE_TEMPLATES:
            t["created_at"] = now
        await db.agent_templates.insert_many([dict(t) for t in NATIVE_TEMPLATES])
        logger.info(f"Seeded {len(NATIVE_TEMPLATES)} native templates")


async def _seed_demo_data(db, tenant_id: str):
    now = datetime.now(timezone.utc).isoformat()

    # Demo agents
    demo_agents = [
        {
            "name": "Agente de Qualificação",
            "description": "Qualifica leads automaticamente usando IA",
            "status": "active",
            "flow_definition": NATIVE_TEMPLATES[0]["flow_definition"],
            "tenant_id": tenant_id,
            "version": 1,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Recuperação de Leads",
            "description": "Reengaja leads inativos com mensagens personalizadas",
            "status": "draft",
            "flow_definition": NATIVE_TEMPLATES[2]["flow_definition"],
            "tenant_id": tenant_id,
            "version": 1,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Suporte ao Cliente",
            "description": "Triagem e escalamento inteligente de tickets",
            "status": "active",
            "flow_definition": NATIVE_TEMPLATES[4]["flow_definition"],
            "tenant_id": tenant_id,
            "version": 1,
            "created_at": now,
            "updated_at": now,
        },
    ]
    agent_results = await db.agents.insert_many(demo_agents)

    # Demo execution logs
    for idx, agent_id in enumerate(agent_results.inserted_ids[:2]):
        logs = [
            {
                "agent_id": str(agent_id),
                "agent_name": demo_agents[idx]["name"],
                "tenant_id": tenant_id,
                "status": "success",
                "input": {"lead_id": f"cm00{idx + 1}"},
                "output": {"score": 8, "action": "lead-quente"},
                "duration_ms": 1250 + idx * 100,
                "created_at": now,
            },
            {
                "agent_id": str(agent_id),
                "agent_name": demo_agents[idx]["name"],
                "tenant_id": tenant_id,
                "status": "success",
                "input": {"lead_id": f"cm00{idx + 3}"},
                "output": {"score": 4, "action": "nutricao"},
                "duration_ms": 980 + idx * 50,
                "created_at": now,
            },
        ]
        await db.execution_logs.insert_many(logs)

    # CRM integration (Clickmassa)
    await db.integrations.insert_one({
        "provider": "clickmassa",
        "name": "CRM Principal",
        "credentials": {},
        "config": {"workspace": "demo"},
        "status": "connected",
        "tenant_id": tenant_id,
        "created_at": now,
        "last_tested": now,
    })
    logger.info(f"Demo data seeded for tenant {tenant_id}")


def _write_test_credentials(admin_email: str, admin_password: str):
    os.makedirs("/app/memory", exist_ok=True)
    content = f"""# Test Credentials — AI Studio

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Demo Test User
- Email: demo@example.com
- Password: demo123
- Role: member (register via UI)

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
"""
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(content)
