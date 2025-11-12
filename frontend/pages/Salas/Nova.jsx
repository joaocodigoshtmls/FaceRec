import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { useData } from "@/contexts/DataContext";

export default function NovaSalaPage() {
  const navigate = useNavigate();
  const { createSala } = useData();

  const [nomeSala, setNomeSala] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [status, setStatus] = useState(null); // { type: 'ok' | 'error', message }

  useDynamicTitle({
    title: "Nova sala · FaceRec",
    description: "Cadastre uma nova turma para gerenciar presença.",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus(null);

    const trimmedNome = nomeSala.trim();
    if (trimmedNome.length < 2) {
      setStatus({ type: "error", message: "Informe um nome com pelo menos 2 caracteres." });
      return;
    }

    const created = createSala({ nome: trimmedNome, periodo: periodo.trim() });
    if (created) {
      setStatus({ type: "ok", message: `Sala “${created.nome}” criada com sucesso.` });
      setTimeout(() => navigate("/salas"), 1200);
    }
  };

  return (
    <div className="login-scope min-h-[70vh] text-slate-200">
      <section className="glass mx-auto max-w-3xl rounded-2xl p-6 md:p-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="heading-gradient text-2xl font-semibold md:text-3xl">Cadastrar nova sala</h1>
            <p className="mt-1 text-sm text-slate-400">Defina o nome e o período para começar a acompanhar presença.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </header>

        {status?.message && (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${
              status.type === "ok"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          <div>
            <label className="mb-2 block text-xs text-slate-400">Nome da sala *</label>
            <input
              value={nomeSala}
              onChange={(event) => setNomeSala(event.target.value)}
              placeholder="Ex: 3º Ano A"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/40"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-400">Período (opcional)</label>
            <input
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
              placeholder="Manhã, Tarde, Integral..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/40"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#38bdf8] to-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Salvar sala
          </button>
        </form>
      </section>
    </div>
  );
}
