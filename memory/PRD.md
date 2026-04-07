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
- LLM: Abstract provider layer (Mock por padrão)

## Implementado (MVP v1.0)

### Backend (/app/backend/)
- ✅ Auth JWT com registro/login/logout/me (core/auth.py)
- ✅ Multi-tenancy: cada usuário tem Tenant próprio, todos os dados isolados por tenant_id
- ✅ Routers: auth, agents, templates, skills, integrations, executions, mindmap, dashboard
- ✅ ClickMassaConnector: AbstractConnectorProtocol + MockClickMassaProvider
- ✅ LLMProvider: AbstractLLMProvider + MockLLMProvider + factory
- ✅ ExternalConnectorService: REST, Webhook, Voice stubs
- ✅ Seeds: 8 skills nativas, 6 templates nativos, 3 agentes demo, logs, integração Click Massa
- ✅ test_credentials.md atualizado

### Frontend (/app/frontend/src/)
- ✅ Login / Register pages (zinc dark premium theme)
- ✅ Dashboard com stats (agentes, templates, skills, integrações), agentes recentes, execuções
- ✅ Agent Builder: React Flow com 9 tipos de nó, painel lateral, save/load JSON
- ✅ Templates Library: 6 templates com clone → builder
- ✅ Skills: 8 nativas + criação de customizadas + filtro por categoria
- ✅ Integrations: Click Massa com test connection + toast feedback
- ✅ Mind Map: React Flow com 6 tipos de nó (ideia, etapa, dor, objetivo, ação, observação)
- ✅ Executions: histórico com expandir input/output
- ✅ Settings: perfil, workspace, stack info
- ✅ Sidebar elegante com collapse

## Arquitetura de Dados (MongoDB Collections)

- users: id, name, email, password_hash, role, tenant_id
- tenants: id, name, slug, plan, owner_id, settings
- memberships: user_id, tenant_id, role
- agents: id, name, description, status, flow_definition, tenant_id, version
- agent_templates: id, name, description, category, flow_definition, is_native
- skills: id, name, description, category, prompt_base, is_native
- integrations: id, provider, credentials, status, tenant_id
- execution_logs: id, agent_id, status, input, output, duration_ms, tenant_id
- mindmaps: id, name, nodes, edges, tenant_id

## Backlog Priorizado

### P0 (Próxima Sprint)
- Motor de execução real de fluxos (passo-a-passo com LLM real)
- WebSocket para execução em tempo real
- Conectar LLM real (OpenAI/Claude/Gemini) via env vars

### P1 (Curto Prazo)
- Versionamento de agentes
- Publicação de agentes com endpoint público
- Permissões por papel (admin/editor/viewer)
- Importação/exportação de fluxos JSON

### P2 (Médio Prazo)
- Marketplace de templates
- Billing por tenant (Stripe)
- MCP-compatible tool servers
- Voice providers (Twilio/Vapi/Bland.ai)
- White-label / multi-workspace
- Observabilidade (traces, metrics, alertas)

## Credenciais de Teste

- Admin: admin@clickmassa.com / admin123
- Registrar nova conta: /register (cria workspace próprio)
