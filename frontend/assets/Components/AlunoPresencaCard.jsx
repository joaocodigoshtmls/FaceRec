import React from 'react';

export default function AlunoPresencaCard({ aluno, status, onToggle }) {
  const presenteAtivo = status === 'presente';
  const ausenteAtivo = status === 'ausente';
  const id = aluno?.id;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p className="font-medium text-white">{aluno?.nome || 'Aluno sem nome'}</p>
        <p className="text-xs text-slate-400">{aluno?.email || 'Sem email'}</p>
      </div>
      <div className="flex flex-col items-start gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => onToggle?.(id, 'presente')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60 ${
            presenteAtivo
              ? 'bg-emerald-500/80 text-slate-900 shadow-[0_10px_30px_rgba(16,185,129,0.35)]'
              : 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
          }`}
        >
          Presente
        </button>
        <button
          type="button"
          onClick={() => onToggle?.(id, 'ausente')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-rose-400/60 ${
            ausenteAtivo
              ? 'bg-rose-500/80 text-slate-900 shadow-[0_10px_30px_rgba(244,63,94,0.35)]'
              : 'border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
          }`}
        >
          Ausente
        </button>
      </div>
    </div>
  );
}
