import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import AgentsList from "@/pages/agents/AgentsList";
import AgentBuilder from "@/pages/agents/AgentBuilder";
import Templates from "@/pages/templates/Templates";
import Skills from "@/pages/skills/Skills";
import Integrations from "@/pages/integrations/Integrations";
import MindMap from "@/pages/mindmap/MindMap";
import Executions from "@/pages/executions/Executions";
import Settings from "@/pages/settings/Settings";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route
            path="/"
            element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="agents" element={<AgentsList />} />
            <Route path="agents/new" element={<AgentBuilder />} />
            <Route path="agents/:id/edit" element={<AgentBuilder />} />
            <Route path="templates" element={<Templates />} />
            <Route path="skills" element={<Skills />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="mindmap" element={<MindMap />} />
            <Route path="executions" element={<Executions />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
