import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, signInWithPopup } from "../../firebase";
import { motion } from "framer-motion";
import api, { apiBaseURL } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import useDynamicTitle from "@/lib/useDynamicTitle";
import {
  Eye,
  EyeOff,
  Brain,
  Shield,
  Zap,
  Network,
  Target,
  User,
  Lock,
  Mail,
  Chrome,
  Camera
} from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'info', message }
  const navigate = useNavigate();
  const API_BASE = apiBaseURL;
  const { updateUser } = useUser();

  // (Removido: highlights não essenciais ao fluxo de autenticação)

  // título da página
  useDynamicTitle({
    title: "Entrar · FaceRec",
    description: "Faça login para acessar o painel e gerenciar presenças com reconhecimento facial.",
  });

  // Remove debug/mocks: sem funções de teste no console

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      // Envia dados mínimos para o backend associar/registrar
      const payload = {
        firebaseUid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        idToken, // opcional para futura validação no backend
      };
      const { data } = await api.post('/auth/firebase-login', payload);
      if (!data?.token || !data?.user) throw new Error('Falha ao autenticar com o servidor');
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent('authTokenSet', { detail: { token: data.token, source: 'google' } }));
      updateUser(data.user);
      setFeedback(null);
      const nextRoute = (data.user.role === 'supervisor') ? '/dados' : '/salas';
      navigate(nextRoute, { replace: true });
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setFeedback({ type: 'error', message: 'Falha no login com Google.' });
    } finally {
      setLoading(false);
    }
  };

  // Sem credenciais mock: todo login deve passar pela API

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const emailInput = (formData.email || '').trim();
      const fallbackDisplayName = (() => {
        if (!emailInput) return 'Usuário FaceRec';
        if (!emailInput.includes('@')) return emailInput;
        const before = emailInput.split('@')[0];
        return before || 'Usuário FaceRec';
      })();
      const { data } = await api.post('/api/login', { email: emailInput, login: emailInput, password: formData.password });
      if (!data?.token || !data?.user?.id) throw new Error(data?.error || 'Erro no login');
      localStorage.setItem('token', data.token);
      const apiUser = data.user;
      const role = apiUser.role === 'supervisor' ? 'supervisor' : 'professor';
      const usuario = {
        id: apiUser.id,
        email: apiUser.email || emailInput,
        full_name: apiUser.full_name || fallbackDisplayName,
        profile_picture: apiUser.profile_picture || '',
        photoURL: apiUser.photoURL || apiUser.profile_picture || '',
        role,
        tipo: role,
        subject: apiUser.subject || '',
        school: apiUser.school || '',
        phone: apiUser.phone || '',
        cpf: apiUser.cpf || '',
        classes: Array.isArray(apiUser.classes) ? apiUser.classes : [],
      };
      localStorage.setItem('usuario', JSON.stringify(usuario));
      window.dispatchEvent(new CustomEvent('authTokenSet', { detail: { token: data.token, source: 'api-login' } }));
      updateUser(usuario);
      navigate(role === 'supervisor' ? '/dados' : '/salas', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro no login';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-scope relative min-h-screen bg-[#0b1220] text-slate-200">
      {/* Fundo igual ao hero */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[900px] h-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -top-16 right-0 w-[700px] h-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(0deg,transparent,rgba(148,163,184,0.04)),radial-gradient(800px_400px_at_80%_0%,rgba(56,189,248,0.10),transparent)]" />
      </div>

      {/* Card central estilo glass (centralizado) */}
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6 py-10">
        <section className="glass w-full max-w-md rounded-2xl p-6 md:p-8">
          <header className="mb-6">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <h1 className="heading-gradient text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              Acesso FaceRec
            </h1>
            <p className="mt-1 text-sm text-slate-400">Entre no sistema de chamada</p>
          </header>

          {feedback?.message && (
            <div className={`mb-5 rounded-xl border p-3 text-sm ${
              feedback.type === 'error'
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                : 'border-sky-400/40 bg-sky-400/10 text-sky-200'
            }`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email ou login FaceRec</label>
              <div className="input-row">
                <Mail className="icon h-4 w-4" />
                <input
                  type="text"
                  inputMode="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  placeholder="Digite seu e-mail ou login"
                  className="input-dark with-icon"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Senha de Acesso</label>
              <div className="input-row">
                <Lock className="icon h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="input-dark with-icon pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5" />
                  <span>Acessar Sistema</span>
                </div>
              )}
            </button>

            <button type="button" onClick={handleGoogleLogin} className="btn-ghost">
              <span className="inline-flex items-center gap-2">
                <Chrome className="w-5 h-5" />
                Entrar com Google
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Ao continuar, você concorda com nossos Termos e Política de Privacidade.
          </p>
        </section>
      </main>
    </div>
  );
}
