import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileDown, Loader2, UploadCloud, XCircle, RotateCcw, FileSpreadsheet, Trash2, ArrowLeft } from "lucide-react";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { useUser } from "@/contexts/UserContext";
import { createTemplateCSV } from "@/lib/csv";
import { useData } from "@/contexts/DataContext";

const sampleCsvHref = new URL("../../../resources/tests/test-csv.csv", import.meta.url).href;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const statusStyles = {
  ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  loading: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  info: "border-white/10 bg-white/5 text-slate-300",
};

export default function DadosPage() {
  useDynamicTitle({
    title: "Dados · FaceRec",
    description: "Importe alunos e salas a partir de um CSV.",
  });

  const navigate = useNavigate();
  const { usuario, isSupervisor, isProfessor } = useUser();
  const { importCSV, importRecords, salas, alunos, lastImport } = useData();

  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null); // { parsed, fileName, fileSize }
  const [importing, setImporting] = useState(false);

  const hasTeacherPermission = useMemo(() => {
    if (!usuario) return false;
  if (typeof isSupervisor === 'function' && isSupervisor()) return true;
    if (typeof isProfessor === 'function' && isProfessor()) return true;
    const role = usuario?.role || usuario?.tipo;
    return role === "professor" || role === "admin";
  }, [usuario, isSupervisor, isProfessor]);

  const handleFiles = useCallback(async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setStatus({ type: "error", msg: "Arquivo muito grande. Limite de 5 MB." });
      return;
    }
    setStatus({ type: "loading", msg: "Analisando CSV…" });
    try {
  const parsed = await importCSV(file);
  setPreview({ parsed, fileName: file.name, fileSize: file.size });
      const highlights = [];
      highlights.push(`${parsed.alunos.length} aluno(s)`);
      highlights.push(`${parsed.salas.length} sala(s)`);
      if (parsed.skipped) {
        highlights.push(`${parsed.skipped} linha(s) ignorada(s)`);
      }
      setStatus({
        type: parsed.skipped ? "warn" : "ok",
        msg: `Pronto para importar: ${highlights.join(" · ")}. Confirme abaixo para enviar ao servidor.`,
      });
    } catch (error) {
      console.error("CSV parse error", error);
      setPreview(null);
      setStatus({ type: "error", msg: error?.message || "Não foi possível ler o CSV." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setDragging(false);
    }
  }, [importCSV]);

  const onInputChange = useCallback((event) => {
    const file = event.target.files?.[0];
    handleFiles(file);
  }, [handleFiles]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    handleFiles(file);
  }, [handleFiles]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    if (!dragging) setDragging(true);
  }, [dragging]);

  const onDragLeave = useCallback((event) => {
    event.preventDefault();
    if (dragging) setDragging(false);
  }, [dragging]);

  const handleImport = useCallback(async () => {
    if (!preview?.parsed) return;
    setImporting(true);
    setStatus({ type: "loading", msg: "Enviando dados para o servidor…" });
    try {
      const sanitizedSalas = preview.parsed.salas.map((sala) => ({
        id: sala.id,
        nome: sala.nome,
        periodo: sala.periodo ?? null,
      }));
      const sanitizedAlunos = preview.parsed.alunos.map((aluno) => ({
        nome: aluno.nome,
        email: aluno.email || null,
        telefone: aluno.telefone || null,
        ativo: aluno.ativo !== false,
        salaId: aluno.salaId,
      }));

      await importRecords({ salas: sanitizedSalas, alunos: sanitizedAlunos });

      setStatus({ type: "ok", msg: `Importação concluída com sucesso. ${sanitizedAlunos.length} aluno(s) enviados.` });
      window.setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Import error", error);
      const msg = error?.response?.data?.message || error?.message || "Erro ao enviar dados para o servidor.";
      setStatus({ type: "error", msg });
    } finally {
      setImporting(false);
    }
  }, [importRecords, preview]);

  const handleReset = useCallback(() => {
    setPreview(null);
    setStatus(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const formatFileSize = useCallback((size) => {
    if (!size && size !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = size;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }, []);

  const downloadTemplate = useCallback(() => {
    const csv = createTemplateCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_alunos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  if (!hasTeacherPermission) {
    return (
      <div className="login-scope min-h-[70vh] text-slate-200">
        <section className="glass mx-auto max-w-3xl rounded-2xl p-6 md:p-8">
          <h1 className="heading-gradient text-2xl font-semibold md:text-3xl">Acesso restrito</h1>
          <p className="mt-2 text-slate-400">Faça login como <b>professor</b> ou <b>admin</b> para importar dados.</p>
        </section>
      </div>
    );
  }

  const previewRows = preview?.parsed?.alunos.slice(0, 8) || [];
  const salaMap = preview?.parsed?.salaMap || {};

  return (
    <div className="login-scope min-h-[70vh] text-slate-200">
      <section className="glass mx-auto max-w-6xl rounded-2xl p-6 md:p-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="heading-gradient text-2xl font-semibold md:text-3xl">Dados · Importação de CSV</h1>
            <p className="mt-1 text-sm text-slate-400">
              Importe alunos e salas a partir de um CSV. Aceita delimitador <code>;</code> ou <code>,</code> e cabeçalhos flexíveis.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </header>

        {status?.msg && (
          <div className={`mb-4 flex items-center gap-3 rounded-lg border p-3 text-sm ${statusStyles[status.type] || statusStyles.info}`}>
            {status.type === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status.type === "ok" && <CheckCircle2 className="h-4 w-4" />}
            {status.type === "warn" && <AlertTriangle className="h-4 w-4" />}
            {status.type === "error" && <XCircle className="h-4 w-4" />}
            {!status.type && <AlertTriangle className="h-4 w-4" />}
            <span>{status.msg}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-3 text-lg font-semibold">1) Envie seu CSV</h2>
            <div
              className={`group flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition-colors hover:border-white/25 ${dragging ? 'border-sky-400/50 bg-sky-400/10' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {!preview?.fileName ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <UploadCloud className="h-8 w-8 text-white/80" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base text-slate-200">Arraste e solte aqui, ou clique para selecionar</p>
                    <p className="text-xs text-slate-400">Aceita .csv — até 5 MB — delimitador `;` ou `,`</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                    <FileSpreadsheet className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-200">Arquivo pronto para importar</p>
                    <p className="truncate text-sm text-white">{preview.fileName}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(preview.fileSize)}</p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Clique para trocar o arquivo</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleReset();
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover arquivo
                  </button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onInputChange}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white transition hover:bg-white/20"
              >
                <FileDown className="h-4 w-4" /> Baixar modelo CSV
              </button>
              <a href={sampleCsvHref} className="text-sky-300 underline hover:text-sky-200">Ver exemplo do repositório</a>
              {preview && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Limpar seleção
                </button>
              )}
            </div>
            {preview?.fileName && (
              <p className="mt-3 truncate text-xs text-slate-400">Arquivo: {preview.fileName}</p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-3 text-lg font-semibold">2) Preview & Validação</h2>
            {!preview ? (
              <p className="text-slate-400">Nenhum arquivo processado ainda.</p>
            ) : (
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  Delimitador detectado: <b>{preview.parsed.delimiter}</b> · Linhas lidas: <b>{preview.parsed.totalRows}</b>
                </p>
                <p>
                  Salas detectadas: <b>{preview.parsed.salas.length}</b> · Alunos válidos: <b>{preview.parsed.alunos.length}</b>
                  {preview.parsed.skipped ? (
                    <span className="ml-2 text-amber-300">• {preview.parsed.skipped} linha(s) ignorada(s)</span>
                  ) : null}
                </p>
                <div className="max-h-48 overflow-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/10 text-[11px] uppercase tracking-wide text-slate-200">
                      <tr>
                        <th className="px-3 py-2">Sala</th>
                        <th className="px-3 py-2">Aluno</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Telefone</th>
                        <th className="px-3 py-2">Ativo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.length === 0 ? (
                        <tr>
                          <td className="px-3 py-2 text-slate-400" colSpan={5}>
                            Nenhum aluno válido identificado.
                          </td>
                        </tr>
                      ) : (
                        previewRows.map((aluno, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                            <td className="px-3 py-2">{salaMap[aluno.salaId] || aluno.salaId}</td>
                            <td className="px-3 py-2">{aluno.nome}</td>
                            <td className="px-3 py-2">{aluno.email || '—'}</td>
                            <td className="px-3 py-2">{aluno.telefone || '—'}</td>
                            <td className="px-3 py-2">{aluno.ativo ? 'Sim' : 'Não'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500">Exibindo até 8 primeiros alunos.</p>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || !preview.parsed.alunos.length}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#ff8a3d] to-[#ff5c00] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_rgba(255,100,30,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Importar agora
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Última importação: {lastImport?.at ? new Date(lastImport.at).toLocaleString() : '—'}
            </span>
            <span>
              Salas no espelho local: <b>{salas.length}</b> · Alunos: <b>{alunos.length}</b>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
