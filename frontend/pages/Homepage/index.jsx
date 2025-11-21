import React from "react";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2, Sparkles } from "lucide-react";
import LogoCamera from "@/Components/LogoCamera";

export default function Homepage() {
  useDynamicTitle({
    title: "FaceRec · Videoconferências inteligentes com Reconhecimento Facial",
    description: "Presença verificada em segundos, registros seguros e uma experiência simples para professores e alunos.",
  });

  return (
    <div className="relative min-h-screen text-slate-200 bg-[#0b1220]">
      {/* Backgrounds/particles */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[800px] h-[800px] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -top-16 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(0deg,transparent,rgba(148,163,184,0.04)),radial-gradient(800px_400px_at_80%_0%,rgba(56,189,248,0.10),transparent)]" />
      </div>

      {/* HERO */}
  <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-24 pt-16 md:grid-cols-2 md:pt-24">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-slate-300">
            <Sparkles className="h-3.5 w-3.5" /> Reconhecimento Facial de Nova Geração
          </p>
          <h1 className="heading-gradient mb-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Videoconferências inteligentes com <span className="text-[#00D9FF]">Reconhecimento Facial</span>
          </h1>
          <p className="mb-8 max-w-xl text-slate-400">
            Chamada automática com presença verificada em segundos — registros seguros e uma experiência simples para professores e alunos.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/cadastro"
              className="rounded-xl bg-gradient-to-b from-[#00D9FF] to-[#0288D1] px-5 py-3 font-medium text-[#0A1929] shadow-[0_8px_20px_rgba(2,136,209,0.45)] hover:brightness-110"
            >
              Cadastrar
            </Link>
            <a
              href="#salas"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white/90 hover:bg-white/[0.08]"
            >
              Ver demo
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 opacity-80">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-sky-300" />
              <span className="text-sm text-slate-300">LGPD-ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span className="text-sm text-slate-300">Presença confirmada</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="glass w-full max-w-md rounded-3xl p-6">
            <div className="flex items-center justify-between text-sm font-medium text-slate-200">
              <span className="text-white">Escolas</span>
              <span className="text-slate-400">Professores</span>
              <span className="text-slate-400">Universidades</span>
            </div>
            <div className="mt-4 h-24 rounded-2xl bg-white/5 ring-1 ring-white/10" />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
  <section id="salas" className="relative border-t border-white/5 bg-black/20 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-white">Como funciona</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: <LogoCamera size={20} />, title: "Abrir sala", text: "Inicie a aula pelo navegador." },
              { icon: <Sparkles className="h-5 w-5" />, title: "Detectar rostos", text: "O sistema reconhece e cruza com a lista." },
              { icon: <CheckCircle2 className="h-5 w-5" />, title: "Reg presença", text: "Confirma automaticamente — em segundos." },
            ].map((item, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <div className="text-white">{item.icon}</div>
                </div>
                <div className="mb-1 font-medium text-white">{item.title}</div>
                <div className="text-sm text-slate-400">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-sm text-slate-400 md:flex-row">
          <div className="flex items-center gap-2">
            <LogoCamera size={16} />
            <span>FaceRec</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#salas">Salas</a>
            <a href="#dados">Dados</a>
            <a href="#relatorios">Relatórios</a>
            <a href="#monitoramento">Monitoramento</a>
          </div>
          <div className="text-xs">Privacidade · Termos</div>
        </div>
      </footer>
    </div>
  );
}