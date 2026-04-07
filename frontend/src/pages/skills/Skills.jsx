import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Zap, Plus, X, Trash2 } from "lucide-react";

const CATEGORIES = ["todos", "vendas", "atendimento", "agendamento", "crm", "análise", "voz", "custom"];
const CAT_COLORS = {
  vendas: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",
  atendimento: "text-blue-400 bg-blue-950/40 border-blue-800/50",
  agendamento: "text-cyan-400 bg-cyan-950/40 border-cyan-800/50",
  crm: "text-purple-400 bg-purple-950/40 border-purple-800/50",
  análise: "text-yellow-400 bg-yellow-950/40 border-yellow-800/50",
  voz: "text-orange-400 bg-orange-950/40 border-orange-800/50",
  custom: "text-zinc-400 bg-zinc-900 border-zinc-700",
};

const EMPTY_FORM = { name: "", description: "", category: "custom", prompt_base: "", guardrails: [] };

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [category, setCategory] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [guardrailInput, setGuardrailInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/skills")
      .then(({ data }) => setSkills(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === "todos" ? skills : skills.filter((s) => s.category === category);

  const addGuardrail = () => {
    if (!guardrailInput.trim()) return;
    setForm({ ...form, guardrails: [...form.guardrails, guardrailInput.trim()] });
    setGuardrailInput("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/skills", form);
      setSkills((prev) => [...prev, data]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSkill = async (id) => {
    if (!window.confirm("Excluir esta skill?")) return;
    try {
      await api.delete(`/skills/${id}`);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Não é possível excluir skills nativas.");
    }
  };

  return (
    <div className="p-8 max-w-6xl animate-fade-in" data-testid="skills-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>Skills</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Capacidades reutilizáveis dos seus agentes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          data-testid="skill-create-btn"
          className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Skill
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            data-testid={`skill-filter-${cat}`}
            className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${
              category === cat
                ? "bg-white text-zinc-950 border-white"
                : "text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((skill) => {
            const catCls = CAT_COLORS[skill.category] || CAT_COLORS.custom;
            return (
              <div
                key={skill.id}
                data-testid={`skill-card-${skill.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${catCls}`}>
                      {skill.category}
                    </span>
                    {!skill.is_native && (
                      <button onClick={() => deleteSkill(skill.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{skill.name}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2">{skill.description}</p>
                {skill.is_native && (
                  <span className="mt-2 inline-block text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">Nativa</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create skill modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-lg shadow-2xl" data-testid="skill-form-modal">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Nova Skill</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 uppercase font-semibold tracking-wider mb-1.5">Nome</label>
                <input
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="Nome da skill"
                  data-testid="skill-name-input"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 uppercase font-semibold tracking-wider mb-1.5">Descrição</label>
                <textarea
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="O que esta skill faz?" rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 uppercase font-semibold tracking-wider mb-1.5">Categoria</label>
                <select
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                >
                  {["vendas", "atendimento", "agendamento", "crm", "análise", "voz", "custom"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 uppercase font-semibold tracking-wider mb-1.5">Prompt Base</label>
                <textarea
                  value={form.prompt_base} onChange={(e) => setForm({ ...form, prompt_base: e.target.value })}
                  placeholder="Instrução principal desta skill..." rows={3}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white resize-none font-mono text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm text-zinc-400 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} data-testid="skill-save-btn"
                  className="flex-1 py-2 text-sm bg-white text-zinc-950 font-semibold rounded hover:bg-zinc-100 transition-colors disabled:opacity-50">
                  {saving ? "Salvando..." : "Criar Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
