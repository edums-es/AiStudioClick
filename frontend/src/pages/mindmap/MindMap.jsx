import { useEffect, useState, useCallback } from "react";
import {
  ReactFlow, Background, Controls, addEdge, useNodesState, useEdgesState, BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Handle, Position } from "@xyflow/react";
import api from "@/lib/api";
import { Plus, Save, X, Map, Lightbulb, Target, AlertCircle, Zap, Eye, ArrowRight } from "lucide-react";

// Mind map node types
const MIND_NODE_TYPES_CONFIG = [
  { type: "idea", label: "Ideia", icon: Lightbulb, border: "border-yellow-700/60", icon_cls: "text-yellow-400 bg-yellow-950/60" },
  { type: "stage", label: "Etapa", icon: ArrowRight, border: "border-blue-700/60", icon_cls: "text-blue-400 bg-blue-950/60" },
  { type: "pain", label: "Dor", icon: AlertCircle, border: "border-red-700/60", icon_cls: "text-red-400 bg-red-950/60" },
  { type: "goal", label: "Objetivo", icon: Target, border: "border-emerald-700/60", icon_cls: "text-emerald-400 bg-emerald-950/60" },
  { type: "action", label: "Ação", icon: Zap, border: "border-purple-700/60", icon_cls: "text-purple-400 bg-purple-950/60" },
  { type: "observation", label: "Observação", icon: Eye, border: "border-zinc-600", icon_cls: "text-zinc-400 bg-zinc-800" },
];

function MindNode({ data, type, selected }) {
  const cfg = MIND_NODE_TYPES_CONFIG.find((c) => c.type === type) || MIND_NODE_TYPES_CONFIG[0];
  const Icon = cfg.icon;
  return (
    <div className={`bg-zinc-900 border rounded-md px-4 py-3 min-w-[140px] max-w-[200px] transition-all ${
      selected ? "border-white shadow-[0_0_10px_rgba(255,255,255,0.07)]" : cfg.border
    } hover:border-zinc-500`}>
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${cfg.icon_cls}`}>
          <Icon className="w-2.5 h-2.5" />
        </div>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{cfg.label}</span>
      </div>
      <p className="text-xs text-white">{data?.label || "..."}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const mindNodeTypes = Object.fromEntries(
  MIND_NODE_TYPES_CONFIG.map(({ type }) => [
    type,
    (props) => <MindNode {...props} type={type} />,
  ])
);

export default function MindMap() {
  const [maps, setMaps] = useState([]);
  const [current, setCurrent] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mapName, setMapName] = useState("Novo Mapa");
  const [saving, setSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // Load first map or show blank canvas on mount
  useEffect(() => {
    api.get("/mindmap").then(({ data }) => {
      setMaps(data);
      if (data.length > 0) {
        loadMap(data[0]);
      } else {
        // Default starter node
        setNodes([
          { id: "idea-1", type: "idea", position: { x: 400, y: 200 }, data: { label: "Minha Ideia Principal" } },
          { id: "stage-1", type: "stage", position: { x: 650, y: 150 }, data: { label: "Etapa 1" } },
          { id: "pain-1", type: "pain", position: { x: 650, y: 280 }, data: { label: "Dor do cliente" } },
        ]);
        setEdges([
          { id: "e1", source: "idea-1", target: "stage-1", type: "smoothstep" },
          { id: "e2", source: "idea-1", target: "pain-1", type: "smoothstep" },
        ]);
      }
    }).catch(console.error);
  }, []);

  const loadMap = (map) => {
    setCurrent(map);
    setMapName(map.name);
    setNodes(map.nodes || []);
    setEdges(map.edges || []);
  };

  const newMap = () => {
    setCurrent(null);
    setMapName("Novo Mapa");
    setNodes([
      { id: "idea-1", type: "idea", position: { x: 300, y: 200 }, data: { label: "Minha Ideia Principal" } }
    ]);
    setEdges([]);
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds)),
    [setEdges]
  );

  const addNode = (type) => {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      { id, type, position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 }, data: { label: "Novo nó" } }
    ]);
    setShowPalette(false);
  };

  const saveMap = async () => {
    setSaving(true);
    try {
      const payload = { name: mapName, nodes, edges };
      if (current?.id) {
        const { data } = await api.put(`/mindmap/${current.id}`, payload);
        setMaps((prev) => prev.map((m) => m.id === data.id ? data : m));
        setCurrent(data);
      } else {
        const { data } = await api.post("/mindmap", payload);
        setMaps((prev) => [data, ...prev]);
        setCurrent(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950" data-testid="mindmap-page">
      {/* Sidebar */}
      <div className="w-56 border-r border-zinc-800 flex flex-col bg-zinc-950 shrink-0">
        <div className="px-4 py-4 border-b border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Mapas Mentais</h2>
          <button
            onClick={newMap}
            data-testid="new-mindmap-btn"
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Mapa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {maps.map((m) => (
            <button
              key={m.id}
              onClick={() => loadMap(m)}
              data-testid={`mindmap-item-${m.id}`}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs transition-colors ${
                current?.id === m.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Map className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shrink-0">
          <input
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="bg-transparent text-sm font-medium text-white focus:outline-none border-b border-transparent focus:border-zinc-600 px-1 py-0.5"
            data-testid="mindmap-name-input"
          />
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowPalette(!showPalette)}
                data-testid="mindmap-add-node-btn"
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar nó
              </button>
              {showPalette && (
                <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 w-40">
                  {MIND_NODE_TYPES_CONFIG.map(({ type, label, icon: Icon }) => (
                    <button key={type} onClick={() => addNode(type)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={saveMap} disabled={saving}
              data-testid="mindmap-save-btn"
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-zinc-950 rounded text-xs font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="flex-1" data-testid="mindmap-canvas">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={mindNodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
