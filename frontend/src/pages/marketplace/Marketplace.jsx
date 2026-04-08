import { useState, useMemo } from "react";
import { Store, Search, CheckCircle2, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";
import { MCP_CATALOG, MCP_CATEGORIES } from "@/data/mcpCatalog";

// ─── MCP Card ────────────────────────────────────────────────────────────────
function McpCard({ mcp, installed, onInstall }) {
  return (
    <div
      data-testid={`mcp-card-${mcp.id}`}
      className={`bg-zinc-900 border rounded-lg p-4 flex flex-col gap-3 hover:border-zinc-600 transition-all duration-200 ${
        installed ? "border-emerald-800/60" : "border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xl shrink-0">
            {mcp.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white truncate">{mcp.name}</p>
              {mcp.popular && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-950/50 text-amber-400 border border-amber-800/40 rounded-full shrink-0">
                  Popular
                </span>
              )}
              {mcp.official && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-950/50 text-blue-400 border border-blue-800/40 rounded-full shrink-0">
                  Oficial
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">{mcp.category}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400 flex-1 leading-relaxed">{mcp.description}</p>

      <div className="flex items-center gap-2 pt-1">
        {installed ? (
          <div
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-950/30 border border-emerald-800/50 rounded text-xs font-semibold text-emerald-400"
            data-testid={`mcp-installed-${mcp.id}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Instalado
          </div>
        ) : (
          <button
            onClick={() => onInstall(mcp)}
            data-testid={`mcp-install-btn-${mcp.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded text-xs font-semibold text-white transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Instalar
          </button>
        )}
        <button
          className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors"
          title="Ver documentação"
          data-testid={`mcp-docs-${mcp.id}`}
        >
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Marketplace ─────────────────────────────────────────────────────────────
export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [installed, setInstalled] = useState(new Set(["clickmassa"]));

  const filtered = useMemo(() => {
    return MCP_CATALOG.filter(mcp => {
      const matchSearch = !search || (
        mcp.name.toLowerCase().includes(search.toLowerCase()) ||
        mcp.description.toLowerCase().includes(search.toLowerCase()) ||
        mcp.category.toLowerCase().includes(search.toLowerCase())
      );
      const matchCat = category === "Todos" || mcp.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const popular = useMemo(() => MCP_CATALOG.filter(m => m.popular), []);

  const handleInstall = (mcp) => {
    setInstalled(prev => {
      const next = new Set(prev);
      next.add(mcp.id);
      return next;
    });
    toast.success(`${mcp.name} instalado! Configure as credenciais em Integrações.`);
  };

  return (
    <div className="p-8 max-w-7xl animate-fade-in" data-testid="marketplace-page">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center">
              <Store className="w-4 h-4 text-zinc-300" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "Cabinet Grotesk" }}>
              Marketplace
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            MCPs, skills e integrações prontas para adicionar aos seus agentes.
            {installed.size > 0 && (
              <span className="ml-2 text-emerald-400">{installed.size} instalado(s)</span>
            )}
          </p>
        </div>
      </div>

      {/* Popular highlight */}
      {category === "Todos" && !search && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Mais populares
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {popular.map(mcp => (
              <button
                key={mcp.id}
                onClick={() => handleInstall(mcp)}
                data-testid={`popular-chip-${mcp.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  installed.has(mcp.id)
                    ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                <span>{mcp.icon}</span>
                {mcp.name}
                {installed.has(mcp.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar integrações..."
            data-testid="marketplace-search"
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 shrink-0">
          {MCP_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              data-testid={`marketplace-filter-${cat.toLowerCase().replace(/\s/g, "-")}`}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                category === cat
                  ? "bg-white text-zinc-950 border-transparent"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-zinc-600 mb-4">
        {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        {search && ` para "${search}"`}
        {category !== "Todos" && ` em ${category}`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Store className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Nenhuma integração encontrada</p>
          <button
            onClick={() => { setSearch(""); setCategory("Todos"); }}
            className="mt-2 text-xs text-zinc-400 hover:text-white"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-testid="marketplace-grid"
        >
          {filtered.map(mcp => (
            <McpCard
              key={mcp.id}
              mcp={mcp}
              installed={installed.has(mcp.id)}
              onInstall={handleInstall}
            />
          ))}
        </div>
      )}

      {/* Coming soon banner */}
      <div className="mt-10 p-4 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl text-center">
        <p className="text-xs text-zinc-600">
          Mais integrações em breve · Conectar ao registry oficial de MCPs na Fase 2 ·
          <button className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors">
            Sugerir integração
          </button>
        </p>
      </div>
    </div>
  );
}
