import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatError } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left — Form */}
      <div className="flex flex-col justify-center w-full max-w-md px-8 py-12 lg:px-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-white rounded-md flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#09090B" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>AI Studio</p>
            <p className="text-xs text-zinc-500">by AI Studio</p>
          </div>
        </div>

        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2" style={{fontFamily: 'Cabinet Grotesk'}}>
            Entrar na plataforma
          </h1>
          <p className="text-zinc-400 text-sm">Acesse seu workspace de agentes de IA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              data-testid="login-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <input
              data-testid="login-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
            />
          </div>

          {error && (
            <div data-testid="login-error" className="px-3.5 py-2.5 bg-red-950/50 border border-red-800/50 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            data-testid="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Não tem uma conta?{" "}
          <Link to="/register" className="text-white hover:text-zinc-300 transition-colors font-medium">
            Criar conta
          </Link>
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 mb-2">Conta demo disponível em desenvolvimento</p>
            <p className="text-xs text-zinc-500">admin@clickmassa.com / admin123</p>
          </div>
        )}
      </div>

      {/* Right — Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/e6cb7685-ce5d-448a-9a88-5ef7dab79f79/images/e93c846b1a2a8fe86e55a9b5a19ab6d1534cf03b7ccaa98ea9fc24a06679fe8f.png"
          alt="AI Studio background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-2xl font-bold text-white tracking-tight mb-2" style={{fontFamily: 'Cabinet Grotesk'}}>
            Transforme estratégia em execução automatizada
          </p>
          <p className="text-zinc-400 text-sm">
            Crie, configure e publique agentes de IA sem escrever código.
          </p>
        </div>
      </div>
    </div>
  );
}
