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
import {
  Play, Save, Plus, ChevronLeft, Trash2, Zap, MessageSquare,
  GitBranch, Clock, Globe, Workflow, Cpu, Flag
} from "lucide-react";

const NODE_PALETTE = [
  { type: "trigger", label: "Trigger", icon: Zap },
  { type: "prompt", label: "Prompt", icon: MessageSquare },
  { type: "condition", label: "Condição", icon: GitBranch },
  { type: "delay", label: "Aguardar", icon: Clock },
  { type: "http_request", label: "HTTP", icon: Globe },
  { type: "clickmassa", label: "Click Massa", icon: Workflow },
  { type: "skill_executor", label: "Skill", icon: Cpu },
  { type: "output", label: "Saída", icon: Flag },
];

export default function AgentBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [agent, setAgent] = useState({ name: "Novo Agente", description: "" });
  const [selectedNode, setSelectedNode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/agents/${id}`).then(({ data }) => {
        setAgent(data);
        const flow = data.flow_definition || { nodes: [], edges: [] };
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
      });
    } else {
      // Default start node
      setNodes([
        { id: "start-1", type: "start", position: { x: 100, y: 200 }, data: { label: "Início", description: "Ponto de entrada do agente" } }
      ]);
    }
  }, [id]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const addNode = (type) => {
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 150 },
      data: { label: NODE_PALETTE.find((n) => n.type === type)?.label || type },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowPalette(false);
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n))
    );
    setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...newData } } : prev);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const flow = { nodes, edges };
      if (id) {
        await api.put(`/agents/${id}`, { ...agent, flow_definition: flow });
      } else {
        const { data } = await api.post("/agents", { ...agent, flow_definition: flow });
        navigate(`/agents/${data.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950" data-testid="agent-builder">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/agents")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            data-testid="builder-back-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Agentes</span>
          </button>
          <span className="text-zinc-700">/</span>
          <input
            value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
            className="bg-transparent text-sm font-medium text-white focus:outline-none border-b border-transparent focus:border-zinc-600 px-1 py-0.5"
            data-testid="builder-agent-name-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowPalette(!showPalette)}
              data-testid="add-node-button"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 border border-zinc-700 rounded-md hover:text-white hover:border-zinc-500 transition-colors"
            >
              <Plus className="w-4 h-4" /> Adicionar nó
            </button>
            {showPalette && (
              <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 w-40">
                {NODE_PALETTE.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => addNode(type)}
                    data-testid={`palette-node-${type}`}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedNode && (
            <button
              onClick={deleteSelectedNode}
              data-testid="delete-node-btn"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 border border-red-800/50 rounded-md hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="builder-save-button"
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Canvas + Side Panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1" data-testid="agent-builder-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={() => "#3f3f46"}
              maskColor="rgba(9,9,11,0.7)"
              style={{ background: "rgba(9,9,11,0.9)" }}
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodePanel
            node={selectedNode}
            onUpdate={updateNodeData}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
