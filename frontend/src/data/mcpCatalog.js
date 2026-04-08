/**
 * Catálogo estático de MCPs (Model Context Protocol) e integrações populares.
 * Estrutura preparada para conectar a um registry real na Fase 2.
 */

export const MCP_CATEGORIES = [
  "Todos", "CRM & Vendas", "Comunicação", "Produtividade", "IA & LLMs",
  "Calendário & Agenda", "Dados & Analytics", "Desenvolvimento", "E-commerce", "Voz & Telefonia",
];

export const MCP_CATALOG = [
  // ── CRM & Vendas ──────────────────────────────────────────────────
  {
    id: "clickmassa",
    name: "CRM Clickmassa",
    description: "Gerencie contatos, aplique etiquetas, envie mensagens e acompanhe leads diretamente no Clickmassa.",
    category: "CRM & Vendas",
    icon: "🧲",
    popular: true,
    official: true,
    fields: [
      { key: "server_url", label: "URL do Servidor", type: "url", required: true, placeholder: "https://seu-clickmassa.com" },
      { key: "api_token", label: "Token da API", type: "password", required: true, placeholder: "Seu token de API" },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Crie e atualize contatos, deals e tarefas no HubSpot CRM automaticamente.",
    category: "CRM & Vendas",
    icon: "🧡",
    popular: true,
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true, placeholder: "seu-api-key-hubspot" },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Integre com oportunidades, contas e contatos do Salesforce.",
    category: "CRM & Vendas",
    icon: "☁️",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", required: true },
      { key: "instance_url", label: "Instance URL", type: "url", required: true },
    ],
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    description: "Gerencie pipeline de vendas, negócios e contatos no Pipedrive.",
    category: "CRM & Vendas",
    icon: "🟢",
    fields: [
      { key: "api_token", label: "API Token", type: "password", required: true },
    ],
  },

  // ── Comunicação ───────────────────────────────────────────────────
  {
    id: "whatsapp-evolution",
    name: "WhatsApp (Evolution API)",
    description: "Envie e receba mensagens WhatsApp via Evolution API. Suporta texto, áudio e mídia.",
    category: "Comunicação",
    icon: "💬",
    popular: true,
    fields: [
      { key: "server_url", label: "URL do Servidor", type: "url", required: true, placeholder: "https://seu-evolution.com" },
      { key: "api_token", label: "API Token", type: "password", required: true },
      { key: "instance", label: "Nome da Instância", type: "text", required: true, placeholder: "minha-empresa" },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Envie mensagens, notificações e alertas para canais e usuários do Slack.",
    category: "Comunicação",
    icon: "💼",
    popular: true,
    fields: [
      { key: "bot_token", label: "Bot Token", type: "password", required: true, placeholder: "xoxb-..." },
      { key: "webhook_url", label: "Webhook URL", type: "url", required: false },
    ],
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Envie mensagens e gerencie bots no Telegram.",
    category: "Comunicação",
    icon: "✈️",
    fields: [
      { key: "bot_token", label: "Bot Token", type: "password", required: true, placeholder: "000000:AAxxxxxx" },
      { key: "chat_id", label: "Chat ID padrão", type: "text", required: false },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Envie mensagens para servidores e canais do Discord.",
    category: "Comunicação",
    icon: "🎮",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "url", required: true },
      { key: "bot_token", label: "Bot Token (opcional)", type: "password", required: false },
    ],
  },
  {
    id: "email-smtp",
    name: "E-mail (SMTP)",
    description: "Envie e-mails transacionais via qualquer servidor SMTP (Gmail, SendGrid, etc.).",
    category: "Comunicação",
    icon: "📧",
    fields: [
      { key: "host", label: "Servidor SMTP", type: "text", required: true, placeholder: "smtp.gmail.com" },
      { key: "port", label: "Porta", type: "text", required: true, placeholder: "587" },
      { key: "user", label: "Usuário", type: "email", required: true },
      { key: "password", label: "Senha / App Password", type: "password", required: true },
    ],
  },

  // ── Produtividade ─────────────────────────────────────────────────
  {
    id: "notion",
    name: "Notion",
    description: "Leia, crie e atualize páginas e bancos de dados do Notion automaticamente.",
    category: "Produtividade",
    icon: "📓",
    popular: true,
    fields: [
      { key: "integration_token", label: "Integration Token", type: "password", required: true, placeholder: "secret_..." },
      { key: "database_id", label: "Database ID (padrão)", type: "text", required: false },
    ],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Leia, grave e atualize planilhas no Google Sheets em tempo real.",
    category: "Produtividade",
    icon: "📊",
    popular: true,
    fields: [
      { key: "spreadsheet_id", label: "ID da Planilha", type: "text", required: true },
      { key: "service_account_json", label: "Service Account JSON", type: "password", required: true, placeholder: "Cole o JSON aqui" },
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Faça upload, leitura e gerenciamento de arquivos no Google Drive.",
    category: "Produtividade",
    icon: "💾",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", required: true },
    ],
  },
  {
    id: "trello",
    name: "Trello",
    description: "Crie cards, mova entre listas e gerencie boards do Trello.",
    category: "Produtividade",
    icon: "📋",
    fields: [
      { key: "api_key", label: "API Key", type: "text", required: true },
      { key: "token", label: "Token", type: "password", required: true },
    ],
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Crie, leia e atualize registros em bases do Airtable.",
    category: "Produtividade",
    icon: "🗂️",
    fields: [
      { key: "api_key", label: "Personal Access Token", type: "password", required: true },
      { key: "base_id", label: "Base ID", type: "text", required: true, placeholder: "appXXXXXXXX" },
    ],
  },

  // ── IA & LLMs ─────────────────────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    description: "Acesse GPT-4o, Whisper, DALL-E e outros modelos da OpenAI.",
    category: "IA & LLMs",
    icon: "🤖",
    popular: true,
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true, placeholder: "sk-..." },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Use os modelos Claude Sonnet e Opus para tarefas de análise e geração de texto.",
    category: "IA & LLMs",
    icon: "🔶",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true, placeholder: "sk-ant-..." },
    ],
  },
  {
    id: "groq",
    name: "Groq (LLaMA rápido)",
    description: "Execute modelos LLaMA com velocidade extrema via API Groq.",
    category: "IA & LLMs",
    icon: "⚡",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },

  // ── Calendário & Agenda ────────────────────────────────────────────
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Crie, consulte, edite e cancele eventos no Google Calendar.",
    category: "Calendário & Agenda",
    icon: "📅",
    popular: true,
    fields: [
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", required: true },
      { key: "calendar_id", label: "Calendar ID", type: "text", required: false, placeholder: "primary" },
    ],
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Gerencie agendamentos e disponibilidade via Calendly.",
    category: "Calendário & Agenda",
    icon: "📆",
    fields: [
      { key: "access_token", label: "Personal Access Token", type: "password", required: true },
    ],
  },

  // ── Dados & Analytics ─────────────────────────────────────────────
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Execute queries e gerencie dados em bancos PostgreSQL.",
    category: "Dados & Analytics",
    icon: "🐘",
    fields: [
      { key: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
      { key: "port", label: "Porta", type: "text", required: true, placeholder: "5432" },
      { key: "database", label: "Database", type: "text", required: true },
      { key: "user", label: "Usuário", type: "text", required: true },
      { key: "password", label: "Senha", type: "password", required: true },
    ],
  },
  {
    id: "mysql",
    name: "MySQL / MariaDB",
    description: "Conecte e execute operações em bancos MySQL ou MariaDB.",
    category: "Dados & Analytics",
    icon: "🐬",
    fields: [
      { key: "host", label: "Host", type: "text", required: true },
      { key: "database", label: "Database", type: "text", required: true },
      { key: "user", label: "Usuário", type: "text", required: true },
      { key: "password", label: "Senha", type: "password", required: true },
    ],
  },

  // ── Desenvolvimento ────────────────────────────────────────────────
  {
    id: "github",
    name: "GitHub",
    description: "Gerencie issues, PRs, repositórios e notificações do GitHub.",
    category: "Desenvolvimento",
    icon: "🐙",
    popular: true,
    fields: [
      { key: "access_token", label: "Personal Access Token", type: "password", required: true, placeholder: "ghp_..." },
    ],
  },
  {
    id: "linear",
    name: "Linear",
    description: "Crie e atualize issues e projetos no Linear.",
    category: "Desenvolvimento",
    icon: "📐",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
    ],
  },
  {
    id: "jira",
    name: "Jira",
    description: "Gerencie issues, sprints e projetos no Atlassian Jira.",
    category: "Desenvolvimento",
    icon: "🔵",
    fields: [
      { key: "site_url", label: "Site URL", type: "url", required: true, placeholder: "https://sua-empresa.atlassian.net" },
      { key: "email", label: "E-mail da conta", type: "email", required: true },
      { key: "api_token", label: "API Token", type: "password", required: true },
    ],
  },

  // ── E-commerce ────────────────────────────────────────────────────
  {
    id: "shopify",
    name: "Shopify",
    description: "Gerencie pedidos, produtos e clientes da sua loja Shopify.",
    category: "E-commerce",
    icon: "🛍️",
    fields: [
      { key: "shop_url", label: "URL da Loja", type: "url", required: true, placeholder: "https://sua-loja.myshopify.com" },
      { key: "access_token", label: "Access Token", type: "password", required: true },
    ],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Integre pedidos, produtos e clientes do WooCommerce.",
    category: "E-commerce",
    icon: "🛒",
    fields: [
      { key: "site_url", label: "URL do Site", type: "url", required: true },
      { key: "consumer_key", label: "Consumer Key", type: "text", required: true },
      { key: "consumer_secret", label: "Consumer Secret", type: "password", required: true },
    ],
  },

  // ── Voz & Telefonia ────────────────────────────────────────────────
  {
    id: "vapi",
    name: "Vapi.ai",
    description: "Crie assistentes de voz de IA para fazer e receber ligações automaticamente.",
    category: "Voz & Telefonia",
    icon: "🎙️",
    popular: true,
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true },
      { key: "phone_number_id", label: "Phone Number ID", type: "text", required: false },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Envie SMS, faça chamadas de voz e WhatsApp via Twilio.",
    category: "Voz & Telefonia",
    icon: "📞",
    fields: [
      { key: "account_sid", label: "Account SID", type: "text", required: true },
      { key: "auth_token", label: "Auth Token", type: "password", required: true },
      { key: "from_number", label: "Número de Origem", type: "text", required: true, placeholder: "+5511999990000" },
    ],
  },
];
