import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowDownToLine,
  Bell,
  BookOpen,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutGrid,
  MapPin,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useData } from "@/contexts/DataContext";
import useDynamicTitle from "@/lib/useDynamicTitle";

const numberFormatter = new Intl.NumberFormat("pt-BR");

export default function PerfilPage() {
  const { usuario, updateUser } = useUser();
  const { salas, alunos } = useData();
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState(null);
  const [contactDraft, setContactDraft] = useState({ email: "", telefone: "" });
  const [contactStatus, setContactStatus] = useState(null);

  useDynamicTitle({
    title: "Perfil · FaceRec",
    description: "Centralize suas informações pessoais, preferências e indicadores de uso do FaceRec.",
  });

  const profile = useMemo(() => {
    const fallbackClasses = ["3º Ano A", "Clube Maker", "Robótica"];
    return {
      nome: usuario?.full_name || usuario?.nome || "Professor(a) visitante",
      email: usuario?.email || "sem-email@facerec.app",
      telefone: usuario?.telefone || "+55 11 99999-0000",
      role: usuario?.tipo || "Coordenador pedagógico",
      instituicao: usuario?.instituicao || "Rede Municipal de Ensino",
      lotacao: usuario?.lotacao || "Unidade Centro",
      ultimoAcesso: usuario?.ultimo_acesso || "Hoje · 07:32",
      criadoEm: usuario?.criado_em || "Desde 2023",
      bio:
        usuario?.bio ||
        "Educador apaixonado por tecnologia e metodologias ativas. Utiliza o FaceRec para agilizar registros de presença e gerar insights diários.",
      avatar: usuario?.photoURL || usuario?.profile_picture || "",
      tags:
        (Array.isArray(usuario?.classes) && usuario.classes.length > 0
          ? usuario.classes
          : fallbackClasses).slice(0, 4),
    };
  }, [usuario]);

  useEffect(() => {
    setContactDraft({
      email: profile.email || "",
      telefone: profile.telefone || "",
    });
  }, [profile.email, profile.telefone]);

  const handleFieldClick = (field) => {
    setEditingField(field);
    setContactStatus(null);
  };

  const handleDraftChange = (field, value) => {
    setContactDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveField = (field) => {
    const value = contactDraft[field]?.trim();
    if (!value) return;
    updateUser({ [field]: value });
    setEditingField(null);
    setContactStatus({ type: "ok", message: `${field === "email" ? "E-mail" : "Telefone"} atualizado` });
    setTimeout(() => setContactStatus(null), 3500);
  };

  const initials = useMemo(() => {
    return profile.nome
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile.nome]);

  const stats = useMemo(() => {
    const importacoesEstimadas = usuario?.importacoes_csv ?? Math.max(1, Math.ceil(Math.max(salas.length, 1) / 2));
    const relatoriosEmitidos = usuario?.relatorios_emitidos ?? Math.max(1, Math.ceil(Math.max(alunos.length, 1) / 15));
    return [
      {
        label: "Turmas ativas",
        value: numberFormatter.format(salas.length || 0),
        hint: salas.length ? "Gestão em /salas" : "Crie sua primeira turma",
        icon: LayoutGrid,
      },
      {
        label: "Alunos sincronizados",
        value: numberFormatter.format(alunos.length || 0),
        hint: alunos.length ? "Lista em /dados" : "Importe um CSV",
        icon: Users,
      },
      {
        label: "Importações CSV",
        value: numberFormatter.format(importacoesEstimadas),
        hint: "Assistente da aba Dados",
        icon: ClipboardList,
      },
      {
        label: "Relatórios emitidos",
        value: numberFormatter.format(relatoriosEmitidos),
        hint: "Exportados em Relatórios",
        icon: BookOpen,
      },
    ];
  }, [alunos.length, salas.length, usuario?.importacoes_csv, usuario?.relatorios_emitidos]);

  const timeline = useMemo(() => {
    const registrosProcessados = Number.isFinite(alunos.length) ? alunos.length : 0;
    const ultimaSala = salas[salas.length - 1]?.nome;
    return [
      {
        title: "Executou chamada em tempo real",
        detail: ultimaSala
          ? `Sala ${ultimaSala} confirmou presença via /chamada`
          : "Abra uma turma em /salas para registrar chamada",
        time: "Hoje · 07:35",
      },
      {
        title: "Concluiu importação CSV",
        detail: `${registrosProcessados} alunos atualizados na aba Dados`,
        time: "Ontem · 18:12",
      },
      {
        title: "Gerou relatório consolidado",
        detail: "Download em PDF feito na seção Relatórios",
        time: "Ontem · 09:10",
      },
      {
        title: "Monitoramento ajustado",
        detail: "Alertas de ausência configurados em /monitoramento",
        time: "Dom · 16:40",
      },
    ];
  }, [alunos.length, salas]);

  const preferenceToggles = [
    {
      label: "Alertas imediatos",
      description: "Receba push quando uma sala ficar sem confirmação.",
      enabled: true,
      icon: Bell,
    },
    {
      label: "Resumo semanal",
      description: "Enviamos um PDF com métricas toda sexta-feira.",
      enabled: true,
      icon: CalendarCheck2,
    },
    {
      label: "Atualizações de produto",
      description: "Fique por dentro das novidades do FaceRec.",
      enabled: false,
      icon: Sparkles,
    },
  ];

  const quickActions = [
    {
      label: "Atualizar foto",
      description: "Envie uma nova imagem do crachá.",
      icon: Camera,
      onAction: () => navigate("/dados", { state: { tab: "foto" } }),
    },
    {
      label: "Importar turmas",
      description: "Acesse o assistente de CSV.",
      icon: ClipboardList,
      onAction: () => navigate("/dados"),
    },
    {
      label: "Configurar alertas",
      description: "Ajuste limites e lembretes.",
      icon: Settings,
      onAction: () => navigate("/monitoramento"),
    },
  ];

  const renderEditableField = (field, IconComponent, placeholder) => {
    const isEditing = editingField === field;
    const value = contactDraft[field] ?? "";
    const originalValue = field === "email" ? profile.email : profile.telefone;
    const hasChanges = value.trim() && value.trim() !== (originalValue || "");

    return (
      <div className="flex items-center gap-2">
        <IconComponent className="h-4 w-4 text-slate-100" />
        {isEditing ? (
          <>
            <input
              autoFocus
              type="text"
              value={value}
              placeholder={placeholder}
              onChange={(event) => handleDraftChange(field, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && hasChanges) {
                  handleSaveField(field);
                }
              }}
              className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-white focus:border-orange-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSaveField(field)}
              disabled={!hasChanges}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDownToLine className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => handleFieldClick(field)}
            className="flex-1 text-left text-sm text-slate-200 underline-offset-4 hover:text-white hover:underline"
          >
            {originalValue || placeholder}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="login-scope min-h-[80vh] text-slate-200">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <section className="glass rounded-3xl border border-white/10 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={`Foto do perfil de ${profile.nome}`}
                  className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-semibold text-white">
                  {initials || "PR"}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Perfil profissional</p>
                <h1 className="heading-gradient text-3xl font-semibold">{profile.nome}</h1>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> {profile.role}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5 text-sky-300" /> {profile.lotacao}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <CalendarCheck2 className="h-3.5 w-3.5 text-orange-300" /> {profile.criadoEm}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {renderEditableField("email", Mail, "Adicionar e-mail institucional")}
              {renderEditableField("telefone", Phone, "Adicionar telefone de contato")}
              {contactStatus?.message && (
                <p className="text-xs text-emerald-300">{contactStatus.message}</p>
              )}
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm text-slate-300">{profile.bio}</p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {profile.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                {stat.label}
                <stat.icon className="h-4 w-4 text-white/70" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.hint}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Informações gerais</p>
                  <h2 className="text-xl font-semibold text-white">Identidade e contatos</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dados", { state: { tab: "perfil" } })}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  <ArrowRight className="h-4 w-4" /> Editar dados
                </button>
              </header>
              <dl className="grid gap-4 text-sm text-slate-300 md:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Instituição</dt>
                  <dd className="mt-1 text-base text-white">{profile.instituicao}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Lotação</dt>
                  <dd className="mt-1 text-base text-white">{profile.lotacao}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Último acesso</dt>
                  <dd className="mt-1 text-base text-white">{profile.ultimoAcesso}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Desde</dt>
                  <dd className="mt-1 text-base text-white">{profile.criadoEm}</dd>
                </div>
              </dl>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Preferências</p>
              <h2 className="text-xl font-semibold text-white">Alertas e notificações</h2>
              <div className="mt-4 space-y-4">
                {preferenceToggles.map((pref) => (
                  <div key={pref.label} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <pref.icon className={`h-4 w-4 ${pref.enabled ? "text-emerald-300" : "text-slate-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white">{pref.label}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            pref.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-white/5 text-slate-400"
                          }`}
                        >
                          {pref.enabled ? "Ativado" : "Desativado"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{pref.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Atalhos</p>
              <h2 className="text-xl font-semibold text-white">Acesso rápido</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onAction}
                    className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-left text-sm text-slate-300 transition hover:border-white/30 hover:text-white"
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-semibold text-white">{action.label}</p>
                    <p className="text-xs text-slate-400">{action.description}</p>
                  </button>
                ))}
              </div>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Linha do tempo</p>
              <h2 className="text-xl font-semibold text-white">Atividades recentes</h2>
              <div className="mt-4 space-y-5">
                {timeline.map((entry) => (
                  <div key={entry.title + entry.time} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-b from-orange-300 to-orange-500" />
                    <p className="text-sm font-medium text-white">{entry.title}</p>
                    <p className="text-xs text-slate-400">{entry.detail}</p>
                    <p className="text-[11px] text-slate-500">{entry.time}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Insights</p>
              <h2 className="text-xl font-semibold text-white">Progresso individual</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Confiabilidade do reconhecimento</p>
                      <p className="text-xs text-slate-400">A média atual está 6% acima da meta.</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Frequência de relatórios</p>
                      <p className="text-xs text-slate-400">Você baixou 4 relatórios nesta semana.</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-sky-300" />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Indice de presença confiável</p>
                      <p className="text-xs text-slate-400">94% dos alunos assinam digitalmente após a chamada.</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-amber-300" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
