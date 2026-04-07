import { Handle, Position } from "@xyflow/react";
import { Play, Zap, MessageSquare, GitBranch, Clock, Globe, Workflow, Cpu, Flag } from "lucide-react";

const NodeBase = ({ children, selected, colorClass = "border-zinc-700" }) => (
  <div className={`bg-zinc-900 border rounded-md shadow-lg min-w-[160px] max-w-[200px] transition-all ${
    selected ? "border-white shadow-[0_0_12px_rgba(255,255,255,0.08)]" : colorClass
  } hover:border-zinc-500`}>
    {children}
  </div>
);

const NodeHeader = ({ icon: Icon, label, iconColor = "text-zinc-400", bgColor = "bg-zinc-800" }) => (
  <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
    <div className={`w-5 h-5 rounded flex items-center justify-center ${bgColor}`}>
      <Icon className={`w-3 h-3 ${iconColor}`} />
    </div>
    <span className="text-xs font-semibold text-zinc-200 truncate">{label}</span>
  </div>
);

const NodeBody = ({ children }) => (
  <div className="px-3 py-2 text-xs text-zinc-500">{children}</div>
);

// START NODE
export function StartNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-emerald-800/60">
      <NodeHeader icon={Play} label={data.label || "Início"} iconColor="text-emerald-400" bgColor="bg-emerald-950/60" />
      {data.description && <NodeBody>{data.description}</NodeBody>}
      <Handle type="source" position={Position.Right} className="!bg-emerald-700 !border-emerald-600" />
    </NodeBase>
  );
}

// TRIGGER NODE
export function TriggerNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-blue-800/60">
      <NodeHeader icon={Zap} label={data.label || "Trigger"} iconColor="text-blue-400" bgColor="bg-blue-950/60" />
      {data.trigger_type && <NodeBody>Tipo: {data.trigger_type}</NodeBody>}
      <Handle type="source" position={Position.Right} className="!bg-blue-700 !border-blue-600" />
    </NodeBase>
  );
}

// PROMPT NODE
export function PromptNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-purple-800/60">
      <NodeHeader icon={MessageSquare} label={data.label || "Prompt"} iconColor="text-purple-400" bgColor="bg-purple-950/60" />
      {data.prompt && (
        <NodeBody>
          <span className="line-clamp-2">{data.prompt}</span>
        </NodeBody>
      )}
      <Handle type="target" position={Position.Left} className="!bg-purple-700 !border-purple-600" />
      <Handle type="source" position={Position.Right} className="!bg-purple-700 !border-purple-600" />
    </NodeBase>
  );
}

// CONDITION NODE
export function ConditionNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-yellow-800/60">
      <NodeHeader icon={GitBranch} label={data.label || "Condição"} iconColor="text-yellow-400" bgColor="bg-yellow-950/60" />
      {data.condition_field && (
        <NodeBody>{data.condition_field} {data.operator} {data.condition_value}</NodeBody>
      )}
      <Handle type="target" position={Position.Left} className="!bg-yellow-700 !border-yellow-600" />
      <Handle type="source" position={Position.Right} id="yes" style={{ top: "35%" }} className="!bg-emerald-600 !border-emerald-500" />
      <Handle type="source" position={Position.Right} id="no" style={{ top: "65%" }} className="!bg-red-700 !border-red-600" />
      <div className="absolute right-[-28px] top-[28%] text-[9px] text-emerald-500 font-mono">Sim</div>
      <div className="absolute right-[-24px] top-[58%] text-[9px] text-red-500 font-mono">Não</div>
    </NodeBase>
  );
}

// DELAY NODE
export function DelayNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-cyan-800/60">
      <NodeHeader icon={Clock} label={data.label || "Aguardar"} iconColor="text-cyan-400" bgColor="bg-cyan-950/60" />
      {data.delay_hours && <NodeBody>{data.delay_hours}h de espera</NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-cyan-700 !border-cyan-600" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-700 !border-cyan-600" />
    </NodeBase>
  );
}

// HTTP REQUEST NODE
export function HttpRequestNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-orange-800/60">
      <NodeHeader icon={Globe} label={data.label || "HTTP Request"} iconColor="text-orange-400" bgColor="bg-orange-950/60" />
      {data.method && <NodeBody>{data.method} {data.url || "URL não configurada"}</NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-orange-700 !border-orange-600" />
      <Handle type="source" position={Position.Right} className="!bg-orange-700 !border-orange-600" />
    </NodeBase>
  );
}

// CLICK MASSA NODE
export function ClickMassaNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-zinc-600">
      <NodeHeader icon={Workflow} label={data.label || "Click Massa"} iconColor="text-white" bgColor="bg-zinc-700" />
      {data.action && <NodeBody>Ação: {data.action}</NodeBody>}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeBase>
  );
}

// SKILL EXECUTOR NODE
export function SkillExecutorNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-emerald-800/60">
      <NodeHeader icon={Cpu} label={data.label || "Skill Executor"} iconColor="text-emerald-400" bgColor="bg-emerald-950/60" />
      {data.skill && <NodeBody>Skill: {data.skill}</NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-emerald-700 !border-emerald-600" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-700 !border-emerald-600" />
    </NodeBase>
  );
}

// OUTPUT NODE
export function OutputNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-zinc-600">
      <NodeHeader icon={Flag} label={data.label || "Saída"} iconColor="text-zinc-300" bgColor="bg-zinc-800" />
      {data.output_type && <NodeBody>Tipo: {data.output_type}</NodeBody>}
      <Handle type="target" position={Position.Left} />
    </NodeBase>
  );
}

export const nodeTypes = {
  start: StartNode,
  trigger: TriggerNode,
  prompt: PromptNode,
  condition: ConditionNode,
  delay: DelayNode,
  http_request: HttpRequestNode,
  clickmassa: ClickMassaNode,
  skill_executor: SkillExecutorNode,
  output: OutputNode,
};
