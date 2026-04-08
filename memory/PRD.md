# PRD — AI Studio

**Última atualização:** 2026-04-08

## Problema Statement

Plataforma SaaS multi-tenant para criação, configuração, teste, publicação e gerenciamento de agentes de IA com builder visual. Posicionamento: "Crie agentes de IA arrastando blocos. Conecte com suas ferramentas. Publique com um clique." O CRM Clickmassa é uma integração entre outras. **Nova visão (v2):** usuário descreve em linguagem natural → LLM gera o workflow React Flow visualmente → wizard de credenciais → Publicar.

## Stack

- Frontend: React 19 + TailwindCSS + Shadcn/UI + @xyflow/react
- Backend: FastAPI + MongoDB async + PyJWT + bcrypt + slowapi
- Auth: JWT (httpOnly cookies, withCredentials: true)
- LLM: emergentintegrations — gpt-4o (EMERGENT_LLM_KEY)
- Execution: WebSocket + ws-token (60s one-use) + ExecutionEngine

## Implementado (v2.0 — 2026-04-08)

### Feature Principal: Criar com IA (Prompt → Agente)
- ✅ `POST /api/generate/agent` — LLM interpreta prompt, retorna flow_definition + required_credentials
- ✅ System prompt estruturado com schema React Flow exato (8 tipos de nós, layout posicional)
- ✅ Fallback demo_flow quando EMERGENT_LLM_KEY não configurado
- ✅ Parse robusto de JSON (strip markdown fences, regex fallback)
- ✅ Sanitização de nodes (validação de tipos + fallbacks)
- ✅ `CreateAgent.jsx` — wizard 3 steps:
  - Step 1: textarea grande, exemplos clicáveis, botão "Gerar com IA"
  - Step 2: React Flow canvas com animação progressiva (nós aparecem um por um, 380ms/nó)
  - Step 3: Credential wizard com cards por serviço, progress bar, skip/save
- ✅ Animação "desenho em tempo real" via setInterval + opacity fade
- ✅ Salva agente via POST /api/agents + credenciais via POST /api/integrations
- ✅ Redireciona para /agents/{id}/edit (builder existente com botão Publicar)

### MCP Marketplace
- ✅ `Marketplace.jsx` — 28 MCPs em 8 categorias
- ✅ Busca por nome/descrição/categoria
- ✅ Filtros por categoria (pills horizontais)
- ✅ "Instalar" → toast + badge "Instalado" (estado local por ora)
- ✅ Cards com ícone emoji, badge Popular/Oficial, link de docs
- ✅ `mcpCatalog.js` — dados estáticos extensíveis

### Navegação Atualizada
- ✅ Sidebar: "Criar com IA" (link roxo destaque) + "Marketplace" na nav
- ✅ Dashboard: botão "Criar com IA" + hero CTA quando 0 agentes

### Segurança + Infraestrutura
- ✅ httpOnly cookies + ws-token auth (60s one-use)
- ✅ Rate limiting, ObjectId validation
- ✅ .env.example files criados

### Rebranding Completo (v1.4)
- ✅ "Click Massa" removido de todo o branding — apenas "CRM Clickmassa" como integração
- ✅ n8n invisível: "Motor de Execução de Agentes" no Settings
- ✅ Stack & Arquitetura: apenas em NODE_ENV=development

## Arquitetura de Arquivos

```
/app/backend/routers/generate.py    ← NOVO: POST /api/generate/agent
/app/frontend/src/
  pages/agents/CreateAgent.jsx       ← NOVO: wizard 3 steps
  pages/marketplace/Marketplace.jsx  ← NOVO: MCP marketplace
  data/mcpCatalog.js                 ← NOVO: 28 MCPs estáticos
  App.js                             ← routes /create + /marketplace
  components/layout/Sidebar.jsx      ← "Criar com IA" + Marketplace
  pages/dashboard/Dashboard.jsx      ← hero CTA + novo botão
```

## Backlog Priorizado

### P0 (próxima demo)
- Publicar agente → push real para n8n via API (workflow JSON → n8n create/activate)
- Configuração de Skills no wizard (conectar ao catálogo MCP após instalar)

### P1 (curto prazo)
- Marketplace: persistência de instalados no banco (GET/POST /api/marketplace)
- Voice providers reais (Vapi.ai/Bland.ai) para nó voice_call
- Versionamento de agentes
- Analytics de execuções (gráfico diário, taxa de sucesso)

### P2 (médio prazo)
- Billing com Stripe
- MCP registry real (conectar a um hub externo)
- Permissões por papel (admin/editor/viewer)
- Template marketplace com preview

## Credenciais de Teste

- Admin: admin@clickmassa.com / admin123 (ADMIN_EMAIL no .env)
- Nova conta: /register (senha mínima 8 chars)
