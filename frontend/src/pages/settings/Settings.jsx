import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, Building2, Shield, LogOut } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="p-8 max-w-3xl animate-fade-in" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>Configurações</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Gerencie seu workspace e conta</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">Perfil</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Nome</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300">{user?.name}</div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Email</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300">{user?.email}</div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Papel</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">Workspace</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Tenant ID</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-500 font-mono truncate">{user?.tenant_id}</div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1.5">Plano</label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300 capitalize">Trial</div>
            </div>
          </div>
        </div>

        {/* Architecture Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">Stack & Arquitetura</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Frontend", "React 19 + TailwindCSS + Shadcn/UI"],
              ["Backend", "FastAPI + Motor (MongoDB)"],
              ["Auth", "JWT (httpOnly cookies + Bearer)"],
              ["Builder", "React Flow (@xyflow/react)"],
              ["LLM Provider", "Mock (plugável — OpenAI/Claude/Gemini)"],
              ["Click Massa", "Mock Connector (service layer pronto)"],
              ["External Connectors", "REST, Webhook, Voice (stubs prontos)"],
              ["MCP Future", "Interfaces abstratas preparadas"],
            ].map(([k, v]) => (
              <div key={k} className="bg-zinc-950 border border-zinc-800 rounded p-3">
                <p className="text-zinc-500 mb-0.5">{k}</p>
                <p className="text-zinc-300 font-medium">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-zinc-900 border border-red-900/30 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-red-400 mb-3">Zona de Perigo</h2>
          <button
            onClick={handleLogout}
            data-testid="settings-logout-btn"
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-800/50 rounded hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
