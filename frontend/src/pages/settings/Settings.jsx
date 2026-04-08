import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Building2, Shield, LogOut, Workflow, CheckCircle2, AlertCircle, Save } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [n8nConfig, setN8nConfig] = useState({ api_url: "", api_key: "" });
  const [n8nStatus, setN8nStatus] = useState(null); // { configured, api_key_masked }
  const [savingN8n, setSavingN8n] = useState(false);

  useEffect(() => {
    api.get("/workspace/n8n-config").then(({ data }) => {
      setN8nStatus(data);
      setN8nConfig({ api_url: data.api_url || "", api_key: "" });
    }).catch(() => {});
  }, []);

  const handleSaveN8n = async (e) => {
    e.preventDefault();
    setSavingN8n(true);
    try {
      await api.put("/workspace/n8n-config", n8nConfig);
      const { data } = await api.get("/workspace/n8n-config");
      setN8nStatus(data);
      setN8nConfig(prev => ({ ...prev, api_key: "" }));
      toast.success("Configuração do motor de execução salva!");
    } catch {
      toast.error("Erro ao salvar configuração.");
    } finally {
      setSavingN8n(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="p-8 max-w-3xl animate-fade-in" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>Configurações</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Gerencie seu workspace e conta</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">Perfil</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Nome</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300">{user?.name}</div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Email</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300">{user?.email}</div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Papel</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">Workspace</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Tenant ID</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-500 font-mono truncate">{user?.tenant_id}</div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Plano</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300 capitalize">Trial</div>
            </div>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">Stack & Arquitetura (dev)</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Frontend", "React 19 + TailwindCSS + Shadcn/UI"],
                ["Backend", "FastAPI + Motor (MongoDB)"],
                ["Auth", "JWT (httpOnly cookies + Bearer)"],
                ["Builder", "React Flow (@xyflow/react)"],
                ["LLM Provider", "emergentintegrations — OpenAI gpt-4o (real)"],
                ["CRM Connector", "Clickmassa + outros (via integrações)"],
                ["External Connectors", "REST, Webhook, Voice (stubs prontos)"],
                ["MCP Future", "Interfaces abstratas preparadas"],
              ].map(([k, v]) => (
                <div key={k} className="bg-zinc-950 border border-zinc-800 rounded p-3">
                  <p className="text-zinc-500 mb-0.5">{k}</p>
                  <p className="text-zinc-300 font-medium">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motor de Execução */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5" data-testid="n8n-config-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Workflow className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">Motor de Execução de Agentes</h2>
            </div>
            {n8nStatus && (
              <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
                n8nStatus.configured
                  ? "text-emerald-400 border-emerald-800/50 bg-emerald-950/20"
                  : "text-zinc-500 border-zinc-700"
              }`}>
                {n8nStatus.configured
                  ? <><CheckCircle2 className="w-3 h-3" /> Configurado</>
                  : <><AlertCircle className="w-3 h-3" /> Não configurado — modo simulado</>
                }
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Configure o motor de execução para publicar e ativar seus agentes. As credenciais ficam salvas por workspace.
          </p>
          <form onSubmit={handleSaveN8n} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">URL do Servidor de Execução</label>
              <input
                type="url"
                value={n8nConfig.api_url}
                onChange={(e) => setN8nConfig(p => ({ ...p, api_url: e.target.value }))}
                placeholder="https://seu-servidor.exemplo.com"
                data-testid="n8n-url-input"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">
                Chave de Acesso
                {n8nStatus?.api_key_masked && (
                  <span className="ml-2 font-mono text-zinc-600 normal-case">(atual: {n8nStatus.api_key_masked})</span>
                )}
              </label>
              <input
                type="password"
                value={n8nConfig.api_key}
                onChange={(e) => setN8nConfig(p => ({ ...p, api_key: e.target.value }))}
                placeholder="Cole a chave para atualizar"
                data-testid="n8n-apikey-input"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={savingN8n}
              data-testid="n8n-save-btn"
              className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingN8n ? "Salvando..." : "Salvar configuração"}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-zinc-900 border border-red-900/30 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-red-400 mb-3">Zona de Perigo</h2>
          <button
            onClick={handleLogout}
            data-testid="settings-logout-btn"
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-800/50 rounded hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
