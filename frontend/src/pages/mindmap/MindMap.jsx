import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, BackgroundVariant,
  NodeToolbar, Position, Handle, useReactFlow, ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Plus, Save, Trash2, Map, StickyNote, Type, Square, Diamond,
  Lightbulb, Target, AlertCircle, Zap, Eye, ArrowRight, X
} from "lucide-react";

// ─── Color Palette ──────────────────────────────────────────────────
const STICKY_COLORS = [
  { name: "yellow", bg: "#FFF06A", text: "#1A1A1A" },
  { name: "orange", bg: "#FF9533", text: "#1A1A1A" },
  { name: "green",  bg: "#72E2AE", text: "#1A1A1A" },
  { name: "blue",   bg: "#75BDFF", text: "#1A1A1A" },
  { name: "pink",   bg: "#FF7CAC", text: "#1A1A1A" },
  { name: "purple", bg: "#AD80FF", text: "#1A1A1A" },
  { name: "red",    bg: "#FF6B6B", text: "#1A1A1A" },
  { name: "white",  bg: "#F4F4F5", text: "#1A1A1A" },
  { name: "dark",   bg: "#27272A", text: "#FFFFFF" },
];

// ─── Sticky Note Node ───────────────────────────────────────────────
function StickyNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const { updateNodeData, deleteElements } = useReactFlow();
  const textareaRef = useRef(null);
  const bg = data.color || "#FFF06A";
  const color = data.textColor || "#1A1A1A";

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top} align="center">
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 shadow-xl">
          {STICKY_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => updateNodeData(id, { color: c.bg, textColor: c.text })}
              style={{ background: c.bg }}
              className={`w-4 h-4 rounded-sm border border-black/20 hover:scale-125 transition-transform ${
                bg === c.bg ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-950" : ""
              }`}
              title={c.name}
            />
          ))}
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <button onClick={() => setEditing(true)} className="text-zinc-400 hover:text-white p-0.5 transition-colors" title="Editar">
            <Type className="w-3 h-3" />
          </button>
          <button onClick={handleDelete} className="text-zinc-400 hover:text-red-400 p-0.5 transition-colors" title="Excluir">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </NodeToolbar>

      <div
        data-testid={`sticky-node-${id}`}
        onDoubleClick={() => setEditing(true)}
        style={{
          background: bg, color,
          minWidth: 150, minHeight: 90,
          boxShadow: selected
            ? `0 0 0 2px white, 0 8px 32px rgba(0,0,0,0.5), 2px 6px 0 rgba(0,0,0,0.2)`
            : `0 4px 16px rgba(0,0,0,0.35), 2px 4px 0 rgba(0,0,0,0.15)`,
          cursor: editing ? "text" : "default",
        }}
        className="rounded-sm p-3 relative select-none"
      >
        {/* Fold corner */}
        <div style={{
          position: "absolute", bottom: 0, right: 0, width: 16, height: 16,
          background: `linear-gradient(225deg, rgba(0,0,0,0.18) 50%, transparent 50%)`,
        }} />

        {editing ? (
          <textarea
            ref={textareaRef}
            value={data.label || ""}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
            style={{ color, background: "transparent" }}
            className="w-full resize-none text-sm font-medium outline-none"
            rows={4}
          />
        ) : (
          <p className="text-sm font-medium whitespace-pre-wrap break-words leading-snug" style={{ color }}>
            {data.label || "Clique duas vezes para editar"}
          </p>
        )}

        <Handle type="target" position={Position.Left}
          className="!w-2.5 !h-2.5 !border !border-black/30"
          style={{ background: "rgba(0,0,0,0.3)" }} />
        <Handle type="source" position={Position.Right}
          className="!w-2.5 !h-2.5 !border !border-black/30"
          style={{ background: "rgba(0,0,0,0.3)" }} />
        <Handle type="target" position={Position.Top}
          className="!w-2.5 !h-2.5 !border !border-black/30"
          style={{ background: "rgba(0,0,0,0.3)" }} />
        <Handle type="source" position={Position.Bottom}
          className="!w-2.5 !h-2.5 !border !border-black/30"
          style={{ background: "rgba(0,0,0,0.3)" }} />
      </div>
    </>
  );
}

// ─── Card Node ───────────────────────────────────────────────────────
function CardNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const { updateNodeData, deleteElements } = useReactFlow();

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 shadow-xl">
          <button onClick={() => setEditing(!editing)} className="text-zinc-400 hover:text-white p-0.5">
            <Type className="w-3 h-3" />
          </button>
          <button onClick={() => deleteElements({ nodes: [{ id }] })} className="text-zinc-400 hover:text-red-400 p-0.5">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </NodeToolbar>

      <div
        onDoubleClick={() => setEditing(true)}
        style={{
          minWidth: 180, boxShadow: selected
            ? "0 0 0 2px white, 0 8px 24px rgba(0,0,0,0.4)"
            : "0 4px 16px rgba(0,0,0,0.3)",
        }}
        className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden"
        data-testid={`card-node-${id}`}
      >
        {/* Card header */}
        <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700">
          {editing ? (
            <input autoFocus value={data.title || ""} onBlur={() => setEditing(false)}
              onChange={(e) => updateNodeData(id, { title: e.target.value })}
              className="bg-transparent text-sm font-semibold text-white outline-none w-full" />
          ) : (
            <p className="text-sm font-semibold text-white truncate">{data.title || "Título"}</p>
          )}
        </div>
        <div className="px-3 py-2">
          <p className="text-xs text-zinc-400 leading-relaxed">{data.body || "Conteúdo..."}</p>
        </div>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="source" position={Position.Bottom} id="bottom" />
      </div>
    </>
  );
}

// ─── Text Node ──────────────────────────────────────────────────────
function TextLabelNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const { updateNodeData, deleteElements } = useReactFlow();

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 shadow-xl">
          <button onClick={() => setEditing(true)} className="text-zinc-400 hover:text-white p-0.5"><Type className="w-3 h-3" /></button>
          <button onClick={() => deleteElements({ nodes: [{ id }] })} className="text-zinc-400 hover:text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
        </div>
      </NodeToolbar>
      <div onDoubleClick={() => setEditing(true)} className="px-1 py-0.5 nodrag" style={{ minWidth: 80 }}>
        {editing ? (
          <input autoFocus value={data.label || ""} onBlur={() => setEditing(false)}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            style={{ fontSize: data.size === "lg" ? 24 : data.size === "md" ? 16 : 13 }}
            className="bg-transparent text-white font-semibold outline-none border-b border-zinc-500 w-full" />
        ) : (
          <p style={{ fontSize: data.size === "lg" ? 24 : data.size === "md" ? 16 : 13 }}
            className="font-semibold text-zinc-200 whitespace-nowrap cursor-default">
            {data.label || "Texto"}
          </p>
        )}
        <Handle type="target" position={Position.Left} className="!opacity-0 hover:!opacity-100" />
        <Handle type="source" position={Position.Right} className="!opacity-0 hover:!opacity-100" />
      </div>
    </>
  );
}

// ─── Shape / Connector Node ─────────────────────────────────────────
function ShapeNode({ id, data, selected }) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const isDiamond = data.shape === "diamond";

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 shadow-xl">
          <button onClick={() => updateNodeData(id, { shape: "rect" })}
            className={`p-0.5 ${data.shape !== "diamond" ? "text-white" : "text-zinc-500"} hover:text-white`}>
            <Square className="w-3 h-3" />
          </button>
          <button onClick={() => updateNodeData(id, { shape: "diamond" })}
            className={`p-0.5 ${data.shape === "diamond" ? "text-white" : "text-zinc-500"} hover:text-white`}>
            <Diamond className="w-3 h-3" />
          </button>
          <button onClick={() => deleteElements({ nodes: [{ id }] })} className="text-zinc-400 hover:text-red-400 p-0.5">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </NodeToolbar>
      <div
        style={{
          width: 100, height: 60,
          transform: isDiamond ? "rotate(45deg)" : "none",
          boxShadow: selected ? "0 0 0 2px white" : "none",
        }}
        className="bg-zinc-800 border border-zinc-600 rounded-sm flex items-center justify-center"
      >
        <p style={{ transform: isDiamond ? "rotate(-45deg)" : "none" }}
          className="text-xs text-zinc-300 text-center px-2 font-medium">
          {data.label || "Forma"}
        </p>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="source" position={Position.Bottom} id="bottom" />
      </div>
    </>
  );
}

const mindNodeTypes = {
  sticky: StickyNode,
  card: CardNode,
  text: TextLabelNode,
  shape: ShapeNode,
};

// ─── Node Type Palette Config ────────────────────────────────────────
const NODE_TYPES_PALETTE = [
  { type: "sticky", label: "Sticky Note", icon: "🟨", color: "#FFF06A" },
  { type: "card", label: "Card", icon: "🃏" },
  { type: "text", label: "Texto", icon: "T" },
  { type: "shape", label: "Forma", icon: "⬜" },
];

// ─── Inner Canvas (needs ReactFlowProvider scope) ────────────────────
function MindMapCanvas({ mapData, onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(mapData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mapData?.edges || []);
  const [showPalette, setShowPalette] = useState(false);
  const [saving, setSaving] = useState(false);
  const reactFlowRef = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    setNodes(mapData?.nodes || []);
    setEdges(mapData?.edges || []);
  }, [mapData?.id]); // eslint-disable-line

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params, type: "smoothstep",
      style: { stroke: "#52525b", strokeWidth: 1.5 },
      animated: false,
    }, eds)),
    [setEdges]
  );

  const onPaneDoubleClick = useCallback((event) => {
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode = {
      id: `sticky-${Date.now()}`,
      type: "sticky",
      position,
      data: { label: "", color: "#FFF06A", textColor: "#1A1A1A" },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition, setNodes]);

  const addNode = useCallback((type) => {
    const centerX = 300 + Math.random() * 200;
    const centerY = 200 + Math.random() * 150;
    const defaults = {
      sticky: { label: "", color: "#FFF06A", textColor: "#1A1A1A" },
      card: { title: "Título", body: "Conteúdo aqui..." },
      text: { label: "Texto", size: "md" },
      shape: { label: "Forma", shape: "rect" },
    };
    setNodes((nds) => [...nds, {
      id: `${type}-${Date.now()}`, type,
      position: { x: centerX, y: centerY },
      data: defaults[type] || { label: type },
    }]);
    setShowPalette(false);
  }, [setNodes]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(nodes, edges);
    setSaving(false);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Inner toolbar */}
      <div className="flex items-center justify-between px-3 h-11 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button onClick={() => setShowPalette(!showPalette)} data-testid="mindmap-add-node-btn"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
            {showPalette && (
              <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 min-w-36">
                {NODE_TYPES_PALETTE.map(({ type, label, icon }) => (
                  <button key={type} onClick={() => addNode(type)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                    <span className="w-4 text-center text-sm">{icon}</span> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-600">· Duplo clique no canvas para sticky note</p>
        </div>
        <button onClick={handleSave} disabled={saving} data-testid="mindmap-save-btn"
          className="flex items-center gap-1.5 px-3 py-1 bg-white text-zinc-950 rounded text-xs font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50">
          <Save className="w-3 h-3" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1" ref={reactFlowRef} data-testid="mindmap-canvas">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onPaneDoubleClick={onPaneDoubleClick}
          nodeTypes={mindNodeTypes} deleteKeyCode="Delete"
          fitView fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          connectionLineStyle={{ stroke: "#52525b", strokeWidth: 1.5 }}
          defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "#52525b", strokeWidth: 1.5 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={(n) => n.data?.color || "#3f3f46"}
            maskColor="rgba(9,9,11,0.75)" style={{ background: "rgba(9,9,11,0.9)" }} />
        </ReactFlow>
      </div>
    </div>
  );
}

// ─── Main MindMap Page ───────────────────────────────────────────────
export default function MindMap() {
  const [maps, setMaps] = useState([]);
  const [current, setCurrent] = useState(null);
  const [mapName, setMapName] = useState("Novo Mapa");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    api.get("/mindmap").then(({ data }) => {
      setMaps(data);
      if (data.length > 0) {
        setCurrent(data[0]);
        setMapName(data[0].name);
      } else {
        setCurrent({
          nodes: [
            { id: "sticky-1", type: "sticky", position: { x: 350, y: 200 }, data: { label: "Ideia Principal", color: "#FFF06A", textColor: "#1A1A1A" } },
            { id: "sticky-2", type: "sticky", position: { x: 600, y: 130 }, data: { label: "Etapa 1", color: "#75BDFF", textColor: "#1A1A1A" } },
            { id: "sticky-3", type: "sticky", position: { x: 600, y: 280 }, data: { label: "Dor do cliente", color: "#FF7CAC", textColor: "#1A1A1A" } },
            { id: "card-1", type: "card", position: { x: 150, y: 200 }, data: { title: "Objetivo", body: "Descreva o objetivo aqui..." } },
          ],
          edges: [
            { id: "e1", source: "sticky-1", target: "sticky-2", type: "smoothstep", style: { stroke: "#52525b" } },
            { id: "e2", source: "sticky-1", target: "sticky-3", type: "smoothstep", style: { stroke: "#52525b" } },
          ],
        });
      }
    }).catch(console.error);
  }, []);

  const createNewMap = () => {
    const newName = "Novo Mapa";
    setCurrent({
      nodes: [
        { id: `sticky-${Date.now()}`, type: "sticky", position: { x: 300, y: 200 }, data: { label: "Ideia Principal", color: "#FFF06A", textColor: "#1A1A1A" } },
      ],
      edges: [],
    });
    setMapName(newName);
  };

  const handleSave = useCallback(async (nodes, edges) => {
    try {
      const payload = { name: mapName, nodes, edges };
      if (current?.id) {
        const { data } = await api.put(`/mindmap/${current.id}`, payload);
        setMaps((prev) => prev.map((m) => m.id === data.id ? data : m));
        setCurrent(data);
        toast.success("Mapa salvo!");
      } else {
        const { data } = await api.post("/mindmap", payload);
        setMaps((prev) => [data, ...prev]);
        setCurrent(data);
        setMapName(data.name);
        toast.success("Mapa criado!");
      }
    } catch {
      toast.error("Erro ao salvar o mapa.");
    }
  }, [current, mapName]);

  const deleteMap = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Excluir este mapa?")) return;
    try {
      await api.delete(`/mindmap/${id}`);
      const newMaps = maps.filter((m) => m.id !== id);
      setMaps(newMaps);
      if (current?.id === id) {
        setCurrent(newMaps[0] || null);
        setMapName(newMaps[0]?.name || "Novo Mapa");
      }
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden" data-testid="mindmap-page">
      {/* Left panel */}
      <div className="w-52 border-r border-zinc-800 flex flex-col bg-zinc-950 shrink-0">
        <div className="px-3 py-3 border-b border-zinc-800">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mapas Mentais</p>
          <button onClick={createNewMap} data-testid="new-mindmap-btn"
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo Mapa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {maps.map((m) => (
            <div key={m.id}
              onClick={() => { setCurrent(m); setMapName(m.name); }}
              className={`flex items-center justify-between px-3 py-2.5 text-xs cursor-pointer transition-colors group ${
                current?.id === m.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
              data-testid={`mindmap-item-${m.id}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Map className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{m.name}</span>
              </div>
              <button onClick={(e) => deleteMap(m.id, e)}
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all ml-1 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {maps.length === 0 && (
            <p className="text-xs text-zinc-600 px-4 py-4">Nenhum mapa ainda</p>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-2">
            {editingName ? (
              <input autoFocus value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
                className="bg-transparent text-sm font-semibold text-white outline-none border-b border-zinc-500 px-1"
                data-testid="mindmap-name-input" />
            ) : (
              <h2 className="text-sm font-semibold text-white cursor-pointer hover:text-zinc-300 transition-colors"
                onClick={() => setEditingName(true)} data-testid="mindmap-title">
                {mapName}
              </h2>
            )}
            <span className="text-xs text-zinc-600">· duplo clique no canvas = nova sticky</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>Del = excluir selecionado</span>
          </div>
        </div>

        {/* Canvas with ReactFlowProvider */}
        {current !== null ? (
          <ReactFlowProvider>
            <MindMapCanvas mapData={current} onSave={handleSave} />
          </ReactFlowProvider>
        ) : (
          <div className="flex-1 flex items-center justify-center" data-testid="mindmap-empty-state">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto">
                <Map className="w-5 h-5 text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-400">Carregando mapa...</p>
              <p className="text-xs text-zinc-600">Clique em "Novo Mapa" para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
