import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Activity, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";

export default function Executions() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get("/executions")
      .then(({ data }) => setExecutions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="p-8 max-w-5xl animate-fade-in" data-testid="executions-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>Execuções</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Histórico de execuções dos seus agentes</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded animate-pulse" />)}
        </div>
      ) : executions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-zinc-600" />
          </div>
          <h3 className="text-white font-medium mb-1">Nenhuma execução ainda</h3>
          <p className="text-sm text-zinc-500">Execute um agente para ver o histórico aqui</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {executions.map((exec) => (
            <div
              key={exec.id}
              data-testid={`execution-row-${exec.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden hover:border-zinc-700 transition-colors"
            >
              <button
                className="flex items-center gap-4 w-full px-4 py-3 text-left"
                onClick={() => toggle(exec.id)}
                data-testid={`execution-toggle-${exec.id}`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  exec.status === "success" ? "bg-emerald-400" :
                  exec.status === "error" ? "bg-red-400" : "bg-zinc-400"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{exec.agent_name}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-zinc-500 font-mono">{exec.duration_ms}ms</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
                    exec.status === "success" ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/50" :
                    exec.status === "error" ? "text-red-400 bg-red-950/40 border-red-800/50" :
                    "text-zinc-400 bg-zinc-900 border-zinc-700"
                  }`}>
                    {exec.status === "success" ? "Sucesso" : exec.status === "error" ? "Erro" : exec.status}
                  </span>
                  <span className="text-xs text-zinc-500">{new Date(exec.created_at).toLocaleString("pt-BR")}</span>
                  {expanded[exec.id] ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                </div>
              </button>

              {expanded[exec.id] && (
                <div className="border-t border-zinc-800 px-4 py-3 bg-black/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Input</p>
                      <pre className="text-xs text-zinc-300 font-mono bg-zinc-950 border border-zinc-800 rounded p-3 overflow-auto max-h-32">
                        {JSON.stringify(exec.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Output</p>
                      <pre className="text-xs text-zinc-300 font-mono bg-zinc-950 border border-zinc-800 rounded p-3 overflow-auto max-h-32">
                        {JSON.stringify(exec.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
