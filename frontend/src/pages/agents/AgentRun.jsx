import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow, Background, Controls, BackgroundVariant,
  useNodesState, useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "@/components/builder/nodeTypes";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Play, ChevronLeft, Square, CheckCircle2, XCircle,
  Loader2, Clock, Zap, Send, Terminal
} from "lucide-react";

const BACKEND_WS = (process.env.REACT_APP_BACKEND_URL || "")
  .replace("https://", "wss://")
  .replace("http://", "ws://");

const STATUS_STYLE = {
  running: { boxShadow: "0 0 0 2px #3b82f6, 0 0 20px rgba(59,130,246,0.35)", transition: "box-shadow 0.3s" },
  done:    { boxShadow: "0 0 0 2px #10b981, 0 0 12px rgba(16,185,129,0.25)", transition: "box-shadow 0.3s" },
  error:   { boxShadow: "0 0 0 2px #ef4444, 0 0 12px rgba(239,68,68,0.25)", transition: "box-shadow 0.3s" },
};

const STATUS_ICON = {
  running: <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />,
  done:    <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  error:   <XCircle className="w-3 h-3 text-red-400" />,
};

export default function AgentRun() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const [agent, setAgent] = useState(null);
  const [inputText, setInputText] = useState("");
  const [running, setRunning] = useState(false);
  const [nodeStatus, setNodeStatus] = useState({});     // { nodeId: 'running'|'done'|'error' }
  const [timeline, setTimeline] = useState([]);          // events for right panel
  const [finalOutput, setFinalOutput] = useState(null);
  const [executionDone, setExecutionDone] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  // Load agent
  useEffect(() => {
    if (!id) return;
    api.get(`/agents/${id}`).then(({ data }) => {
      setAgent(data);
      const flow = data.flow_definition || { nodes: [], edges: [] };
      setNodes(flow.nodes || []);
    }).catch(() => toast.error("Agente não encontrado"));
  }, [id]); // eslint-disable-line

  // Auto-scroll timeline
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // Enrich nodes with execution status styles
  const enrichedNodes = useMemo(() =>
    nodes.map(n => ({
      ...n,
      style: STATUS_STYLE[nodeStatus[n.id]] || {},
      draggable: false,
      selectable: false,
    })), [nodes, nodeStatus]);

  const stopExecution = useCallback(() => {
    wsRef.current?.close();
    setRunning(false);
  }, []);

  const startExecution = useCallback(() => {
    if (running) return stopExecution();

    // Reset state
    setNodeStatus({});
    setTimeline([]);
    setFinalOutput(null);
    setExecutionDone(false);
    setRunning(true);

    // Browser automatically sends httpOnly cookies on same-origin WebSocket — no token needed in URL
    const wsUrl = `${BACKEND_WS}/api/workspace/ws/run/${id}?input_text=${encodeURIComponent(inputText)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWsMessage(msg);
      } catch {}
    };

    ws.onerror = () => {
      toast.error("Erro na conexão WebSocket.");
      setRunning(false);
    };

    ws.onclose = () => {
      setRunning(false);
    };
  }, [running, id, inputText, stopExecution]);

  const handleWsMessage = (msg) => {
    switch (msg.type) {
      case "execution_start":
        setTimeline([{ type: "start", text: `Iniciando execução — ${msg.total_nodes} nó(s)`, ts: Date.now() }]);
        break;

      case "node_start":
        setNodeStatus(prev => ({ ...prev, [msg.node_id]: "running" }));
        setTimeline(prev => [...prev, {
          type: "node_start", nodeId: msg.node_id,
          text: `Executando: ${msg.node_name} (${msg.node_type})`, ts: Date.now(),
        }]);
        break;

      case "node_done":
        setNodeStatus(prev => ({ ...prev, [msg.node_id]: "done" }));
        setTimeline(prev => [...prev, {
          type: "node_done", nodeId: msg.node_id,
          text: `✓ ${msg.node_name} — ${msg.duration_ms}ms`,
          output: msg.output, progress: msg.progress, ts: Date.now(),
        }]);
        break;

      case "node_error":
        setNodeStatus(prev => ({ ...prev, [msg.node_id]: "error" }));
        setTimeline(prev => [...prev, {
          type: "node_error", nodeId: msg.node_id,
          text: `✗ ${msg.node_name}: ${msg.error}`, ts: Date.now(),
        }]);
        break;

      case "execution_done":
        setFinalOutput(msg.output);
        setExecutionDone(true);
        setRunning(false);
        setTimeline(prev => [...prev, {
          type: "done",
          text: `Execução concluída — ${msg.completed}/${msg.total_nodes} nós`, ts: Date.now(),
        }]);
        break;

      case "execution_error":
      case "error":
        toast.error(msg.error || "Erro na execução");
        setRunning(false);
        setTimeline(prev => [...prev, { type: "error", text: `Erro: ${msg.error}`, ts: Date.now() }]);
        break;

      default:
        break;
    }
  };

  if (!agent) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950" data-testid="agent-run-page">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-50 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/agents")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            data-testid="run-back-btn">
            <ChevronLeft className="w-4 h-4" /> Agentes
          </button>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-medium text-white">{agent.name}</span>
            <span className="text-xs text-zinc-500">— Execução ao Vivo</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/agents/${id}/edit`)}
            className="px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors"
          >
            Editar Fluxo
          </button>
          {running ? (
            <button onClick={stopExecution} data-testid="stop-execution-btn"
              className="flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-500 transition-colors">
              <Square className="w-3.5 h-3.5" /> Parar
            </button>
          ) : (
            <button onClick={startExecution} data-testid="start-execution-btn"
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-500 transition-colors">
              <Play className="w-3.5 h-3.5" /> Executar
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* React Flow canvas */}
        <div className="flex-1" data-testid="run-canvas">
          <ReactFlow
            nodes={enrichedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Right panel */}
        <div className="w-80 border-l border-zinc-800 flex flex-col bg-zinc-950 shrink-0">
          {/* Input */}
          <div className="p-3 border-b border-zinc-800 space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Entrada</p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) startExecution(); }}
              placeholder="Mensagem de entrada para o agente... (⌘+Enter para executar)"
              disabled={running}
              data-testid="run-input-textarea"
              className="w-full h-20 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 placeholder-zinc-600 px-3 py-2 resize-none focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            />
            <button
              onClick={startExecution}
              disabled={running}
              data-testid="run-submit-btn"
              className="flex items-center gap-1.5 w-full justify-center px-3 py-2 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {running
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Executando...</>
                : <><Send className="w-3 h-3" /> Enviar</>
              }
            </button>
          </div>

          {/* Node legend */}
          {running && (
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">{STATUS_ICON.running} Executando</span>
              <span className="flex items-center gap-1">{STATUS_ICON.done} Concluído</span>
              <span className="flex items-center gap-1">{STATUS_ICON.error} Erro</span>
            </div>
          )}

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1" data-testid="execution-timeline">
            {timeline.length === 0 && !running && !executionDone && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Terminal className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-600">Execute o agente para ver os resultados em tempo real</p>
              </div>
            )}
            {timeline.map((ev, i) => (
              <div key={i} className={`rounded px-2 py-1.5 text-xs ${
                ev.type === "done" ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/40" :
                ev.type === "error" || ev.type === "node_error" ? "bg-red-950/30 text-red-400 border border-red-900/40" :
                ev.type === "node_done" ? "bg-zinc-900 text-zinc-300 border border-zinc-800" :
                ev.type === "node_start" ? "bg-blue-950/20 text-blue-400 border border-blue-900/30" :
                "bg-zinc-900/50 text-zinc-500 border border-zinc-800/50"
              }`}>
                <p className="font-medium leading-relaxed">{ev.text}</p>
                {ev.output && typeof ev.output === "string" && ev.output.length > 0 && (
                  <p className="mt-0.5 text-zinc-500 line-clamp-3 font-normal">{ev.output}</p>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Final output */}
          {executionDone && finalOutput != null && (
            <div className="p-3 border-t border-zinc-800 space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saída Final
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded p-2 max-h-32 overflow-y-auto">
                <p className="text-xs text-zinc-200 whitespace-pre-wrap break-words" data-testid="run-final-output">
                  {typeof finalOutput === "string" ? finalOutput : JSON.stringify(finalOutput, null, 2)}
                </p>
              </div>
              <button
                onClick={() => { setNodeStatus({}); setTimeline([]); setFinalOutput(null); setExecutionDone(false); }}
                className="w-full px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors"
              >
                Limpar e Executar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
