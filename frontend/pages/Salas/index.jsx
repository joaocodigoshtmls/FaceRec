import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, LayoutGrid, Calendar, Trash2, ArrowRight, ClipboardList, SortAsc, SortDesc, ArrowLeft } from "lucide-react";
import AlunoPresencaCard from "@/assets/Components/AlunoPresencaCard";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { useData } from "@/contexts/DataContext";

export default function SalasPage() {
  const navigate = useNavigate();
  const { salas, alunos, deleteSala } = useData();
  const [presence, setPresence] = useState({});

  React.useEffect(() => {
    const idsSalas = salas.map(s => s.id);
    const distinctSalaIdsFromAlunos = Array.from(new Set(alunos.map(a => a.salaId).filter(Boolean)));
    console.log('[SalasPage] render', {
      salas: salas.length,
      alunos: alunos.length,
      idsSalas,
      distinctSalaIdsFromAlunos,
      mismatch: distinctSalaIdsFromAlunos.filter(id => !idsSalas.includes(id)),
    });
  }, [salas, alunos]);

  const [status, setStatus] = useState(null); // { type: 'ok' | 'error', message }
  const [selectedSalaId, setSelectedSalaId] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [pendingSala, setPendingSala] = useState(null);
  const [isDeletingSala, setIsDeletingSala] = useState(false);

  useDynamicTitle({
    title: "Salas · FaceRec",
    description: "Crie, organize e acompanhe suas salas com presença verificada em tempo real.",
  });

  const alunosPorSala = useMemo(() => {
    const map = new Map();
    for (const aluno of alunos) {
      if (!aluno?.salaId) continue;
      const current = map.get(aluno.salaId) || [];
      current.push(aluno);
      map.set(aluno.salaId, current);
    }
    return map;
  }, [alunos]);

  const stats = useMemo(() => {
    const totalSalas = salas.length;
    const totalAlunos = alunos.length;
    const periodos = new Set(
      salas
        .map((sala) => sala.periodo)
        .filter((value) => value && value.trim())
    );
    return {
      totalSalas,
      totalAlunos,
      periodos: periodos.size,
    };
  }, [salas, alunos]);

  const sortedSalas = useMemo(() => {
    return [...salas].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [salas]);

  const salaPorId = useMemo(() => {
    const map = new Map();
    for (const sala of salas) {
      map.set(sala.id, sala);
    }
    return map;
  }, [salas]);

  const filteredAlunos = useMemo(() => {
    const list = selectedSalaId ? alunos.filter((aluno) => aluno?.salaId === selectedSalaId) : alunos;
    const ordered = [...list].sort((a, b) => {
      const nomeA = a?.nome?.toLowerCase?.() || "";
      const nomeB = b?.nome?.toLowerCase?.() || "";
      const comparison = nomeA.localeCompare(nomeB);
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return ordered;
  }, [alunos, selectedSalaId, sortOrder]);

  const handlePresence = (alunoId, status) => {
    setPresence((prev) => {
      const next = { ...prev };
      if (next[alunoId] === status) {
        delete next[alunoId];
      } else {
        next[alunoId] = status;
      }
      return next;
    });
  };

  const requestDeleteSala = (sala) => {
    setStatus(null);
    setPendingSala(sala);
  };

  const handleDeleteSala = async () => {
    if (!pendingSala) return;
    setIsDeletingSala(true);

    try {
      await deleteSala(pendingSala.id);
      setStatus({ type: "ok", message: `Sala “${pendingSala.nome}” removida.` });
      setPendingSala(null);
    } catch (error) {
      console.error('[SalasPage] Erro ao remover sala', error);
      setStatus({ type: "error", message: `Não foi possível remover a sala “${pendingSala.nome}”. Tente novamente.` });
    } finally {
      setIsDeletingSala(false);
    }
  };

  const cancelDeleteSala = () => {
    if (isDeletingSala) return;
    setPendingSala(null);
  };

  const selectedSala = selectedSalaId ? salaPorId.get(selectedSalaId) : null;

  return (
    <div className="login-scope min-h-[70vh] text-slate-200">
      <section className="glass mx-auto max-w-6xl rounded-2xl p-6 md:p-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div>
              <h1 className="heading-gradient text-2xl font-semibold md:text-3xl">Salas de Aula</h1>
              <p className="mt-1 text-sm text-slate-400">Organize turmas, atribua períodos e acompanhe a presença rapidamente.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dados')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
            <ClipboardList className="h-4 w-4" />
            Importar dados
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              Total de salas
              <LayoutGrid className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.totalSalas}</p>
            <p className="text-xs text-slate-500">Turmas cadastradas neste ambiente</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              Alunos vinculados
              <Users className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.totalAlunos}</p>
            <p className="text-xs text-slate-500">Somatório de alunos nas salas ativas</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              Períodos distintos
              <Calendar className="h-4 w-4 text-sky-300" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.periodos}</p>
            <p className="text-xs text-slate-500">Manhã, tarde, noite ou customizados</p>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Suas salas</h2>
                <span className="text-xs text-slate-400">{sortedSalas.length} sala(s)</span>
              </div>
              <button
                onClick={() => navigate('/salas/nova')}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/20"
              >
                <Plus className="h-4 w-4" /> Criar sala
              </button>
            </div>

            {status?.message && (
              <div
                className={`mb-4 rounded-lg border p-3 text-xs ${
                  status.type === "ok"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-200"
                }`}
              >
                {status.message}
              </div>
            )}

            {sortedSalas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
                Nenhuma sala cadastrada.
                {alunos.length > 0 ? (
                  <>
                    <br />Detectamos <b>{alunos.length}</b> aluno(s) com referência a sala, mas as salas não foram reconstruídas.
                    <br />Isso pode indicar falha na importação ou perda de cache. Tente abrir a página "Dados" e importar novamente.
                  </>
                ) : (
                  <> Clique em "Criar sala" para iniciar uma nova turma.</>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedSalas.map((sala) => {
                  const alunosDaSala = alunosPorSala.get(sala.id) || [];
                  return (
                    <article
                      key={sala.id}
                      className="rounded-xl border border-white/10 bg-slate-900/40 p-4 transition hover:border-white/20 hover:bg-slate-900/60"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{sala.nome}</h3>
                          <p className="text-xs text-slate-400">
                            {sala.periodo ? `Período: ${sala.periodo}` : "Período não informado"}
                          </p>
                          <p className="mt-2 text-sm text-slate-300">
                            {alunosDaSala.length} aluno(s) vinculados
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                          <button
                            onClick={() => navigate('/chamada', { state: { salaId: sala.id } })}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200 transition hover:bg-white/10"
                          >
                            <ArrowRight className="h-4 w-4" /> Abrir presença
                          </button>
                          <button
                            onClick={() => navigate('/dados')}
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sky-200 transition hover:bg-sky-500/20"
                          >
                            <Users className="h-4 w-4" /> Gerenciar alunos
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSalaId(sala.id);
                              setSortMenuOpen(false);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-emerald-200 transition hover:bg-emerald-500/20"
                          >
                            <Users className="h-4 w-4" /> Mostrar alunos
                          </button>
                          <button
                            onClick={() => requestDeleteSala(sala)}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-200 transition hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-4 w-4" /> Remover
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Alunos cadastrados</h2>
                <span className="text-xs text-slate-400">{filteredAlunos.length} aluno(s)</span>
                {selectedSala ? (
                  <p className="text-xs text-emerald-300">Filtrando: {selectedSala.nome}</p>
                ) : (
                  <p className="text-xs text-slate-500">Visualizando alunos de todas as salas</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <div className="relative">
                  <button
                    onClick={() => {
                      setSelectedSalaId(null);
                      setSortMenuOpen((open) => !open);
                    }}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
                      selectedSalaId === null
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Todos
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                  {sortMenuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-lg border border-white/10 bg-slate-900/95 p-1 text-xs shadow-lg">
                      <button
                        onClick={() => {
                          setSelectedSalaId(null);
                          setSortMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-slate-200 transition hover:bg-white/10"
                      >
                        Mostrar todos
                      </button>
                      <div className="my-1 border-t border-white/10" />
                      <button
                        onClick={() => {
                          setSortOrder('asc');
                          setSortMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition hover:bg-white/10 ${sortOrder === 'asc' ? 'text-emerald-200' : 'text-slate-200'}`}
                      >
                        <SortAsc className="h-3.5 w-3.5" /> Ordem crescente
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder('desc');
                          setSortMenuOpen(false);
                        }}
                        className={`mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition hover:bg-white/10 ${sortOrder === 'desc' ? 'text-emerald-200' : 'text-slate-200'}`}
                      >
                        <SortDesc className="h-3.5 w-3.5" /> Ordem decrescente
                      </button>
                    </div>
                  )}
                </div>
                {selectedSala && (
                  <button
                    onClick={() => {
                      setSelectedSalaId(null);
                      setSortMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200 transition hover:bg-white/10"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </div>

            {filteredAlunos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
                {selectedSala
                  ? 'Nenhum aluno vinculado a esta sala.'
                  : 'Ainda não há alunos cadastrados. Faça a importação ou cadastre manualmente para visualizar aqui.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlunos.map((aluno) => {
                  const salaRelacionada = aluno?.salaId ? salaPorId.get(aluno.salaId) : null;
                  return (
                    <div key={aluno.id || `${aluno.nome}-${aluno.email}`}> 
                      <AlunoPresencaCard
                        aluno={aluno}
                        status={presence[aluno.id]}
                        onToggle={(id, st) => handlePresence(id, st)}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200">
                          <LayoutGrid className="h-3.5 w-3.5 text-slate-300" />
                          {salaRelacionada?.nome || "Sem sala"}
                        </span>
                        <button
                          onClick={() => navigate('/dados', { state: { alunoId: aluno.id } })}
                          className="inline-flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-sky-200 transition hover:bg-sky-500/20"
                        >
                          <Users className="h-3.5 w-3.5" /> Ajustar dados
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </section>
      {pendingSala && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={cancelDeleteSala} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-sm text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Remover sala</h3>
              <button
                onClick={cancelDeleteSala}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-wide text-slate-400 hover:bg-white/10"
                disabled={isDeletingSala}
              >
                Fechar
              </button>
            </div>
            <p className="mt-4 text-slate-300">
              Tem certeza que deseja remover a sala “{pendingSala.nome}”? Essa ação também remove {alunosPorSala.get(pendingSala.id)?.length ?? 0} aluno(s) vinculados a ela.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={cancelDeleteSala}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-200 transition hover:bg-white/10"
                disabled={isDeletingSala}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSala}
                className="flex-1 rounded-xl border border-rose-500/40 bg-rose-500/20 px-4 py-2 font-semibold text-rose-100 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeletingSala}
              >
                {isDeletingSala ? 'Removendo...' : 'Remover sala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
