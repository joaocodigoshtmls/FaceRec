import { useEffect } from "react";

/**
 * useDynamicTitle
 * Define document.title e (opcional) meta[name="description"] com base em props/rota.
 * Chame em cada página passando um objeto com title e description; se não passar, usa presets por pathname.
 */
export default function useDynamicTitle(preset) {
  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "/";

    const presetsByPath = {
      "/": {
        title: "FaceRec · Videoconferências com Reconhecimento Facial",
        description: "Chamada automática e presença verificada em segundos. Plataforma simples e segura para escolas e universidades.",
      },
      "/login": {
        title: "Entrar · FaceRec",
        description: "Acesse o painel com seu e-mail ou Google. Segurança e praticidade para gestão de presenças.",
      },
      "/cadastro": {
        title: "Criar conta · FaceRec",
        description: "Crie sua conta gratuita e comece a registrar presença com reconhecimento facial.",
      },
      "/alunos": {
        title: "Hub de Alunos · FaceRec",
        description: "Gerencie turmas, fotos e presença em tempo real.",
      },
      // Rota /admin removida: eliminada referência a painel de administração
    };

    const target = preset || presetsByPath[path] || { title: `FaceRec`, description: `` };

    if (target.title) {
      document.title = target.title;
    }

    if (target.description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', target.description);
    }
  }, [preset]);
}
