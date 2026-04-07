import { X } from "lucide-react";

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, ...props }) => (
  <input
    value={value || ""}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
    {...props}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value || ""}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors resize-none font-mono"
  />
);

const nodeFields = {
  start: [
    { key: "label", label: "Rótulo", placeholder: "Início" },
    { key: "description", label: "Descrição", placeholder: "Descreva o gatilho de entrada", type: "textarea" },
  ],
  trigger: [
    { key: "label", label: "Rótulo", placeholder: "Trigger" },
    { key: "trigger_type", label: "Tipo de Trigger", placeholder: "schedule / event / webhook" },
    { key: "schedule", label: "Schedule / Evento", placeholder: "daily / deal_closed" },
  ],
  prompt: [
    { key: "label", label: "Rótulo", placeholder: "Prompt" },
    { key: "system_instruction", label: "Instrução do Sistema", placeholder: "Você é um especialista em...", type: "textarea" },
    { key: "prompt", label: "Prompt do Usuário", placeholder: "Analise os dados e...", type: "textarea" },
  ],
  condition: [
    { key: "label", label: "Rótulo", placeholder: "Condição" },
    { key: "condition_field", label: "Campo", placeholder: "score" },
    { key: "operator", label: "Operador", placeholder: "gte / lte / eq / neq" },
    { key: "condition_value", label: "Valor", placeholder: "7" },
  ],
  delay: [
    { key: "label", label: "Rótulo", placeholder: "Aguardar" },
    { key: "delay_hours", label: "Horas de Espera", placeholder: "24", type: "number" },
  ],
  http_request: [
    { key: "label", label: "Rótulo", placeholder: "HTTP Request" },
    { key: "method", label: "Método", placeholder: "GET / POST / PUT" },
    { key: "url", label: "URL", placeholder: "https://api.exemplo.com/endpoint" },
    { key: "body", label: "Body (JSON)", placeholder: '{"key": "value"}', type: "textarea" },
  ],
  clickmassa: [
    { key: "label", label: "Rótulo", placeholder: "Click Massa" },
    { key: "action", label: "Ação", placeholder: "apply_tag / send_message / create_contact" },
    { key: "tag", label: "Tag (se apply_tag)", placeholder: "lead-quente" },
  ],
  skill_executor: [
    { key: "label", label: "Rótulo", placeholder: "Skill Executor" },
    { key: "skill", label: "Nome da Skill", placeholder: "Qualificar Lead" },
  ],
  output: [
    { key: "label", label: "Rótulo", placeholder: "Saída" },
    { key: "output_type", label: "Tipo de Saída", placeholder: "json / message / log / escalate" },
  ],
};

export default function NodePanel({ node, onUpdate, onClose }) {
  const fields = nodeFields[node.type] || [{ key: "label", label: "Rótulo", placeholder: "" }];

  return (
    <div
      className="w-72 bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden"
      data-testid="node-panel"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-white">{node.data?.label || node.type}</p>
          <p className="text-xs text-zinc-500 capitalize">{node.type.replace("_", " ")}</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors" data-testid="node-panel-close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fields.map(({ key, label, placeholder, type }) => (
          <Field key={key} label={label}>
            {type === "textarea" ? (
              <Textarea
                value={node.data?.[key]}
                onChange={(e) => onUpdate(node.id, { [key]: e.target.value })}
                placeholder={placeholder}
              />
            ) : (
              <Input
                value={node.data?.[key]}
                onChange={(e) => onUpdate(node.id, { [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                placeholder={placeholder}
                type={type || "text"}
              />
            )}
          </Field>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">ID: <span className="font-mono text-zinc-500">{node.id}</span></p>
      </div>
    </div>
  );
}
