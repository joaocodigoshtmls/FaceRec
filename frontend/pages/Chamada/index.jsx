import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Monitor, UsersRound } from "lucide-react";
import AlunoPresencaCard from "@/assets/Components/AlunoPresencaCard";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { useData } from "@/contexts/DataContext";

const SAMPLE_STREAM = "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4";

function normalizeId(value) {
  if (value === undefined || value === null) return null;
  return String(value);
}

export default function ChamadaPage() {
  useDynamicTitle({
    title: "Chamada · FaceRec",
    description: "Marque presença dos alunos da sala selecionada.",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { salas, alunos } = useData();

  const salaIdFromState = normalizeId(location.state?.salaId);
  const [activeSalaId, setActiveSalaId] = useState(() => salaIdFromState || normalizeId(salas[0]?.id) || null);
  const [presence, setPresence] = useState({});
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);
  const [requestingCam, setRequestingCam] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (salaIdFromState && salaIdFromState !== activeSalaId) {
      setActiveSalaId(salaIdFromState);
    }
  }, [salaIdFromState, activeSalaId]);

  useEffect(() => {
    if (!activeSalaId && salas.length) {
      setActiveSalaId(normalizeId(salas[0].id));
    }
  }, [salas, activeSalaId]);

  useEffect(() => {
    if (activeSalaId && salas.length) {
      const exists = salas.some((sala) => normalizeId(sala.id) === activeSalaId);
      if (!exists) setActiveSalaId(normalizeId(salas[0].id));
    }
  }, [activeSalaId, salas]);

  useEffect(() => {
    setPresence({});
  }, [activeSalaId]);

  const selectedSala = useMemo(() => salas.find((sala) => normalizeId(sala.id) === activeSalaId) || null, [salas, activeSalaId]);

  const alunosDaSala = useMemo(() => {
    if (!selectedSala) return [];
    return alunos
      .filter((aluno) => normalizeId(aluno.salaId) === normalizeId(selectedSala.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }, [alunos, selectedSala]);

  // Inicia câmera frontal do dispositivo
  const startCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setVideoError(true);
      alert('Este dispositivo/navegador não suporta captura de câmera.');
      return;
    }
    try {
      setRequestingCam(true);
      setVideoError(false);
      setVideoLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' } },
        audio: false,
      });
      setMediaStream(stream);
      setUsingCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setVideoLoading(false);
    } catch (err) {
      console.warn('Falha ao acessar câmera:', err);
      setVideoError(true);
      setUsingCamera(false);
    } finally {
      setRequestingCam(false);
    }
  };

  const stopCamera = () => {
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    } catch {}
    setMediaStream(null);
    setUsingCamera(false);
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.pause?.();
      } catch {}
    }
  };

  // Limpa câmera ao desmontar
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const resumoPresenca = useMemo(() => {
    const values = Object.values(presence);
    return {
      presentes: values.filter((value) => value === "presente").length,
      ausentes: values.filter((value) => value === "ausente").length,
    };
  }, [presence]);

  return (
    <div className="login-scope min-h-[70vh] text-slate-200">
      <section className="glass mx-auto max-w-6xl rounded-2xl p-6 md:p-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="heading-gradient text-2xl font-semibold md:text-3xl">Chamada</h1>
            <p className="mt-1 text-sm text-slate-400">Visualize a câmera e marque a presença dos alunos da sala selecionada.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            {salas.length > 1 && (
              <select
                value={activeSalaId || ""}
                onChange={(event) => setActiveSalaId(event.target.value || null)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 focus:outline-none"
              >
                {salas.map((sala) => (
                  <option key={sala.id} value={normalizeId(sala.id) || ""} className="bg-slate-900">
                    {sala.nome || "Sala sem nome"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Feed ao vivo
                </span>
                  <div className="flex items-center gap-2">
                    {!usingCamera ? (
                      <button
                        type="button"
                        disabled={requestingCam}
                        onClick={startCamera}
                        className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {requestingCam ? 'Solicitando…' : 'Iniciar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20"
                      >
                        Parar
                      </button>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${usingCamera ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700/50 text-slate-300'}`}>
                      <span className={`h-2 w-2 rounded-full ${usingCamera ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      {usingCamera ? 'On-line' : 'Aguardando'}
                    </span>
                  </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80">
                {/* Quando usando câmera, renderiza elemento que usa srcObject; caso contrário, usa demo */}
                {usingCamera ? (
                  <video
                    ref={videoRef}
                    className="aspect-video w-full"
                    playsInline
                    muted
                    autoPlay
                    onLoadedMetadata={() => setVideoLoading(false)}
                    onError={() => setVideoError(true)}
                  />
                ) : (
                  <video
                    key={SAMPLE_STREAM}
                    className="aspect-video w-full"
                    controls
                    playsInline
                    muted
                    autoPlay
                    loop
                    poster="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80"
                    onLoadedData={() => {
                      setVideoLoading(false);
                      setVideoError(false);
                    }}
                    onError={() => {
                      setVideoLoading(false);
                      setVideoError(true);
                    }}
                  >
                    <source src={SAMPLE_STREAM} type="video/mp4" />
                    Seu navegador não suporta vídeo HTML5.
                  </video>
                )}
                {videoLoading && !videoError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/70">
                    <div className="flex flex-col items-center gap-3 text-slate-200">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-xs uppercase tracking-wide text-slate-300">Carregando vídeo…</span>
                    </div>
                  </div>
                )}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 p-6 text-center">
                    <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-4 text-sm text-slate-100">
                      <p className="text-base font-medium text-white">
                        É preciso do protótipo em mãos um cadastro prévio para ver o seu funcionamento.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!requestingCam) startCamera();
                        }}
                        disabled={requestingCam}
                        className="w-full rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {requestingCam ? "Conectando…" : "Usar a minha câmera frontal"}
                      </button>
                    </div>
                  </div>
                )}
                {usingCamera && (
                  <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-rose-500/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    <span className="h-2 w-2 rounded-full bg-white" /> Gravando
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent p-4 text-sm text-slate-200">
                  {selectedSala ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200/80">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                        <Camera className="h-3.5 w-3.5" /> Sala {selectedSala.nome}
                      </span>
                      {selectedSala.periodo && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                          {selectedSala.periodo}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>Selecione uma sala para iniciar a chamada.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-slate-200">Resumo da presença</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3">
                  <p className="text-slate-200/70">Presentes</p>
                  <p className="text-2xl font-semibold text-emerald-200">{resumoPresenca.presentes}</p>
                </div>
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3">
                  <p className="text-slate-200/70">Ausentes</p>
                  <p className="text-2xl font-semibold text-rose-200">{resumoPresenca.ausentes}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Lista de alunos</h2>
                <p className="text-xs text-slate-400">
                  {selectedSala
                    ? `${alunosDaSala.length} aluno(s) • ${selectedSala.nome}`
                    : "Selecione uma sala para visualizar os alunos"}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                <UsersRound className="h-3.5 w-3.5" />
                {alunosDaSala.length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "520px" }}>
              {selectedSala && alunosDaSala.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/20 bg-slate-900/40 p-4 text-xs text-slate-400">
                  Nenhum aluno vinculado a esta sala ainda.
                </div>
              )}

              {!selectedSala && (
                <div className="rounded-xl border border-dashed border-amber-400/50 bg-amber-500/10 p-4 text-xs text-amber-200">
                  Escolha uma sala para começar a registrar presença.
                </div>
              )}

              {alunosDaSala.map((aluno) => (
                <AlunoPresencaCard
                  key={aluno.id}
                  aluno={aluno}
                  status={presence[aluno.id]}
                  onToggle={(id, status) => handlePresence(id, status)}
                />
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
