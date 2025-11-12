
import React from "react";
import { Link } from "react-router-dom";
import { Camera } from "lucide-react";
import LogoCamera from "@/Components/LogoCamera";

export default function LoginFrame({ title = "Acesso FaceRec", subtitle, children }) {
  return (
    <div className="login-scope relative min-h-screen bg-[#0b1220] text-slate-200">
      {/* BG + partículas */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-[900px] w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -top-16 right-0 h-[700px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(0deg,transparent,rgba(148,163,184,0.04)),radial-gradient(800px_400px_at_80%_0%,rgba(56,189,248,0.10),transparent)]" />
      </div>

      {/* NAV mínima */}
      <nav className="sticky top-0 z-40 border-b border-white/5 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="group inline-flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
              <LogoCamera size={20} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">FaceRec</span>
          </Link>
          <Link
            to="/"
            className="rounded-xl bg-gradient-to-b from-[#ff8a3d] to-[#ff5c00] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_rgba(255,100,30,0.35)] hover:brightness-110"
          >
            Voltar
          </Link>
        </div>
      </nav>

      {/* Card central */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 px-6 py-10 md:grid-cols-2">
        <div className="hidden md:block" />
        <section className="glass rounded-2xl p-6 md:p-8">
          <header className="mb-6">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
              <LogoCamera size={20} />
            </div>
            <h1 className="heading-gradient text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </header>

          <div className="space-y-4">{children}</div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Ao continuar, você concorda com nossos Termos e Política de Privacidade.
          </p>
        </section>
      </main>
    </div>
  );
}
