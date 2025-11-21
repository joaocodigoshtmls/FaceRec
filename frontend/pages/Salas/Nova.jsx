import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import useDynamicTitle from "@/lib/useDynamicTitle";
import { useData } from "@/contexts/DataContext";
import PageShell from "@/Components/PageShell";
import GlassSection from "@/Components/GlassSection";
import PageHeader from "@/Components/PageHeader";
import StatusAlert from "@/Components/StatusAlert";
import FormField from "@/Components/FormField";
import ActionButton from "@/Components/ActionButton";

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
    <PageShell>
      <GlassSection maxWidth="max-w-3xl">
        <PageHeader
          title="Cadastrar nova sala"
          description="Defina o nome e o período para começar a acompanhar presença."
          showBackButton
        />

        {status?.message && (
          <StatusAlert type={status.type} message={status.message} className="mb-4" />
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          <FormField
            label="Nome da sala"
            name="nomeSala"
            value={nomeSala}
            onChange={(event) => setNomeSala(event.target.value)}
            placeholder="Ex: 3º Ano A"
            required
          />

          <FormField
            label="Período (opcional)"
            name="periodo"
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value)}
            placeholder="Manhã, Tarde, Integral..."
          />

          <ActionButton
            type="submit"
            variant="solid"
            icon={Plus}
            className="w-full justify-center bg-gradient-to-b from-[#38bdf8] to-[#2563eb] shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
          >
            Salvar sala
          </ActionButton>
        </form>
      </GlassSection>
    </PageShell>
  );
}
