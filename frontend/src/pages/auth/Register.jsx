import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatError } from "@/lib/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <div className="flex flex-col justify-center w-full max-w-md px-8 py-12 lg:px-12">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-white rounded-md flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#09090B" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight" style={{fontFamily: 'Cabinet Grotesk'}}>AI Studio</p>
            <p className="text-xs text-zinc-500">Click Massa</p>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2" style={{fontFamily: 'Cabinet Grotesk'}}>
            Criar sua conta
          </h1>
          <p className="text-zinc-400 text-sm">Comece a construir agentes de IA hoje</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Nome completo
            </label>
            <input
              data-testid="register-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              data-testid="register-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <input
              data-testid="register-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
            />
          </div>

          {error && (
            <div data-testid="register-error" className="px-3.5 py-2.5 bg-red-950/50 border border-red-800/50 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            data-testid="register-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-white text-zinc-950 rounded-md text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-white hover:text-zinc-300 transition-colors font-medium">
            Entrar
          </Link>
        </p>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/e6cb7685-ce5d-448a-9a88-5ef7dab79f79/images/e93c846b1a2a8fe86e55a9b5a19ab6d1534cf03b7ccaa98ea9fc24a06679fe8f.png"
          alt="AI Studio background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-2xl font-bold text-white tracking-tight mb-2" style={{fontFamily: 'Cabinet Grotesk'}}>
            Seu workspace de agentes de IA
          </p>
          <p className="text-zinc-400 text-sm">
            Multi-tenant, visual builder, templates prontos e integração nativa ao Click Massa.
          </p>
        </div>
      </div>
    </div>
  );
}
