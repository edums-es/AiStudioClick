# AI Studio Click Massa — README

## Visão Geral

**AI Studio Click Massa** é uma plataforma SaaS multi-tenant para criação, configuração, teste, publicação e gerenciamento de agentes de IA integrados ao ecossistema Click Massa.

Construída para times de vendas, operações e marketing que querem automatizar fluxos com IA — sem código, com interface visual, templates prontos e integração nativa.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TailwindCSS + Shadcn/UI + React Flow |
| Backend | FastAPI (Python) + Motor (MongoDB async) |
| Banco de dados | MongoDB |
| Autenticação | JWT (httpOnly cookies + Bearer token) |
| Estado global | AuthContext + Zustand |
| Builder Visual | @xyflow/react v12 |
| LLM Provider | Abstract layer (Mock por padrão — plugável) |

---

## Setup Local

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- MongoDB (local ou Atlas)

### Backend

```bash
cd /app/backend
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
# Editar MONGO_URL, DB_NAME, JWT_SECRET

# Rodar
uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd /app/frontend
yarn install
yarn start
```

---

## Variáveis de Ambiente

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=ai_studio_clickmassa
JWT_SECRET=seu_jwt_secret_aqui
ADMIN_EMAIL=admin@clickmassa.com
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Módulos Implementados

### A. Autenticação & Multi-tenancy
- Login / Registro / Logout
- JWT com refresh token
- Cada usuário registrado obtém seu próprio Tenant/Workspace
- Todos os dados são isolados por `tenant_id`
- Base pronta para OAuth (Google) futuro

### B. Dashboard
- Stats: agentes, templates, skills, integrações
- Agentes recentes com status
- Últimas execuções com resultado

### C. Agent Builder Visual (React Flow)
- Canvas interativo com drag & drop
- 9 tipos de nós: Start, Trigger, Prompt, Condition, Delay, HTTP Request, Click Massa, Skill Executor, Output
- Painel lateral de configuração por nó
- Salvar/carregar fluxo como JSON
- Mini-map e controles

### D. Templates de Agentes
- 6 templates nativos prontos:
  - Qualificação de Lead
  - Agendamento Automático
  - Recuperação de Lead Parado
  - Pós-Venda e Onboarding
  - Suporte Inicial
  - Cobrança e Lembrete
- Clone de template → cria agente

### E. Skills
- 8 skills nativas (Qualificar Lead, Classificar Intenção, Agendar Reunião, etc.)
- Criação de skills customizadas
- Filtro por categoria
- Associáveis aos agentes via bloco Skill Executor

### F. Integração Click Massa
- `ClickMassaConnector` com service layer limpo
- `MockClickMassaProvider` com respostas realistas
- Teste de conexão via UI
- Logs de integração
- Pronto para plugar API real (trocar provider no `_resolve_provider()`)

### G. External Connectors
- `ExternalConnectorService` genérico
- `RestApiConnector`, `WebhookConnector`, `VoiceProviderStub`
- Interfaces abstratas prontas para MCP futuro

### H. Mapa Mental / Funnel Board
- Canvas React Flow para mapas estratégicos
- 6 tipos de nós: Ideia, Etapa, Dor, Objetivo, Ação, Observação
- Salvar/carregar mapas por tenant

### I. Execuções & Logs
- Histórico de execuções por agente
- Status (sucesso/erro), input/output, duração
- Executar agente manualmente via UI

---

## Arquitetura de Pastas

```
backend/
├── server.py           # Entry point FastAPI
├── core/
│   ├── auth.py         # JWT, bcrypt, get_current_user
│   └── database.py     # MongoDB connection
├── routers/            # auth | agents | templates | skills | integrations | executions | mindmap | dashboard
├── services/
│   ├── clickmassa.py   # ClickMassaConnector (abstract + mock)
│   ├── llm_provider.py # AbstractLLMProvider (mock + factory)
│   └── external_connector.py  # REST, Webhook, Voice stubs
└── seeds/
    └── seed.py         # Templates, skills, demo data

frontend/src/
├── contexts/           # AuthContext.js
├── lib/                # api.js (axios)
├── components/
│   ├── layout/         # Sidebar, AppLayout
│   └── builder/        # nodeTypes.jsx, NodePanel.jsx
└── pages/
    ├── auth/           # Login, Register
    ├── dashboard/      # Dashboard
    ├── agents/         # AgentsList, AgentBuilder
    ├── templates/      # Templates
    ├── skills/         # Skills
    ├── integrations/   # Integrations
    ├── mindmap/        # MindMap
    ├── executions/     # Executions
    └── settings/       # Settings
```

---

## LLM Provider — Como Plugar

```python
# Em services/llm_provider.py
def get_llm_provider() -> AbstractLLMProvider:
    if os.environ.get("OPENAI_API_KEY"):
        return OpenAIProvider()  # Implementar OpenAIProvider
    if os.environ.get("ANTHROPIC_API_KEY"):
        return AnthropicProvider()  # Implementar AnthropicProvider
    return MockLLMProvider()  # Default (demo)
```

---

## Click Massa — Como Plugar API Real

```python
# Em services/clickmassa.py — ClickMassaConnector
def _resolve_provider(self) -> AbstractConnectorProtocol:
    if self.credentials.get("api_key"):
        return RealClickMassaProvider(self.credentials)  # Implementar
    return MockClickMassaProvider()  # Default (demo)
```

Credenciais armazenadas criptografadas por tenant em `integrations.credentials`.

---

## Roadmap Sugerido

### Fase 2 (Próxima)
- [ ] Execução real de fluxos (motor de execução passo-a-passo)
- [ ] WebSockets para execução em tempo real
- [ ] Versionamento de agentes (AgentVersion)
- [ ] Publicação de agentes com endpoint público

### Fase 3 (Crescimento)
- [ ] Marketplace de templates
- [ ] Biblioteca de skills compartilhadas
- [ ] Permissões por papel (admin/editor/viewer)
- [ ] Billing por tenant (Stripe)

### Fase 4 (Escala)
- [ ] MCP-compatible tool servers
- [ ] Voice providers (Twilio, Vapi, Bland.ai)
- [ ] Observabilidade (traces, metrics, alertas)
- [ ] White-label / multi-workspace

---

## Credenciais Demo

```
Admin: admin@clickmassa.com / admin123
```

Registre uma nova conta para ter seu próprio workspace isolado.
