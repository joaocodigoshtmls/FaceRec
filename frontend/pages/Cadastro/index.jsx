import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { 
  Eye, 
  EyeOff, 
  Brain, 
  Shield, 
  User, 
  Lock, 
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  Camera
} from "lucide-react";

export default function Cadastro() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: dados básicos · 2: perfil · 3: credenciais
  const [selectedRole, setSelectedRole] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const redirectTimeout = useRef(null);
  
  const navigate = useNavigate();
  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    const hasBasic = formData.fullName.trim().length >= 2 && formData.email && formData.phone;
    return hasBasic;
  };

  const validateStep2 = () => {
    return formData.password.length >= 6 && formData.password === formData.confirmPassword;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setErrorMessage("");
      setStep(2);
      return;
    }
    if (step === 2 && selectedRole) {
      setErrorMessage("");
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage("");
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setSelectedRole(null);
      setStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setStep(2);
      return;
    }

    if (!validateStep2()) {
      setErrorMessage("Verifique se as senhas coincidem e têm pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        // O backend atual exige 'subject'. Para Supervisor, usamos a string "Supervisor" para passar na validação.
        subject: selectedRole === 'supervisor' ? 'Supervisor' : 'Professor',
  // Observação: alguns backends ignoram este campo; mantemos para compatibilidade futura.
  role: selectedRole === 'supervisor' ? 'supervisor' : 'professor',
      };

      // Usar a rota consolidada /auth/register (definida em backend/routes/auth.js)
      const res = await api.post('/auth/register', payload);
      const data = res.data;
      
      if (data?.error) throw new Error(data.error);

      // Se o backend não retornar token, criamos um mock para permitir fluxo contínuo (login imediato opcional futuramente)
      if (data?.token) {
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new CustomEvent('authTokenSet', { detail: { token: data.token, source: 'signup' } }));
      }
      
      // Sucesso - redireciona para login
      setErrorMessage("");
  setSuccessMessage("Conta FaceRec criada com sucesso! Redirecionando para o login...");
      redirectTimeout.current = setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Erro no cadastro";
      console.error("Erro no cadastro:", message);
      setErrorMessage(message);
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  // título dinâmico
  useDynamicTitle({
    title: "Criar conta · FaceRec",
    description: "Cadastre-se para começar a usar chamadas com presença validada automaticamente.",
  });

  return (
    <div className="login-scope relative min-h-screen bg-[#0b1220] text-slate-200">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[900px] h-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -top-16 right-0 w-[700px] h-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(0deg,transparent,rgba(148,163,184,0.04)),radial-gradient(800px_400px_at_80%_0%,rgba(56,189,248,0.10),transparent)]" />
      </div>

  <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-6 py-12">
        <section className="glass w-full max-w-2xl rounded-2xl p-6 md:p-10">
          <header className="mb-6">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <h1 className="heading-gradient text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              Criar conta
            </h1>
            <p className="mt-1 text-sm text-slate-400">Cadastre-se para usar o FaceRec</p>
          </header>

          {successMessage && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nome Completo</label>
                    <div className="input-row">
                      <User className="icon h-4 w-4" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder=""
                        className="input-dark with-icon"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Email FaceRec</label>
                    <div className="input-row">
                      <Mail className="icon h-4 w-4" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder=""
                        className="input-dark with-icon"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Telefone</label>
                    <div className="input-row">
                      <Phone className="icon h-4 w-4" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder=""
                        className="input-dark with-icon"
                      />
                    </div>
                  </div>
                </div>

                {/* Botão Próximo */}
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!validateStep1()}
                  className="btn-primary"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>Próxima Etapa</span>
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-sm text-slate-400">Escolha o tipo de acesso. Você pode alterar depois nas configurações.</p>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('professor')}
                    className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-sky-400/40 hover:bg-white/10 ${selectedRole === 'professor' ? 'border-sky-400/50 bg-sky-400/10' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/20 text-sky-200">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-white">Professor</p>
                        <p className="text-xs text-slate-400">Dar aulas, fazer chamadas, importar alunos.</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('supervisor')}
                    className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-amber-400/40 hover:bg-white/10 ${selectedRole === 'supervisor' ? 'border-amber-400/50 bg-amber-400/10' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/20 text-amber-200">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-white">Supervisor</p>
                        <p className="text-xs text-slate-400">Acompanhar relatórios e monitoramento.</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handlePrevStep} className="btn-ghost flex-1">
                    <span className="inline-flex items-center gap-2 justify-center w-full">
                      <ArrowLeft className="w-5 h-5" />
                      <span>Voltar</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!selectedRole || !!successMessage}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2 justify-center">
                      <span>Avançar</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-slate-200">
                    {selectedRole === 'supervisor' ? 'Supervisor' : 'Professor'}
                  </span>
                  <button type="button" className="text-sky-300 hover:text-sky-200" onClick={() => setStep(2)}>
                    Trocar perfil
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Confirmar Senha</label>
                    <div className="input-row">
                      <Shield className="icon h-4 w-4" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder=""
                        className="input-dark with-icon pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-2 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-slate-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Força da Senha</span>
                    <span className={`font-medium ${
                      formData.password.length >= 8 ? 'text-green-400' : 
                      formData.password.length >= 6 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {formData.password.length >= 8 ? 'Forte' : 
                       formData.password.length >= 6 ? 'Média' : 'Fraca'}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full">
                    <div className={`h-2 rounded-full transition-all duration-300 ${
                      formData.password.length >= 8 ? 'w-full bg-green-500' :
                      formData.password.length >= 6 ? 'w-2/3 bg-yellow-500' : 'w-1/3 bg-red-500'
                    }`} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn-ghost flex-1"
                  >
                    <span className="inline-flex items-center gap-2 justify-center w-full">
                      <ArrowLeft className="w-5 h-5" />
                      <span>Voltar</span>
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !validateStep2() || !!successMessage}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Registrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Brain className="w-5 h-5" />
                        <span>Criar Conta</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Ao continuar, você concorda com nossos Termos e Política de Privacidade.
          </p>
        </section>
      </main>
    </div>
  );
}
