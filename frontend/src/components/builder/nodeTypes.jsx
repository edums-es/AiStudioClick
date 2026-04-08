import { Handle, Position, NodeToolbar } from "@xyflow/react";
import {
  Play, Zap, MessageSquare, GitBranch, Clock, Globe, Workflow,
  Cpu, Flag, Calendar, Bot, Code, Database, Webhook
} from "lucide-react";

const NodeBase = ({ children, selected, colorClass = "border-zinc-700" }) => (
  <div className={`bg-zinc-900 border rounded-md shadow-lg min-w-[170px] max-w-[210px] transition-all ${
    selected ? "border-white shadow-[0_0_14px_rgba(255,255,255,0.1)]" : colorClass
  } hover:border-zinc-500`}>
    {children}
  </div>
);

const NodeHeader = ({ icon: Icon, label, n8nType, iconColor = "text-zinc-400", bgColor = "bg-zinc-800" }) => (
  <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${bgColor}`}>
      <Icon className={`w-3 h-3 ${iconColor}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-zinc-200 truncate">{label}</p>
      {n8nType && (
        <p className="text-[9px] text-zinc-600 font-mono truncate">{n8nType.split(".").pop()}</p>
      )}
    </div>
  </div>
);

const NodeBody = ({ children }) => (
  <div className="px-3 py-2 text-xs text-zinc-500">{children}</div>
);

// ─── START NODE ───────────────────────────────
export function StartNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-emerald-800/60">
      <NodeHeader icon={Play} label={data.label || "Início"} n8nType="n8n-nodes-base.start"
        iconColor="text-emerald-400" bgColor="bg-emerald-950/60" />
      {data.description && <NodeBody>{data.description}</NodeBody>}
      <Handle type="source" position={Position.Right} className="!bg-emerald-700 !border-emerald-600" />
    </NodeBase>
  );
}

// ─── WEBHOOK TRIGGER ─────────────────────────
export function TriggerNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-blue-800/60">
      <NodeHeader icon={Webhook} label={data.label || "Webhook Trigger"} n8nType="n8n-nodes-base.webhook"
        iconColor="text-blue-400" bgColor="bg-blue-950/60" />
      {data.trigger_type && <NodeBody>Tipo: {data.trigger_type}</NodeBody>}
      <Handle type="source" position={Position.Right} className="!bg-blue-700 !border-blue-600" />
    </NodeBase>
  );
}

// ─── SCHEDULE TRIGGER ────────────────────────
export function ScheduleTriggerNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-amber-800/60">
      <NodeHeader icon={Calendar} label={data.label || "Schedule Trigger"} n8nType="n8n-nodes-base.scheduleTrigger"
        iconColor="text-amber-400" bgColor="bg-amber-950/60" />
      {data.schedule && <NodeBody>Intervalo: {data.schedule}</NodeBody>}
      <Handle type="source" position={Position.Right} className="!bg-amber-700 !border-amber-600" />
    </NodeBase>
  );
}

// ─── AI AGENT ────────────────────────────────
export function AiAgentNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-violet-800/60">
      <NodeHeader icon={Bot} label={data.label || "AI Agent"} n8nType="n8n-nodes-base.openAi"
        iconColor="text-violet-400" bgColor="bg-violet-950/60" />
      {data.model && <NodeBody>Modelo: {data.model}</NodeBody>}
      {data.prompt && <NodeBody><span className="line-clamp-2">{data.prompt}</span></NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-violet-700 !border-violet-600" />
      <Handle type="source" position={Position.Right} className="!bg-violet-700 !border-violet-600" />
    </NodeBase>
  );
}

// ─── PROMPT / LLM AGENT ──────────────────────
export function PromptNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-purple-800/60">
      <NodeHeader icon={MessageSquare} label={data.label || "LLM Agent"} n8nType="@n8n/langchain.agent"
        iconColor="text-purple-400" bgColor="bg-purple-950/60" />
      {data.prompt && <NodeBody><span className="line-clamp-2">{data.prompt}</span></NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-purple-700 !border-purple-600" />
      <Handle type="source" position={Position.Right} className="!bg-purple-700 !border-purple-600" />
    </NodeBase>
  );
}

// ─── CONDITION / IF ───────────────────────────
export function ConditionNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-yellow-800/60">
      <NodeHeader icon={GitBranch} label={data.label || "Condição"} n8nType="n8n-nodes-base.if"
        iconColor="text-yellow-400" bgColor="bg-yellow-950/60" />
      {data.condition_field && (
        <NodeBody>{data.condition_field} {data.operator} {data.condition_value}</NodeBody>
      )}
      <Handle type="target" position={Position.Left} className="!bg-yellow-700 !border-yellow-600" />
      <Handle type="source" position={Position.Right} id="yes" style={{ top: "35%" }} className="!bg-emerald-600 !border-emerald-500" />
      <Handle type="source" position={Position.Right} id="no" style={{ top: "65%" }} className="!bg-red-700 !border-red-600" />
      <div className="absolute right-[-26px] top-[26%] text-[9px] text-emerald-500 font-mono">Sim</div>
      <div className="absolute right-[-22px] top-[56%] text-[9px] text-red-500 font-mono">Não</div>
    </NodeBase>
  );
}

// ─── DELAY / WAIT ────────────────────────────
export function DelayNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-cyan-800/60">
      <NodeHeader icon={Clock} label={data.label || "Aguardar"} n8nType="n8n-nodes-base.wait"
        iconColor="text-cyan-400" bgColor="bg-cyan-950/60" />
      {data.delay_hours && <NodeBody>{data.delay_hours}h de espera</NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-cyan-700 !border-cyan-600" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-700 !border-cyan-600" />
    </NodeBase>
  );
}

// ─── HTTP REQUEST ────────────────────────────
export function HttpRequestNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-orange-800/60">
      <NodeHeader icon={Globe} label={data.label || "HTTP Request"} n8nType="n8n-nodes-base.httpRequest"
        iconColor="text-orange-400" bgColor="bg-orange-950/60" />
      {data.method && <NodeBody>{data.method} {data.url ? `• ${data.url.substring(0, 20)}...` : ""}</NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-orange-700 !border-orange-600" />
      <Handle type="source" position={Position.Right} className="!bg-orange-700 !border-orange-600" />
    </NodeBase>
  );
}

// ─── CLICK MASSA ─────────────────────────────
const ACTION_LABELS = {
  apply_tag:          "Aplicar Etiqueta",
  send_message:       "Enviar Mensagem",
  create_contact:     "Criar Contato",
  create_appointment: "Criar Agendamento",
  get_contact:        "Buscar Contato",
  update_contact:     "Atualizar Contato",
};

export function ClickMassaNode({ data, selected }) {
  const actionLabel = data.action ? (ACTION_LABELS[data.action] || data.action) : null;
  return (
    <NodeBase selected={selected} colorClass="border-zinc-500">
      <NodeHeader icon={Workflow} label={data.label || "Click Massa"} n8nType="httpRequest → CLICKMASSA"
        iconColor="text-white" bgColor="bg-zinc-700" />
      {actionLabel && <NodeBody>{actionLabel}</NodeBody>}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeBase>
  );
}

// ─── SKILL EXECUTOR ──────────────────────────
export function SkillExecutorNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-emerald-800/60">
      <NodeHeader icon={Cpu} label={data.label || "Habilidade IA"} n8nType="@n8n/langchain.agent"
        iconColor="text-emerald-400" bgColor="bg-emerald-950/60" />
      {data.skill && <NodeBody>Habilidade: {data.skill}</NodeBody>}
      <Handle type="target" position={Position.Left} className="!bg-emerald-700 !border-emerald-600" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-700 !border-emerald-600" />
    </NodeBase>
  );
}

// ─── CODE ────────────────────────────────────
export function CodeNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-zinc-600">
      <NodeHeader icon={Code} label={data.label || "Código"} n8nType="n8n-nodes-base.code"
        iconColor="text-zinc-300" bgColor="bg-zinc-800" />
      {data.language && <NodeBody className="font-mono">{data.language}</NodeBody>}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeBase>
  );
}

// ─── SET VARIABLES ───────────────────────────
export function SetVariablesNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-teal-800/60">
      <NodeHeader icon={Database} label={data.label || "Transformar Dados"} n8nType="n8n-nodes-base.set"
        iconColor="text-teal-400" bgColor="bg-teal-950/60" />
      <Handle type="target" position={Position.Left} className="!bg-teal-700 !border-teal-600" />
      <Handle type="source" position={Position.Right} className="!bg-teal-700 !border-teal-600" />
    </NodeBase>
  );
}

// ─── OUTPUT ──────────────────────────────────
export function OutputNode({ data, selected }) {
  return (
    <NodeBase selected={selected} colorClass="border-zinc-600">
      <NodeHeader icon={Flag} label={data.label || "Saída"} n8nType="n8n-nodes-base.set"
        iconColor="text-zinc-300" bgColor="bg-zinc-800" />
      {data.output_type && <NodeBody>Tipo: {data.output_type}</NodeBody>}
      <Handle type="target" position={Position.Left} />
    </NodeBase>
  );
}

export const nodeTypes = {
  start: StartNode,
  trigger: TriggerNode,
  webhook_trigger: TriggerNode,
  schedule_trigger: ScheduleTriggerNode,
  ai_agent: AiAgentNode,
  prompt: PromptNode,
  llm: PromptNode,
  condition: ConditionNode,
  if: ConditionNode,
  delay: DelayNode,
  http_request: HttpRequestNode,
  clickmassa: ClickMassaNode,
  skill_executor: SkillExecutorNode,
  code: CodeNode,
  set_variables: SetVariablesNode,
  output: OutputNode,
};
