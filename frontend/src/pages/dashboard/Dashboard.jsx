import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Bot, FileText, Zap, Plug, Activity, Plus, CheckCircle, Clock, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

const StatusBadge = ({ status }) => {
  const map = {
    active: { color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/50", label: "Ativo" },
    draft: { color: "text-zinc-400 bg-zinc-900 border-zinc-700", label: "Rascunho" },
    inactive: { color: "text-zinc-500 bg-zinc-900 border-zinc-800", label: "Inativo" },
    success: { color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/50", label: "Sucesso" },
    error: { color: "text-red-400 bg-red-950/50 border-red-800/50", label: "Erro" },
    running: { color: "text-blue-400 bg-blue-950/50 border-blue-800/50", label: "Rodando" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${s.color}`}>{s.label}</span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, testId }) => (
  <div
    data-testid={testId}
    className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
    </div>
    <p className="text-3xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>{value}</p>
    {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>
            Bom dia, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Visão geral do seu workspace</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/agents/new"
            data-testid="dashboard-create-agent-btn"
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-md text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Agente
          </Link>
          <Link
            to="/create"
            data-testid="dashboard-create-ai-btn"
            className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Criar com IA
          </Link>
        </div>
      </div>

      {/* Hero CTA — shown when 0 agents */}
      {!loading && stats?.agents_count === 0 && (
        <Link
          to="/create"
          data-testid="dashboard-hero-cta"
          className="block mb-8 p-6 bg-gradient-to-br from-violet-950/40 to-zinc-900 border border-violet-800/40 rounded-xl hover:border-violet-700/60 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span className="text-sm font-semibold text-violet-300">Comece agora</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Crie seu primeiro agente com IA</h2>
              <p className="text-sm text-zinc-400">
                Descreva o que você quer em português. A IA monta o workflow automaticamente.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-4" />
          </div>
        </Link>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          <StatCard icon={Bot} label="Agentes" value={stats?.agents_count ?? 0} sub="no seu workspace" testId="dashboard-stats-agents" />
          <StatCard icon={FileText} label="Templates" value={stats?.templates_count ?? 0} sub="disponíveis" testId="dashboard-stats-templates" />
          <StatCard icon={Zap} label="Skills" value={stats?.skills_count ?? 0} sub="configuradas" testId="dashboard-stats-skills" />
          <StatCard
            icon={Plug}
            label="Integrações"
            value={stats?.integrations_count ?? 0}
            sub={`${stats?.active_integrations ?? 0} ativa(s)`}
            testId="dashboard-stats-integrations"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Agents */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg" data-testid="dashboard-recent-agents">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white">Agentes Recentes</h2>
            <Link to="/agents" className="text-xs text-zinc-500 hover:text-white transition-colors">Ver todos</Link>
          </div>
          <div className="divide-y divide-zinc-800">
            {stats?.recent_agents?.length === 0 && (
              <div className="px-5 py-8 text-center">
                <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Nenhum agente criado ainda</p>
                <Link to="/agents/new" className="text-xs text-zinc-400 hover:text-white mt-1 inline-block">Criar primeiro agente</Link>
              </div>
            )}
            {stats?.recent_agents?.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{agent.description || "Sem descrição"}</p>
                  </div>
                </div>
                <div className="shrink-0 ml-3">
                  <StatusBadge status={agent.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Executions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg" data-testid="dashboard-recent-executions">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white">Últimas Execuções</h2>
            <Link to="/executions" className="text-xs text-zinc-500 hover:text-white transition-colors">Ver todas</Link>
          </div>
          <div className="divide-y divide-zinc-800">
            {stats?.recent_executions?.length === 0 && (
              <div className="px-5 py-8 text-center">
                <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Nenhuma execução registrada</p>
              </div>
            )}
            {stats?.recent_executions?.map((exec) => (
              <div key={exec.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    exec.status === "success" ? "bg-emerald-400" :
                    exec.status === "error" ? "bg-red-400" : "bg-zinc-400"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{exec.agent_name}</p>
                    <p className="text-xs text-zinc-500">{exec.duration_ms}ms</p>
                  </div>
                </div>
                <StatusBadge status={exec.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
