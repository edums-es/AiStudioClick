# PRD — AI Studio

**Última atualização:** 2026-04-08

## Problema Statement

Plataforma SaaS multi-tenant para criação, configuração, teste, publicação e gerenciamento de agentes de IA com builder visual. Posicionamento: "Crie agentes de IA arrastando blocos. Conecte com suas ferramentas. Publique com um clique." O CRM Clickmassa é uma integração entre outras — não aparece no branding.

## Stack Escolhida

- Frontend: React 19 + TailwindCSS + Shadcn/UI + @xyflow/react
- Backend: FastAPI + Motor (MongoDB async) + PyJWT + bcrypt + slowapi
- Auth: JWT (httpOnly cookies com `withCredentials`; sem localStorage)
- LLM: emergentintegrations — OpenAI gpt-4o (EMERGENT_LLM_KEY)
- Execution: WebSocket + ExecutionEngine (step-by-step) + ws-token para auth segura

## Implementado (MVP v1.4 — 2026-04-08)

### Segurança
- ✅ Cookies `HttpOnly; SameSite=lax; Secure` (produção via `ENVIRONMENT=production`)
- ✅ JWT apenas em httpOnly cookies — removido de localStorage (sem XSS vector)
- ✅ Rate limiting: 10/min em `/login`, 5/min em `/register` (slowapi)
- ✅ Validação de senha mínima (8 chars) via Pydantic `field_validator`
- ✅ `ADMIN_PASSWORD`: warning em dev, erro fatal em produção
- ✅ `validate_object_id()` em agents/integrations/executions (400 vs 500)
- ✅ WS Token: `GET /api/workspace/ws-token` gera token de 60s para WebSocket auth

### Backend
- ✅ Auth JWT (register/login/logout/me) + lifespan FastAPI moderno
- ✅ Multi-tenancy com isolamento por tenant_id
- ✅ Routers: auth, agents, templates, skills, integrations, executions, mindmap, dashboard, n8n, workspace, webhook
- ✅ `RealClickMassaProvider` — API real do Clickmassa (server_url + api_token)
- ✅ `MockClickMassaProvider` — modo demo sem credenciais (is_mock=true)
- ✅ `OpenAIProvider` via emergentintegrations (EMERGENT_LLM_KEY)
- ✅ Webhook: `POST /api/webhook/clickmassa/{tenant_id}` — validação de tenant + LLM + Push API
- ✅ ExecutionEngine com WebSocket real-time + auth por ws-token (one-use, 60s TTL)
- ✅ `voice_call` mapeado em N8N_NODE_MAP (stub → httpRequest, Fase 2: Vapi/Bland.ai)
- ✅ `backend/.env.example` e `frontend/.env.example` criados

### Frontend
- ✅ Auth via httpOnly cookies (sem localStorage) — `withCredentials: true`
- ✅ AgentRun: startExecution async — obtém ws-token antes de conectar ao WebSocket
- ✅ AgentBuilder: NODE_PALETTE com _engineType (não _internal_type), voice_call no final
- ✅ NodePanel: case voice_call com campos Rótulo/Número/Script/Provedor
- ✅ nodeTypes: ClickMassaNode com indigo, label "CRM Clickmassa"; VoiceCallNode pink

### Rebranding (v1.4)
- ✅ Login: placeholder "seu@email.com", subtitle "by AI Studio", tagline sem Clickmassa
- ✅ Register: tagline sem Clickmassa, subtitle removido
- ✅ Sidebar: "AI Studio" (sem subtítulo Click Massa)
- ✅ Settings: Stack&Arquitetura só em dev, n8n → "Motor de Execução de Agentes"
- ✅ AgentBuilder: "CRM Clickmassa" na paleta, DEPLOY_STATUS com labels limpos
- ✅ Integrations: subtítulo neutro, opções de provider atualizadas
- ✅ Backend: FastAPI title="AI Studio", seeds rebrandeados, system prompts atualizados
- ✅ n8n completamente invisível ao usuário (Motor de Execução)

## Arquitetura de Dados

- users, tenants (+ n8n_config), memberships
- agents (flow_definition), agent_templates, skills
- integrations (credentials, status, is_mock)
- execution_logs (source: manual/webhook/live_run)
- mindmaps, blueprints, deployments

## Backlog Priorizado

### P0 (Demo)
- Página de analytics de execuções (histórico visual)

### P1 (Curto Prazo)
- Onboarding guiado / tour interativo para novos usuários
- Voice providers reais (Vapi/Bland.ai) para o nó voice_call
- Versionamento de agentes
- Publicação com endpoint público (webhook URL)
- Permissões por papel (admin/editor/viewer)

### P2 (Médio Prazo)
- Marketplace de templates
- Billing (Stripe)
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

- Admin: admin@clickmassa.com / admin123 (dev only — ADMIN_EMAIL no .env)
- Registrar nova conta: /register (senha mínima 8 chars)
