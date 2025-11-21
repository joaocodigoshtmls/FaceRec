import React, { useMemo, useState } from "react";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { useData } from "@/contexts/DataContext";
import { ArrowLeft, BarChart3, CheckCircle2, Download, Filter, PercentCircle, Search, User2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/Components/PageShell";
import GlassSection from "@/Components/GlassSection";
import PageHeader from "@/Components/PageHeader";
import ActionButton from "@/Components/ActionButton";

function normalizeId(v) {
  if (v === undefined || v === null) return null;
  return String(v);
}

function calcPercent(present, total) {
  if (!total) return 0;
  return Math.round((present / total) * 100);
}

export default function RelatoriosPage() {
  useDynamicTitle({
    title: "Relatórios · FaceRec",
    description: "Médias de presença por sala e aluno, calculadas em tempo real.",
  });

  const navigate = useNavigate();
  const { salas, alunos } = useData();
  const [selectedSalaId, setSelectedSalaId] = useState(() => (salas[0]?.id ? normalizeId(salas[0].id) : null));
  const [selectedAlunoId, setSelectedAlunoId] = useState(null);
  const [searchAluno, setSearchAluno] = useState("");

  const selectedSala = useMemo(() => salas.find((s) => normalizeId(s.id) === selectedSalaId) || null, [salas, selectedSalaId]);
  const alunosDaSala = useMemo(() => {
    if (!selectedSala) return [];
    return alunos.filter((a) => normalizeId(a.salaId) === normalizeId(selectedSala.id));
  }, [alunos, selectedSala]);

  const alunosFiltrados = useMemo(() => {
    const term = searchAluno.trim().toLowerCase();
    const base = alunosDaSala;
    if (!term) return base;
    return base.filter((a) => String(a.nome || "").toLowerCase().includes(term));
  }, [alunosDaSala, searchAluno]);

  // Regras de cálculo: como ainda não persistimos presenças, usamos um mock simples
  // baseado na flag ativo (apenas para demonstrar o comportamento da UI).
  const totalAulasMock = 20; // quantidade de encontros no período (ajustável depois)

  const salaStats = useMemo(() => {
    if (!selectedSala) return { total: 0, presentes: 0, percent: 0 };
    const total = alunosDaSala.length * totalAulasMock;
    const presentes = alunosDaSala.reduce((acc, a) => acc + (a.ativo ? Math.floor(totalAulasMock * 0.85) : Math.floor(totalAulasMock * 0.5)), 0);
    return { total, presentes, percent: calcPercent(presentes, total) };
  }, [alunosDaSala, selectedSala]);

  const alunoSelecionado = useMemo(() => alunos.find((a) => normalizeId(a.id) === selectedAlunoId) || null, [alunos, selectedAlunoId]);
  const alunoStats = useMemo(() => {
    if (!alunoSelecionado) return { total: 0, presentes: 0, percent: 0 };
    const total = totalAulasMock;
    const presentes = alunoSelecionado.ativo ? Math.floor(totalAulasMock * 0.9) : Math.floor(totalAulasMock * 0.6);
    return { total, presentes, percent: calcPercent(presentes, total) };
  }, [alunoSelecionado]);

  const resumoHeader = selectedAlunoId ? `Aluno: ${alunoSelecionado?.nome || "—"}` : selectedSala ? `Sala: ${selectedSala.nome}` : "Relatórios";

  return (
    <PageShell>
      <GlassSection>
        <PageHeader
          title="Relatórios"
          description="Médias calculadas em tempo real por sala e por aluno."
          showBackButton
          actions={
            <>
              <ActionButton variant="outlined" icon={Download}>
                Exportar CSV (mock)
              </ActionButton>
              {selectedAlunoId && (
                <ActionButton
                  variant="success"
                  icon={BarChart3}
                  onClick={() => setSelectedAlunoId(null)}
                >
                  Ver sala inteira
                </ActionButton>
              )}
            </>
          }
        />

        {/* Filtros */}
        <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Selecione a sala</p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <select
                value={selectedSalaId || ""}
                onChange={(e) => {
                  setSelectedSalaId(e.target.value || null);
                  setSelectedAlunoId(null);
                }}
                className="report-field w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
              >
                {salas.map((s) => (
                  <option key={s.id} value={normalizeId(s.id) || ""} className="bg-slate-900">
                    {s.nome}
                  </option>
                ))}
                {!salas.length && <option>(sem salas)</option>}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Filtrar aluno (opcional)</p>
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4 text-slate-400" />
              <input
                value={searchAluno}
                onChange={(e) => setSearchAluno(e.target.value)}
                placeholder="Buscar por nome"
                className="report-field w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
              />
              <button
                onClick={() => setSearchAluno("")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
              >
                <Filter className="h-3.5 w-3.5" /> Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Métricas principais */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5">
            <p className="text-sm font-medium text-emerald-200">Média de presença ({selectedAlunoId ? "aluno" : "sala"})</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-emerald-200">{selectedAlunoId ? alunoStats.percent : salaStats.percent}%</p>
                <p className="text-xs text-emerald-200/70">{resumoHeader}</p>
              </div>
              <PercentCircle className="h-10 w-10 text-emerald-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-slate-300">Cálculo</p>
            <div className="mt-2 text-xs text-slate-400">
              {selectedAlunoId ? (
                <p>
                  Presentes: <b className="text-slate-200">{alunoStats.presentes}</b> de <b className="text-slate-200">{alunoStats.total}</b> aulas.
                </p>
              ) : (
                <p>
                  Presentes: <b className="text-slate-200">{salaStats.presentes}</b> de <b className="text-slate-200">{salaStats.total}</b> totais de alunos×aulas.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-slate-300">Amostra de dados</p>
            <p className="mt-2 text-xs text-slate-400">
              Usamos um período exemplo de <b className="text-slate-200">{totalAulasMock}</b> aulas para este cálculo em tempo real.
            </p>
          </div>
        </div>

        {/* Tabela de alunos da sala */}
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Alunos da sala</h2>
              <p className="text-xs text-slate-400">Clique em um aluno para ver a média individual</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              <Search className="h-3.5 w-3.5" /> {alunosFiltrados.length} aluno(s)
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Média estimada</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map((a) => {
                  const percent = a.ativo ? 90 : 60;
                  return (
                    <tr
                      key={a.id}
                      className={`border-t border-white/5 hover:bg-white/5 cursor-pointer ${selectedAlunoId === normalizeId(a.id) ? "bg-white/10" : ""}`}
                      onClick={() => setSelectedAlunoId((prev) => (prev === normalizeId(a.id) ? null : normalizeId(a.id)))}
                    >
                      <td className="px-4 py-3 text-slate-200">{a.nome}</td>
                      <td className="px-4 py-3 text-slate-400">{a.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${a.ativo ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30" : "bg-amber-500/15 text-amber-200 border border-amber-400/30"}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> {a.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{percent}%</td>
                    </tr>
                  );
                })}
                {!alunosFiltrados.length && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={4}>
                      Nenhum aluno encontrado para esta sala.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassSection>
    </PageShell>
  );
}
