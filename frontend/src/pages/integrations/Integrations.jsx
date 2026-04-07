import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plug, Plus, CheckCircle, XCircle, Clock, RefreshCw, X, Workflow } from "lucide-react";

const STATUS_MAP = {
  connected: { icon: CheckCircle, label: "Conectado", cls: "text-emerald-400" },
  disconnected: { icon: XCircle, label: "Desconectado", cls: "text-zinc-500" },
  error: { icon: XCircle, label: "Erro", cls: "text-red-400" },
};

const EMPTY_FORM = { provider: "clickmassa", name: "Click Massa Principal", credentials: {}, config: {} };

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/integrations")
      .then(({ data }) => setIntegrations(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const testConnection = async (id) => {
    setTesting((t) => ({ ...t, [id]: true }));
    try {
      const { data } = await api.post(`/integrations/${id}/test`);
      setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, status: data.status } : i));
    } catch (err) {
      console.error(err);
    } finally {
      setTesting((t) => ({ ...t, [id]: false }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/integrations", form);
      setIntegrations((prev) => [...prev, data]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteIntegration = async (id) => {
    if (!window.confirm("Excluir esta integração?")) return;
    await api.delete(`/integrations/${id}`);
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl animate-fade-in" data-testid="integrations-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>Integrações</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Gerencie conexões com serviços externos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          data-testid="add-integration-btn"
          className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Integração
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />)}
        </div>
      ) : integrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Plug className="w-6 h-6 text-zinc-600" />
          </div>
          <h3 className="text-white font-medium mb-1">Nenhuma integração configurada</h3>
          <p className="text-sm text-zinc-500 mb-4">Conecte o Click Massa e outras ferramentas</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {integrations.map((integration) => {
            const s = STATUS_MAP[integration.status] || STATUS_MAP.disconnected;
            const StatusIcon = s.icon;
            return (
              <div
                key={integration.id}
                data-testid={`integration-card-${integration.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusIcon className={`w-3.5 h-3.5 ${s.cls}`} />
                        <span className={`text-xs ${s.cls}`}>{s.label}</span>
                        <span className="text-zinc-700 mx-1">·</span>
                        <span className="text-xs text-zinc-500 capitalize">{integration.provider}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testConnection(integration.id)}
                      disabled={testing[integration.id]}
                      data-testid={`integration-test-btn-${integration.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${testing[integration.id] ? "animate-spin" : ""}`} />
                      {testing[integration.id] ? "Testando..." : "Testar Conexão"}
                    </button>
                    <button
                      onClick={() => deleteIntegration(integration.id)}
                      data-testid={`integration-delete-btn-${integration.id}`}
                      className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {integration.last_tested && (
                  <p className="text-xs text-zinc-600 mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Testado em: {new Date(integration.last_tested).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-md shadow-2xl" data-testid="integration-form-modal">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Nova Integração</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-zinc-500 hover:text-white" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 uppercase font-semibold tracking-wider mb-1.5">Provedor</label>
                <select
                  value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                >
                  <option value="clickmassa">Click Massa</option>
                  <option value="webhook">Webhook</option>
                  <option value="rest">REST API</option>
                  <option value="voice">Voice Provider</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 uppercase font-semibold tracking-wider mb-1.5">Nome</label>
                <input
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="Nome da integração"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm text-zinc-400 border border-zinc-700 rounded hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} data-testid="integration-save-btn"
                  className="flex-1 py-2 text-sm bg-white text-zinc-950 font-semibold rounded hover:bg-zinc-100 transition-colors disabled:opacity-50">
                  {saving ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
