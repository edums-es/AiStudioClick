import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { FileText, Tag, Copy, Search } from "lucide-react";

const CATEGORY_COLORS = {
  vendas: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",
  agendamento: "text-blue-400 bg-blue-950/40 border-blue-800/50",
  reengajamento: "text-orange-400 bg-orange-950/40 border-orange-800/50",
  "pós-venda": "text-purple-400 bg-purple-950/40 border-purple-800/50",
  suporte: "text-cyan-400 bg-cyan-950/40 border-cyan-800/50",
  financeiro: "text-yellow-400 bg-yellow-950/40 border-yellow-800/50",
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/templates")
      .then(({ data }) => { setTemplates(data); setFiltered(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(templates.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    ));
  }, [search, templates]);

  const cloneTemplate = async (id) => {
    const { data } = await api.post(`/templates/${id}/clone`);
    navigate(`/agents/${data.id}/edit`);
  };

  return (
    <div className="p-8 max-w-6xl animate-fade-in" data-testid="templates-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>Templates</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Biblioteca de fluxos prontos para usar</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar templates..."
            data-testid="template-search"
            className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white focus:border-white w-60"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((template) => {
            const catCls = CATEGORY_COLORS[template.category] || "text-zinc-400 bg-zinc-900 border-zinc-700";
            return (
              <div
                key={template.id}
                data-testid={`template-card-${template.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${catCls}`}>
                    {template.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-xs text-zinc-500 flex-1 mb-3 line-clamp-2">{template.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => cloneTemplate(template.id)}
                  data-testid={`template-use-btn-${template.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold text-zinc-200 border border-zinc-700 rounded hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Usar este template
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
