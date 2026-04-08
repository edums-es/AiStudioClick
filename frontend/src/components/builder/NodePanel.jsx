import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = (error) =>
  `w-full px-3 py-2 bg-zinc-900 border rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors ${
    error ? "border-red-500" : "border-zinc-700"
  }`;

const CLICKMASSA_ACTIONS = [
  { value: "apply_tag",          label: "Aplicar Etiqueta" },
  { value: "send_message",       label: "Enviar Mensagem" },
  { value: "create_contact",     label: "Criar Contato" },
  { value: "create_appointment", label: "Criar Agendamento" },
  { value: "get_contact",        label: "Buscar Contato" },
  { value: "update_contact",     label: "Atualizar Contato" },
];

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const OUTPUT_TYPES = [
  { value: "message",  label: "Mensagem" },
  { value: "json",     label: "JSON" },
  { value: "log",      label: "Registro (Log)" },
  { value: "escalate", label: "Escalar para Humano" },
];

const TRIGGER_TYPES = [
  { value: "webhook",  label: "Webhook" },
  { value: "schedule", label: "Agendado" },
  { value: "event",    label: "Evento" },
];

const OPERATORS = [
  { value: "equal",        label: "igual a" },
  { value: "notEqual",     label: "diferente de" },
  { value: "contains",     label: "contém" },
  { value: "greater",      label: "maior que" },
  { value: "greaterEqual", label: "maior ou igual a" },
  { value: "smaller",      label: "menor que" },
  { value: "smallerEqual", label: "menor ou igual a" },
];

const MAX_SYSTEM_INSTRUCTION = 2000;

export default function NodePanel({ node, onUpdate, onClose }) {
  const [urlError, setUrlError] = useState("");
  const [jsonError, setJsonError] = useState("");

  const data = node.data || {};
  const upd = (key, val) => onUpdate(node.id, { [key]: val });

  const validateUrl = (val) => {
    try {
      if (val) new URL(val);
      setUrlError("");
    } catch {
      setUrlError("URL inválida");
    }
  };

  const validateJson = (val) => {
    try {
      if (val) JSON.parse(val);
      setJsonError("");
    } catch {
      setJsonError("JSON inválido");
    }
  };

  const renderFields = () => {
    switch (node.type) {
      case "start":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)} placeholder="Início"
                className={inputCls(false)} />
            </Field>
            <Field label="Descrição">
              <textarea value={data.description || ""} onChange={(e) => upd("description", e.target.value)}
                placeholder="Descreva o gatilho de entrada" rows={3}
                className={`${inputCls(false)} resize-none`} />
            </Field>
          </>
        );

      case "trigger":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)} placeholder="Gatilho" className={inputCls(false)} />
            </Field>
            <Field label="Tipo de Gatilho">
              <Select value={data.trigger_type || ""} onValueChange={(v) => upd("trigger_type", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm h-9">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-zinc-200 focus:bg-zinc-800">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Evento / Schedule">
              <input value={data.schedule || ""} onChange={(e) => upd("schedule", e.target.value)}
                placeholder="ex: daily / deal_closed" className={inputCls(false)} />
            </Field>
          </>
        );

      case "prompt":
      case "ai_agent":
      case "llm":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)}
                placeholder={node.type === "ai_agent" ? "Agente IA" : "Agente LLM"} className={inputCls(false)} />
            </Field>
            <Field label={`Instrução do Sistema (${(data.system_instruction || "").length}/${MAX_SYSTEM_INSTRUCTION})`}>
              <textarea
                value={data.system_instruction || ""}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_SYSTEM_INSTRUCTION)
                    upd("system_instruction", e.target.value);
                }}
                placeholder="Você é um especialista em..."
                rows={4}
                className={`${inputCls(false)} resize-none font-mono`}
              />
            </Field>
            <Field label="Prompt do Usuário">
              <textarea value={data.prompt || ""} onChange={(e) => upd("prompt", e.target.value)}
                placeholder="Analise os dados e..." rows={3}
                className={`${inputCls(false)} resize-none font-mono`} />
            </Field>
          </>
        );

      case "condition":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)} placeholder="Se / Então" className={inputCls(false)} />
            </Field>
            <Field label="Campo">
              <input value={data.condition_field || ""} onChange={(e) => upd("condition_field", e.target.value)}
                placeholder="ex: score" className={inputCls(false)} />
            </Field>
            <Field label="Operador">
              <Select value={data.operator || ""} onValueChange={(v) => upd("operator", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-zinc-200 focus:bg-zinc-800">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor">
              <input value={data.condition_value || ""} onChange={(e) => upd("condition_value", e.target.value)}
                placeholder="ex: 7" className={inputCls(false)} />
            </Field>
          </>
        );

      case "delay":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)} placeholder="Aguardar" className={inputCls(false)} />
            </Field>
            <Field label="Horas de Espera">
              <input value={data.delay_hours || ""} onChange={(e) => upd("delay_hours", Number(e.target.value))}
                type="number" min="0" placeholder="24" className={inputCls(false)} />
            </Field>
          </>
        );

      case "http_request":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)}
                placeholder="Requisição Externa" className={inputCls(false)} />
            </Field>
            <Field label="Método HTTP">
              <Select value={data.method || "GET"} onValueChange={(v) => upd("method", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {HTTP_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-zinc-200 focus:bg-zinc-800">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="URL">
              <input value={data.url || ""} onChange={(e) => upd("url", e.target.value)}
                onBlur={(e) => validateUrl(e.target.value)}
                placeholder="https://api.exemplo.com/endpoint"
                className={inputCls(!!urlError)} />
              {urlError && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{urlError}</p>}
            </Field>
            <Field label="Body (JSON)">
              <textarea value={data.body || ""} onChange={(e) => upd("body", e.target.value)}
                onBlur={(e) => validateJson(e.target.value)}
                placeholder='{"key": "value"}' rows={3}
                className={`${inputCls(!!jsonError)} resize-none font-mono`} />
              {jsonError && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{jsonError}</p>}
            </Field>
          </>
        );

      case "clickmassa":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)}
                placeholder="Click Massa" className={inputCls(false)} />
            </Field>
            <Field label="Ação">
              <Select value={data.action || ""} onValueChange={(v) => upd("action", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm h-9" data-testid="clickmassa-action-select">
                  <SelectValue placeholder="Selecione a ação..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {CLICKMASSA_ACTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value} className="text-zinc-200 focus:bg-zinc-800">{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {data.action === "apply_tag" && (
              <Field label="Etiqueta">
                <input value={data.tag || ""} onChange={(e) => upd("tag", e.target.value)}
                  placeholder="ex: lead-quente" className={inputCls(false)} />
              </Field>
            )}
            {data.action === "send_message" && (
              <Field label="Mensagem">
                <textarea value={data.message || ""} onChange={(e) => upd("message", e.target.value)}
                  placeholder="Texto da mensagem..." rows={3}
                  className={`${inputCls(false)} resize-none`} />
              </Field>
            )}
          </>
        );

      case "skill_executor":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)}
                placeholder="Habilidade IA" className={inputCls(false)} />
            </Field>
            <Field label="Nome da Habilidade">
              <input value={data.skill || ""} onChange={(e) => upd("skill", e.target.value)}
                placeholder="ex: Qualificar Lead" className={inputCls(false)} />
            </Field>
          </>
        );

      case "output":
        return (
          <>
            <Field label="Rótulo">
              <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)}
                placeholder="Finalizar" className={inputCls(false)} />
            </Field>
            <Field label="Tipo de Saída">
              <Select value={data.output_type || "message"} onValueChange={(v) => upd("output_type", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {OUTPUT_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-zinc-200 focus:bg-zinc-800">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        );

      default:
        return (
          <Field label="Rótulo">
            <input value={data.label || ""} onChange={(e) => upd("label", e.target.value)} className={inputCls(false)} />
          </Field>
        );
    }
  };

  return (
    <div className="w-72 bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden" data-testid="node-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-white">{data?.label || node.type}</p>
          <p className="text-xs text-zinc-500 capitalize">{node.type.replace(/_/g, " ")}</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors" data-testid="node-panel-close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderFields()}
      </div>
    </div>
  );
}
