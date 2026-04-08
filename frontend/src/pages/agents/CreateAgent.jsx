import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ReactFlow, Background, MiniMap, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import {
  Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, Eye, Zap, AlertCircle,
} from "lucide-react";

import api from "@/lib/api";
import { nodeTypes } from "@/components/builder/nodeTypes";

// ─── Prompt examples ────────────────────────────────────────────────────────
const EXAMPLES = [
  "Quero um agente que faça atendimento automatizado no WhatsApp, responda dúvidas dos clientes, identifique leads quentes e crie contatos no meu CRM.",
  "Agente para agendar e cancelar consultas na minha agenda do Google Calendar via WhatsApp, confirmando por mensagem de texto ou áudio.",
  "Quero um agente que monitore meu e-mail, classifique mensagens urgentes e notifique no Slack.",
  "Agente de qualificação de leads: recebe formulário de contato, faz perguntas por WhatsApp, pontua o lead e envia para o vendedor certo.",
  "Assistente de suporte que responde tickets, busca em base de conhecimento e escala para humano quando não souber.",
];

// ─── Credential Field ────────────────────────────────────────────────────────
function CredentialCard({ service, onChange, values, expanded, onToggle }) {
  const filledCount = service.fields.filter(f => f.required && values[f.key]?.trim()).length;
  const requiredCount = service.fields.filter(f => f.required).length;
  const complete = filledCount >= requiredCount;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        complete ? "border-emerald-800/60" : "border-zinc-700"
      }`}
      data-testid={`credential-card-${service.service.toLowerCase().replace(/\s/g, "-")}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{service.icon}</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">{service.service}</p>
            <p className="text-xs text-zinc-500">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {complete ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> Pronto
            </span>
          ) : (
            <span className="text-xs text-zinc-500">{filledCount}/{requiredCount} campos</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pt-1 pb-4 bg-zinc-950/50 space-y-3 border-t border-zinc-800">
          {service.fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">
                {field.label}{field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.type === "password" ? (
                <input
                  type="password"
                  value={values[field.key] || ""}
                  onChange={e => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder || ""}
                  data-testid={`cred-field-${service.service.toLowerCase().replace(/\s/g, "-")}-${field.key}`}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  value={values[field.key] || ""}
                  onChange={e => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder || ""}
                  data-testid={`cred-field-${service.service.toLowerCase().replace(/\s/g, "-")}-${field.key}`}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flow Canvas (animated) ──────────────────────────────────────────────────
function FlowCanvas({ nodes, edges }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 100);
    }
  }, [nodes.length, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      className="bg-zinc-950"
    >
      <Background color="#27272a" gap={20} size={1} />
      <MiniMap
        nodeColor="#3f3f46"
        maskColor="rgba(0,0,0,0.6)"
        className="!bg-zinc-900 !border-zinc-700"
      />
    </ReactFlow>
  );
}

// ─── Step indicators ─────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ["Descrever", "Visualizar", "Configurar"];
  return (
    <div className="flex items-center gap-0" data-testid="create-agent-steps">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              done ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50" :
              active ? "bg-zinc-800 text-white border border-zinc-600" :
              "text-zinc-600"
            }`}>
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : (
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] border ${
                  active ? "border-zinc-400 text-white" : "border-zinc-700 text-zinc-600"
                }`}>{idx}</span>
              )}
              {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? "bg-emerald-800" : "bg-zinc-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreateAgent() {
  const navigate = useNavigate();

  // Step: 1=prompt, 2=preview, 3=credentials
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Animation state for React Flow
  const [animatedNodes, setAnimatedNodes] = useState([]);
  const [animatedEdges, setAnimatedEdges] = useState([]);
  const [animComplete, setAnimComplete] = useState(false);

  // Credentials state: { [serviceIndex]: { [fieldKey]: value } }
  const [credValues, setCredValues] = useState({});
  const [expandedCard, setExpandedCard] = useState(0);

  const textareaRef = useRef(null);

  // ── Step 1 → 2: Generate ──────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error("Descreva melhor o que o agente deve fazer (mínimo 10 caracteres).");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post("/generate/agent", { prompt: prompt.trim() });
      setGeneratedData(data);
      setStep(2);
      setAnimatedNodes([]);
      setAnimatedEdges([]);
      setAnimComplete(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Erro ao gerar agente. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }, [prompt]);

  // ── Animate nodes one by one ──────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || !generatedData) return;
    const { nodes, edges } = generatedData.flow_definition;
    if (!nodes?.length) return;

    let i = 0;
    const timer = setInterval(() => {
      if (i < nodes.length) {
        const node = nodes[i];
        setAnimatedNodes(prev => [...prev, {
          ...node,
          style: { opacity: 0, transition: "opacity 0.4s ease" },
        }]);
        // Fade in after small delay
        setTimeout(() => {
          setAnimatedNodes(prev =>
            prev.map(n => n.id === node.id ? { ...n, style: { opacity: 1, transition: "opacity 0.4s ease" } } : n)
          );
        }, 80);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setAnimatedEdges(edges);
          setAnimComplete(true);
        }, 300);
      }
    }, 380);

    return () => clearInterval(timer);
  }, [step, generatedData]);

  // ── Credential helpers ────────────────────────────────────────────
  const setCredField = (serviceIdx, key, value) => {
    setCredValues(prev => ({
      ...prev,
      [serviceIdx]: { ...(prev[serviceIdx] || {}), [key]: value },
    }));
  };

  const services = generatedData?.required_credentials || [];

  const allRequiredFilled = services.every((svc, idx) =>
    svc.fields.filter(f => f.required).every(f => credValues[idx]?.[f.key]?.trim())
  );

  // ── Save agent + credentials ──────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Create agent
      const { data: agent } = await api.post("/agents", {
        name: generatedData.agent_name,
        description: generatedData.description,
        flow_definition: generatedData.flow_definition,
      });

      // Save filled credentials as integrations
      await Promise.all(
        services.map(async (svc, idx) => {
          const vals = credValues[idx] || {};
          const hasAny = Object.values(vals).some(v => v?.trim());
          if (!hasAny) return;
          await api.post("/integrations", {
            provider: svc.service.toLowerCase().replace(/\s+/g, "_"),
            name: svc.service,
            credentials: vals,
          }).catch(() => {}); // Non-blocking
        })
      );

      toast.success("Agente criado! Configure os detalhes no Builder.");
      navigate(`/agents/${agent.id}/edit`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Erro ao salvar o agente.");
    } finally {
      setSaving(false);
    }
  }, [generatedData, credValues, services, navigate]);

  const handleSkip = useCallback(async () => {
    setSaving(true);
    try {
      const { data: agent } = await api.post("/agents", {
        name: generatedData.agent_name,
        description: generatedData.description,
        flow_definition: generatedData.flow_definition,
      });
      toast.success("Agente criado! Adicione as credenciais em Integrações.");
      navigate(`/agents/${agent.id}/edit`);
    } catch (err) {
      toast.error("Erro ao salvar o agente.");
    } finally {
      setSaving(false);
    }
  }, [generatedData, navigate]);

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col" data-testid="create-agent-page">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
            data-testid="create-agent-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Voltar" : "Cancelar"}
          </button>
          <div className="w-px h-5 bg-zinc-800" />
          <Steps current={step} />
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Criar com IA</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── STEP 1: Prompt ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-950/50 border border-violet-800/50 rounded-full mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs text-violet-300 font-medium">Powered by AI</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "Cabinet Grotesk" }}>
                  Descreva seu agente
                </h1>
                <p className="text-zinc-400 text-sm">
                  Escreva em linguagem natural o que o agente deve fazer.<br />
                  A IA vai criar o fluxo visual automaticamente.
                </p>
              </div>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ex: Quero um agente que faça o atendimento do meu negócio via WhatsApp, qualifique os leads, verifique minha agenda no Google Calendar e marque consultas automaticamente..."
                  rows={6}
                  data-testid="create-agent-prompt-input"
                  onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleGenerate(); }}
                  className="w-full px-5 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30 transition-all resize-none leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 text-xs text-zinc-600">
                  {prompt.length} chars · ⌘+Enter
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || prompt.trim().length < 10}
                data-testid="create-agent-generate-btn"
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-zinc-950 rounded-lg font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando seu agente...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar com IA
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Examples */}
              <div className="mt-6">
                <p className="text-xs text-zinc-600 mb-3 text-center uppercase tracking-wider">Exemplos de prompts</p>
                <div className="space-y-2">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => { setPrompt(ex); textareaRef.current?.focus(); }}
                      data-testid={`prompt-example-${i}`}
                      className="w-full text-left px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-all"
                    >
                      {ex.length > 120 ? ex.slice(0, 120) + "…" : ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Visual Preview ──────────────────────────────── */}
        {step === 2 && generatedData && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Summary bar */}
            <div className="px-6 py-3 bg-zinc-900/80 border-b border-zinc-800 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {animComplete
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                    }
                    <h2 className="text-sm font-bold text-white truncate">{generatedData.agent_name}</h2>
                    <span className="shrink-0 text-xs px-2 py-0.5 bg-violet-950/50 text-violet-300 border border-violet-800/50 rounded-full">
                      {animatedNodes.length} / {generatedData.flow_definition.nodes.length} nós
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{generatedData.summary}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
                    data-testid="create-agent-edit-prompt-btn"
                  >
                    <ArrowLeft className="w-3 h-3" /> Editar prompt
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!animComplete}
                    data-testid="create-agent-next-btn"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-zinc-950 rounded text-xs font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-40"
                  >
                    {services.length > 0 ? "Configurar credenciais" : "Salvar agente"}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 relative" data-testid="create-agent-flow-canvas">
              <ReactFlowProvider>
                <FlowCanvas nodes={animatedNodes} edges={animatedEdges} />
              </ReactFlowProvider>

              {/* Generating overlay */}
              {!animComplete && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-full text-xs text-zinc-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  Desenhando fluxo... {animatedNodes.length} de {generatedData.flow_definition.nodes.length} nós
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Credentials ─────────────────────────────────── */}
        {step === 3 && generatedData && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Cabinet Grotesk" }}>
                  Configure as conexões
                </h2>
                <p className="text-sm text-zinc-400">
                  {services.length > 0
                    ? `Seu agente precisa de ${services.length} serviço(s) externo(s). Preencha as credenciais para ativá-lo.`
                    : "Seu agente não precisa de credenciais externas. Pronto para salvar!"}
                </p>
              </div>

              {/* Progress indicator */}
              {services.length > 0 && (
                <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500">Progresso das configurações</span>
                    <span className="text-xs font-semibold text-white">
                      {services.filter((svc, idx) =>
                        svc.fields.filter(f => f.required).every(f => credValues[idx]?.[f.key]?.trim())
                      ).length} / {services.length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${services.length === 0 ? 100 : (
                          services.filter((svc, idx) =>
                            svc.fields.filter(f => f.required).every(f => credValues[idx]?.[f.key]?.trim())
                          ).length / services.length * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Credential cards */}
              <div className="space-y-3 mb-8" data-testid="credential-wizard">
                {services.map((svc, idx) => (
                  <CredentialCard
                    key={idx}
                    service={svc}
                    values={credValues[idx] || {}}
                    onChange={(key, val) => setCredField(idx, key, val)}
                    expanded={expandedCard === idx}
                    onToggle={() => setExpandedCard(expandedCard === idx ? -1 : idx)}
                  />
                ))}
              </div>

              {/* No credentials needed */}
              {services.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-lg mb-8">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Pronto para publicar</p>
                    <p className="text-xs text-zinc-400">Este agente não requer credenciais externas.</p>
                  </div>
                </div>
              )}

              {/* Info box */}
              {services.length > 0 && !allRequiredFilled && (
                <div className="flex items-start gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg mb-4 text-xs text-zinc-400">
                  <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>
                    Você pode pular e configurar depois em <strong>Integrações</strong>. O agente ficará em modo simulado até as credenciais serem adicionadas.
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {services.length > 0 && (
                  <button
                    onClick={handleSkip}
                    disabled={saving}
                    data-testid="create-agent-skip-btn"
                    className="flex-1 px-4 py-3 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
                  >
                    Pular por agora
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || (services.length > 0 && !allRequiredFilled)}
                  data-testid="create-agent-save-btn"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-lg font-semibold text-sm hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> {services.length > 0 ? "Salvar e ir para o Builder" : "Criar Agente"}</>
                  )}
                </button>
              </div>

              {/* Agent summary */}
              <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Resumo do agente</span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{generatedData.agent_name}</p>
                <p className="text-xs text-zinc-400">{generatedData.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {generatedData.flow_definition.nodes.map(n => (
                    <span key={n.id} className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                      {n.data?.label || n.type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
