# PRD — AI Studio Click Massa

**Última atualização:** 2026-04-08

## Problema Statement

Plataforma SaaS multi-tenant para criação, configuração, teste, publicação e gerenciamento de agentes de IA integrados ao ecossistema Click Massa. Permite que times de vendas/operações/marketing criem agentes com interface visual, templates prontos, skills reutilizáveis e integração nativa ao Click Massa.

## Stack Escolhida

- Frontend: React 19 + TailwindCSS + Shadcn/UI + @xyflow/react
- Backend: FastAPI + Motor (MongoDB async) + PyJWT + bcrypt + slowapi
- Auth: JWT (httpOnly cookies com `withCredentials`; sem localStorage)
- LLM: emergentintegrations — OpenAI gpt-4o (EMERGENT_LLM_KEY)
- Execution: WebSocket + ExecutionEngine (step-by-step)

## Implementado (MVP v1.3 — 2026-04-08)

### Segurança
- ✅ Cookies `HttpOnly; SameSite=lax; Secure` (produção via `ENVIRONMENT=production`)
- ✅ JWT apenas em httpOnly cookies — removido de localStorage (sem XSS vector)
- ✅ Rate limiting: 10/min em `/login`, 5/min em `/register` (slowapi)
- ✅ Validação de senha mínima (8 chars) via Pydantic `field_validator`
- ✅ `ADMIN_PASSWORD`: warning em dev, erro fatal em produção
- ✅ `validate_object_id()` em agents/integrations/executions (400 vs 500)

### Backend
- ✅ Auth JWT (register/login/logout/me) + lifespan FastAPI moderno
- ✅ Multi-tenancy com isolamento por tenant_id
- ✅ Routers: auth, agents, templates, skills, integrations, executions, mindmap, dashboard, n8n, workspace, webhook
- ✅ `RealClickMassaProvider` — API real do Clickmassa (server_url + api_token)
- ✅ `MockClickMassaProvider` — modo demo sem credenciais (is_mock=true)
- ✅ `ClickMassaConnector._resolve_provider()` — automático baseado nas credenciais
- ✅ `OpenAIProvider` via emergentintegrations (EMERGENT_LLM_KEY)
- ✅ Webhook: `POST /api/webhook/clickmassa/{tenant_id}` — recebe mensagem, processa LLM, responde via Push API
- ✅ ExecutionEngine com WebSocket real-time + auth por cookie
- ✅ Workspace settings: n8n config por tenant (PUT/GET)

### Frontend
- ✅ Auth via httpOnly cookies (sem localStorage) — `withCredentials: true`
- ✅ AgentBuilder: labels amigáveis em português, AlertDialog para deletar nó, toast de feedback
- ✅ NodePanel: Select para method/action/output_type/trigger_type/operator, validação URL + JSON, contador de chars, sem ID técnico
- ✅ nodeTypes: `ACTION_LABELS` em português, SkillExecutorNode = "Habilidade IA"
- ✅ Integrations: campos Clickmassa (server_url/api_token/channel_id), badge "DEMO" em amarelo
- ✅ Settings: n8n config por tenant com badge configurado/não configurado
- ✅ AgentRun: execução ao vivo com WebSocket + glows de status + timeline + LLM real
- ✅ Skeleton loading em AgentsList e Templates

## Arquitetura de Dados

- users, tenants (+ n8n_config), memberships
- agents (flow_definition), agent_templates, skills
- integrations (credentials, status, is_mock)
- execution_logs (source: manual/webhook/live_run)
- mindmaps, blueprints, deployments

## Backlog Priorizado

### P0 (Demo)
- Motor de execução com histórico de passos visual no AgentRun
- Página de analytics de execuções

### P1 (Curto Prazo)
- Versionamento de agentes
- Publicação com endpoint público (webhook URL)
- Permissões por papel (admin/editor/viewer)

### P2 (Médio Prazo)
- Marketplace de templates
- Billing (Stripe)
- Voice providers (Twilio/Vapi)
- MCP-compatible tool servers

## Variáveis de Ambiente Necessárias

| Variável          | Obrigatória | Descrição                              |
|-------------------|-------------|----------------------------------------|
| MONGO_URL         | ✅          | MongoDB connection string               |
| DB_NAME           | ✅          | Nome do banco de dados                  |
| JWT_SECRET        | ✅          | Segredo para assinar JWT                |
| ADMIN_PASSWORD    | Prod ✅     | Senha do admin (erro fatal em produção) |
| EMERGENT_LLM_KEY  | ✅          | Chave universal para LLMs               |
| ENVIRONMENT       | Prod ✅     | Definir como "production"               |
| FRONTEND_URL      | Recomend.   | URL do frontend (CORS)                  |
| N8N_API_URL       | Opcional    | URL da instância n8n (fallback global)  |
| N8N_API_KEY       | Opcional    | API key n8n (fallback global)           |

## Credenciais de Teste

- Admin: admin@clickmassa.com / admin123 (dev only)
- Registrar nova conta: /register (senha mínima 8 chars)
