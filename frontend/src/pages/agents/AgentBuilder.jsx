import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "@/components/builder/nodeTypes";
import api from "@/lib/api";
import NodePanel from "@/components/builder/NodePanel";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Save, Plus, ChevronLeft, Trash2, Zap, MessageSquare,
  GitBranch, Clock, Globe, Workflow, Cpu, Flag, Rocket,
  Calendar, Bot, Code, Database, Webhook, CheckCircle, AlertCircle,
  ExternalLink, RefreshCw
} from "lucide-react";

const NODE_PALETTE = [
  { type: "trigger",          label: "Gatilho / Início",   icon: Webhook,   n8n: "webhook" },
  { type: "schedule_trigger", label: "Agendamento",         icon: Calendar,  n8n: "scheduleTrigger" },
  { type: "ai_agent",         label: "Agente IA",           icon: Bot,       n8n: "openAi" },
  { type: "prompt",           label: "Agente LLM",          icon: MessageSquare, n8n: "langchain.agent" },
  { type: "condition",        label: "Se / Então",          icon: GitBranch, n8n: "if" },
  { type: "delay",            label: "Aguardar",            icon: Clock,     n8n: "wait" },
  { type: "http_request",     label: "Requisição Externa",  icon: Globe,     n8n: "httpRequest" },
  { type: "clickmassa",       label: "Click Massa",         icon: Workflow,  n8n: "httpRequest" },
  { type: "skill_executor",   label: "Habilidade IA",       icon: Cpu,       n8n: "langchain.agent" },
  { type: "code",             label: "Código",              icon: Code,      n8n: "code" },
  { type: "set_variables",    label: "Transformar Dados",   icon: Database,  n8n: "set" },
  { type: "output",           label: "Finalizar",           icon: Flag,      n8n: "set" },
];

const DEPLOY_STATUS = {
  not_deployed:   { label: "Não deployado",       cls: "text-zinc-500 border-zinc-700",         icon: null },
  pending:        { label: "Pendente (n8n offline)", cls: "text-yellow-500 border-yellow-800/50", icon: AlertCircle },
  deployed:       { label: "Deployado",           cls: "text-blue-400 border-blue-800/50",      icon: CheckCircle },
  active:         { label: "Ativo no n8n",        cls: "text-emerald-400 border-emerald-800/50", icon: CheckCircle },
  error:          { label: "Erro no deploy",      cls: "text-red-400 border-red-800/50",        icon: AlertCircle },
  not_configured: { label: "n8n não configurado", cls: "text-zinc-500 border-zinc-700",         icon: AlertCircle },
};

export default function AgentBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [agent, setAgent] = useState({ name: "Novo Agente", description: "" });
  const [selectedNode, setSelectedNode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [blueprintId, setBlueprintId] = useState(null);
  const [deployStatus, setDeployStatus] = useState("not_deployed");
  const [deployData, setDeployData] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [showDeployPanel, setShowDeployPanel] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load agent
  useEffect(() => {
    if (id) {
      api.get(`/agents/${id}`).then(({ data }) => {
        setAgent(data);
        const flow = data.flow_definition || { nodes: [], edges: [] };
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        if (data.blueprint_id) {
          setBlueprintId(data.blueprint_id);
          loadDeployStatus(data.blueprint_id);
        }
      }).catch(() => toast.error("Erro ao carregar o agente."));
    } else {
      setNodes([{
        id: "start-1", type: "trigger", position: { x: 100, y: 200 },
        data: { label: "Gatilho / Início", path: "webhook" },
      }]);
    }
  }, [id]); // eslint-disable-line

  const loadDeployStatus = async (bpId) => {
    try {
      const { data } = await api.get(`/n8n/deployments/${bpId}`);
      setDeployStatus(data.status || "not_deployed");
      setDeployData(data);
    } catch {}
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const addNode = (type) => {
    const palette = NODE_PALETTE.find((n) => n.type === type);
    setNodes((nds) => [...nds, {
      id: `${type}-${Date.now()}`, type,
      position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 150 },
      data: { label: palette?.label || type },
    }]);
    setShowPalette(false);
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n))
    );
    setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...newData } } : prev);
  };

  const confirmDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    setShowDeleteDialog(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const flow = { nodes, edges };
      let savedAgent;
      if (id) {
        const { data } = await api.put(`/agents/${id}`, { ...agent, flow_definition: flow });
        savedAgent = data;
      } else {
        const { data } = await api.post("/agents", { ...agent, flow_definition: flow });
        savedAgent = data;
        navigate(`/agents/${data.id}/edit`, { replace: true });
      }
      const { data: bp } = await api.post("/n8n/blueprints", {
        name: agent.name, description: agent.description,
        nodes, edges, agent_id: savedAgent.id,
      });
      setBlueprintId(bp.id);
      toast.success("Agente salvo com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar agente. Verifique sua conexão.");
      if (process.env.NODE_ENV === "development") console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async (activate = false) => {
    if (!blueprintId) {
      toast.error("Salve o agente antes de fazer o deploy.");
      return;
    }
    setDeploying(true);
    try {
      const { data } = await api.post("/n8n/deploy", { blueprint_id: blueprintId, activate });
      setDeployStatus(data.status || "deployed");
      setDeployData(data);
      if (data.success) {
        toast.success(data.message || "Deploy realizado com sucesso!");
      } else {
        toast.warning(data.message || "Deploy salvo, aguardando configuração do n8n.");
      }
    } catch (err) {
      setDeployStatus("error");
      toast.error(err.response?.data?.detail || "Erro no deploy.");
    } finally {
      setDeploying(false);
    }
  };

  const statusCfg = DEPLOY_STATUS[deployStatus] || DEPLOY_STATUS.not_deployed;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="flex flex-col h-screen bg-zinc-950" data-testid="agent-builder">
      {/* Confirm delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover nó?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. O nó e suas conexões serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNode}
              className="bg-red-600 text-white hover:bg-red-500"
              data-testid="confirm-delete-node-btn"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-50 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/agents")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            data-testid="builder-back-btn">
            <ChevronLeft className="w-4 h-4" /><span>Agentes</span>
          </button>
          <span className="text-zinc-700">/</span>
          <input value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
            className="bg-transparent text-sm font-medium text-white focus:outline-none border-b border-transparent focus:border-zinc-600 px-1 py-0.5 max-w-52"
            data-testid="builder-agent-name-input" />
        </div>

        <div className="flex items-center gap-2">
          {/* Deploy status badge */}
          <button
            onClick={() => setShowDeployPanel(!showDeployPanel)}
            data-testid="deploy-status-btn"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-md transition-colors ${statusCfg.cls} hover:opacity-80`}
          >
            {StatusIcon && <StatusIcon className="w-3 h-3" />}
            {statusCfg.label}
          </button>

          {/* Add node */}
          <div className="relative">
            <button onClick={() => setShowPalette(!showPalette)} data-testid="add-node-button"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 border border-zinc-700 rounded-md hover:text-white hover:border-zinc-500 transition-colors">
              <Plus className="w-4 h-4" /> Adicionar nó
            </button>
            {showPalette && (
              <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 w-52">
                <div className="px-3 py-1.5 border-b border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Nós disponíveis</p>
                </div>
                {NODE_PALETTE.map(({ type, label, icon: Icon }) => (
                  <button key={type} onClick={() => addNode(type)} data-testid={`palette-node-${type}`}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedNode && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              data-testid="delete-node-btn"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 border border-red-800/50 rounded-md hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button onClick={handleSave} disabled={saving} data-testid="builder-save-button"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-200 border border-zinc-600 rounded-md hover:text-white hover:border-zinc-400 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "Salvando..." : "Salvar"}
          </button>

          <button onClick={() => handleDeploy(false)} disabled={deploying} data-testid="deploy-n8n-button"
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50">
            {deploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {deploying ? "Enviando..." : "Deploy n8n"}
          </button>
        </div>
      </div>

      {/* Deploy Panel */}
      {showDeployPanel && (
        <div className="border-b border-zinc-800 bg-zinc-950/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-zinc-300">Status do Deploy</p>
              <p className={`text-xs mt-0.5 ${statusCfg.cls}`}>{statusCfg.label}</p>
            </div>
            {deployData?.n8n_workflow_id && (
              <div>
                <p className="text-xs text-zinc-500">Workflow ID</p>
                <p className="text-xs font-mono text-zinc-300">{deployData.n8n_workflow_id}</p>
              </div>
            )}
            {deployData?.n8n_url && (
              <a href={deployData.n8n_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                <ExternalLink className="w-3 h-3" /> Abrir no n8n
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleDeploy(true)} disabled={deploying || !blueprintId}
              data-testid="deploy-activate-btn"
              className="px-3 py-1.5 text-xs text-emerald-400 border border-emerald-800/50 rounded hover:bg-emerald-950/30 transition-colors disabled:opacity-40">
              Deploy + Ativar
            </button>
          </div>
        </div>
      )}

      {/* Canvas + Side Panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1" data-testid="agent-builder-canvas">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
            nodeTypes={nodeTypes} fitView deleteKeyCode="Delete"
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
            <Controls showInteractive={false} />
            <MiniMap nodeColor={() => "#3f3f46"} maskColor="rgba(9,9,11,0.7)"
              style={{ background: "rgba(9,9,11,0.9)" }} />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodePanel node={selectedNode} onUpdate={updateNodeData} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
  );
}
