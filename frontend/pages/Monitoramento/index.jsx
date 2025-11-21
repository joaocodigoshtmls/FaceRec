import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Monitor } from "lucide-react";
import useDynamicTitle from "@/lib/useDynamicTitle";
import PageShell from "@/Components/PageShell";
import GlassSection from "@/Components/GlassSection";
import PageHeader from "@/Components/PageHeader";

const SAMPLE_STREAM = "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4";

export default function MonitoramentoPage() {
  useDynamicTitle({
    title: "Monitoramento · FaceRec",
    description: "Painel geral de vídeo (sem chamada).",
  });

  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const navigate = useNavigate();

  return (
    <PageShell>
      <GlassSection>
        <PageHeader
          title="Monitoramento"
          description="Feed geral para acompanhar o vídeo/câmera (sem chamada)."
        />

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Feed ao vivo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> On-line
                </span>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80">
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
                        onClick={() => navigate("/chamada")}
                        className="w-full rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                      >
                        Usar a minha câmera frontal
                      </button>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-rose-500/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  <span className="h-2 w-2 rounded-full bg-white" /> Gravando
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent p-4 text-xs text-slate-300">Monitoramento geral</div>
              </div>
            </div>
          {/* Espaço reservado para futuros indicadores de sistema/câmera */}
        </div>
      </GlassSection>
    </PageShell>
  );
}
