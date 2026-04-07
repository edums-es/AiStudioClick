# PRD — AI Studio Click Massa

**Última atualização:** 2026-04-07

## Problema Statement

Plataforma SaaS multi-tenant para criação, configuração, teste, publicação e gerenciamento de agentes de IA integrados ao ecossistema Click Massa. Permite que times de vendas/operações/marketing criem agentes com interface visual, templates prontos, skills reutilizáveis e integração nativa ao Click Massa.

## Personas

- **Gestor de Vendas:** quer automatizar qualificação de leads sem envolver TI
- **Operações:** quer criar fluxos de pós-venda, cobrança e suporte automatizados
- **Marketing:** quer segmentar e reengajar leads com agentes personalizados

## Stack Escolhida

- Frontend: React 19 + TailwindCSS + Shadcn/UI + @xyflow/react
- Backend: FastAPI + Motor (MongoDB async) + PyJWT + bcrypt
- Auth: JWT (httpOnly cookies + Bearer token)
- LLM: emergentintegrations — OpenAI gpt-4o (EMERGENT_LLM_KEY)
- Execution: WebSocket + ExecutionEngine (step-by-step com LLM real)

## Implementado (MVP v1.2 — 2026-04-07)

### Backend (/app/backend/)
- ✅ Auth JWT com registro/login/logout/me (core/auth.py)
- ✅ Multi-tenancy: cada usuário tem Tenant próprio, todos os dados isolados por tenant_id
- ✅ Routers: auth, agents, templates, skills, integrations, executions, mindmap, dashboard, n8n, workspace
- ✅ ClickMassaConnector: AbstractConnectorProtocol + MockClickMassaProvider
- ✅ LLMProvider: emergentintegrations + OpenAI gpt-4o (llm_service.py)
- ✅ Seeds: 8 skills nativas, 6 templates nativos, 3 agentes demo, logs, integração Click Massa
- ✅ n8n Headless: WorkflowTranslator (RF→n8n), N8nClient (async HTTP), blueprints + deploy idempotente
- ✅ **ExecutionEngine**: Executa fluxos React Flow nó a nó com WebSocket real-time streaming
- ✅ **Workspace API**: GET/PUT /api/workspace/n8n-config (por tenant, masking de api_key)
- ✅ **WebSocket**: /api/workspace/ws/run/{agent_id}?token=...&input_text=... — auth JWT por query param

### Frontend (/app/frontend/src/)
- ✅ Login / Register pages (zinc dark premium theme)
- ✅ Dashboard com stats, agentes recentes, execuções
- ✅ Agent Builder: React Flow com 12 nós n8n-compatíveis, paleta, deploy n8n
- ✅ Templates Library: 6 templates com clone → builder
- ✅ Skills: 8 nativas + criação + filtro
- ✅ Integrations: Click Massa com test connection
- ✅ Mind Map Miro-like: sticky notes (9 cores), duplo-clique, toolbar de cores, inline editing
- ✅ Executions: histórico
- ✅ **Settings**: n8n config por tenant (URL + API Key, badge Configurado/Não configurado, masking)
- ✅ **AgentRun** (/agents/:id/run): Execução ao vivo com React Flow + glows de status + timeline + LLM real
- ✅ AgentsList: botão "Executar ao Vivo" navega para /agents/{id}/run

## Arquitetura de Dados (MongoDB Collections)

- users, tenants (+ n8n_config por tenant), memberships
- agents: flow_definition com nodes + edges
- agent_templates, skills, integrations
- execution_logs: source="live_run", input_data, output_data, node_results
- mindmaps, blueprints, deployments

## n8n Node Type Map (14 tipos)

trigger/start → webhook/start | ai_agent → openAi | prompt/llm → langchain.agent
condition/if → if | delay → wait | http_request/clickmassa → httpRequest
skill_executor → langchain.agent | code → code | set_variables/output → set

## Backlog Priorizado

### P0 (Próxima Sprint)
- Versionamento de agentes (histórico de blueprints)
- Publicação de agentes com endpoint público + webhook URL
- Testes A/B de prompts

### P1 (Curto Prazo)
- Permissões por papel (admin/editor/viewer)
- Importação/exportação de fluxos JSON
- Dashboard de execuções com métricas em tempo real

### P2 (Médio Prazo)
- Marketplace de templates
- Billing por tenant (Stripe)
- MCP-compatible tool servers
- Voice providers (Twilio/Vapi/Bland.ai)
- White-label / multi-workspace
- Observabilidade (traces, métricas, alertas)

## Credenciais de Teste

- Admin: admin@clickmassa.com / admin123
- Registrar nova conta: /register (cria workspace próprio)
