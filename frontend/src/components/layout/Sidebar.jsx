import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Bot, FileText, Zap, Plug, Map, Activity,
  Settings, ChevronLeft, ChevronRight, LogOut, Building2
} from "lucide-react";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/agents", icon: Bot, label: "Agentes" },
  { to: "/templates", icon: FileText, label: "Templates" },
  { to: "/skills", icon: Zap, label: "Skills" },
  { to: "/integrations", icon: Plug, label: "Integrações" },
  { to: "/mindmap", icon: Map, label: "Mapa Mental" },
  { to: "/executions", icon: Activity, label: "Execuções" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      data-testid="sidebar"
      className={`flex flex-col h-screen bg-zinc-950 border-r border-zinc-800 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-zinc-800 shrink-0">
        <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-zinc-950" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight truncate">AI Studio</p>
            <p className="text-xs text-zinc-500 truncate">Click Massa</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto" data-testid="sidebar-nav">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={`sidebar-item-${label.toLowerCase().replace(/\s/g, "-")}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-zinc-800 p-2 space-y-0.5">
        <NavLink
          to="/settings"
          data-testid="sidebar-settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150 ${
              isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </NavLink>

        {/* Workspace info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md">
            <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-400 truncate">{user.name}</p>
              <p className="text-xs text-zinc-600 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          data-testid="sidebar-logout-button"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors duration-150 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        data-testid="sidebar-collapse-btn"
        className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
