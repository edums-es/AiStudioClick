import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Bot, Plus, Edit2, Trash2, Play, Zap } from "lucide-react";

const STATUS_MAP = {
  active: { label: "Ativo", cls: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50" },
  draft: { label: "Rascunho", cls: "text-zinc-400 bg-zinc-900 border-zinc-700" },
  inactive: { label: "Inativo", cls: "text-zinc-500 bg-zinc-900 border-zinc-800" },
};

export default function AgentsList() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/agents")
      .then(({ data }) => setAgents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteAgent = async (id) => {
    if (!window.confirm("Excluir este agente?")) return;
    await api.delete(`/agents/${id}`);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-8 max-w-6xl animate-fade-in" data-testid="agents-list">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>
            Agentes
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Gerencie seus agentes de IA</p>
        </div>
        <Link
          to="/agents/new"
          data-testid="create-agent-btn"
          className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Agente
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg h-36 animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-zinc-600" />
          </div>
          <h3 className="text-white font-medium mb-1" style={{fontFamily: 'Cabinet Grotesk'}}>Nenhum agente criado</h3>
          <p className="text-sm text-zinc-500 mb-4">Comece criando seu primeiro agente de IA</p>
          <Link
            to="/agents/new"
            className="px-4 py-2 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            Criar primeiro agente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {agents.map((agent) => {
            const s = STATUS_MAP[agent.status] || STATUS_MAP.draft;
            return (
              <div
                key={agent.id}
                data-testid={`agent-card-${agent.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center">
                    <Bot className="w-4.5 h-4.5 text-zinc-400" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${s.cls}`}>{s.label}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 truncate">{agent.name}</h3>
                <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{agent.description || "Sem descrição"}</p>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/agents/${agent.id}/edit`}
                    data-testid={`edit-agent-${agent.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Editar
                  </Link>
                  <button
                    onClick={() => navigate(`/agents/${agent.id}/run`)}
                    data-testid={`run-agent-${agent.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-800/50 rounded hover:bg-emerald-950/30 transition-colors"
                  >
                    <Zap className="w-3 h-3" /> Executar ao Vivo
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    data-testid={`delete-agent-${agent.id}`}
                    className="ml-auto p-1.5 text-zinc-600 hover:text-red-400 transition-colors rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
