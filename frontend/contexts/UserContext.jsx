import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * UserContext
 * - Fonte de verdade para o usuário logado.
 * - profile_picture: caminho/URL persistida (banco/localStorage).
 * - photoURL: URL de exibição imediata (pode ter ?v=timestamp para quebrar cache).
 *
 * Regras:
 * - Na carga inicial, definimos photoURL = profile_picture (ou vazio).
 * - updateProfilePicture(newUrl) ATUALIZA APENAS photoURL (UI/header), sem mexer em profile_picture.
 *   Isso evita “avatar fantasma” e não grava ?v= no persistido.
 * - updateUser(userData) mescla dados novos e persiste em localStorage.
 */

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  // Carrega usuário do localStorage na inicialização
  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) return;

      const userData = JSON.parse(raw);

      // Migração de legado: se existir "foto" e não houver "profile_picture"
      if (userData?.foto && !userData?.profile_picture) {
        userData.profile_picture = userData.foto;
      }

      const profile_picture = normalizeProfilePicture(userData?.profile_picture);
      const classes = normalizeClasses(userData?.classes);
      const sanitized = {
        ...userData,
        profile_picture,
        photoURL: userData?.photoURL ?? profile_picture ?? "",
        classes,
        tipo: userData?.tipo ?? null,
      };

      setUsuario(sanitized);
      // garante persistência coerente
      localStorage.setItem("usuario", JSON.stringify(sanitized));
    } catch (e) {
      console.warn("UserContext: erro ao carregar usuario do localStorage:", e);
    }
  }, []);

  // Atualiza a foto exibida (header) com cache-busting, sem tocar no profile_picture persistido
  const updateProfilePicture = useCallback((newProfilePictureUrl) => {
    setUsuario(prev => {
      const updatedUser = {
        ...prev,
        photoURL: newProfilePictureUrl || "",
      };
      try {
        const stored = JSON.parse(localStorage.getItem("usuario") || "{}");
        stored.photoURL = newProfilePictureUrl || "";
        localStorage.setItem("usuario", JSON.stringify(stored));
      } catch {}
      return updatedUser;
    });

    // Notifica app (opcional)
    window.dispatchEvent(new CustomEvent("userProfileUpdated", {
      detail: { profilePicture: newProfilePictureUrl || "" }
    }));
  }, []);

  // Atualiza dados do usuário e persiste (inclusive profile_picture se vier do servidor)
  const updateUser = useCallback((userData) => {
    setUsuario(prev => {
      const profile_picture = normalizeProfilePicture(userData?.profile_picture ?? prev?.profile_picture ?? null);
      const classes = normalizeClasses(userData?.classes ?? prev?.classes ?? []);

      // photoURL segue o profile_picture atualizado, a menos que já exista uma UI URL temporária no estado
      const merged = {
        ...prev,
        ...userData,
        profile_picture,
        classes,
        tipo: userData?.tipo ?? prev?.tipo ?? null,
      };

      if (!merged.photoURL || stripCacheBuster(merged.photoURL) === stripCacheBuster(prev?.photoURL || "")) {
        merged.photoURL = profile_picture || "";
      }

      try {
        localStorage.setItem("usuario", JSON.stringify(merged));
      } catch {}

      return merged;
    });
  }, []);

  // Logout: limpa usuário + tokens
  const logout = useCallback(() => {
    try {
      localStorage.removeItem("usuario");
      // limpa possíveis chaves de token comuns
      ["authToken", "token", "accessToken", "jwt"].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch {}
    setUsuario(null);
  }, []);

  // Sincroniza mudanças entre abas
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "usuario") {
        try {
          const userData = e.newValue ? JSON.parse(e.newValue) : null;
          if (!userData) return setUsuario(null);

          const profile_picture = normalizeProfilePicture(userData?.profile_picture);
          const classes = normalizeClasses(userData?.classes);

          setUsuario(prev => ({
            ...prev,
            ...userData,
            profile_picture,
            photoURL: userData.photoURL ?? profile_picture ?? "",
            classes,
            tipo: userData?.tipo ?? prev?.tipo ?? null,
          }));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Opcional: reage a eventos internos de atualização da foto
  useEffect(() => {
    const handler = (ev) => {
      const url = ev?.detail?.profilePicture || "";
      setUsuario(prev => {
        const next = { ...prev, photoURL: url };
        try {
          const stored = JSON.parse(localStorage.getItem("usuario") || "{}");
          stored.photoURL = url;
          localStorage.setItem("usuario", JSON.stringify(stored));
        } catch {}
        return next;
      });
    };
    window.addEventListener("userProfileUpdated", handler);
    return () => window.removeEventListener("userProfileUpdated", handler);
  }, []);

  // Funções para verificar permissões do usuário
  const isSupervisor = useCallback(() => true, []);

  const isProfessor = useCallback(() => true, []);

  const hasPermission = useCallback(() => true, []);

  const value = useMemo(() => ({
    usuario,
    setUsuario,
    updateProfilePicture,
    updateUser,
    logout,
    isSupervisor,
    isProfessor,
    hasPermission,
  }), [usuario, updateProfilePicture, updateUser, logout, isSupervisor, isProfessor, hasPermission]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser deve ser usado dentro de <UserProvider />");
  return ctx;
}

/* =========================
   Helpers
   ========================= */

function normalizeProfilePicture(p) {
  if (!p) return null;
  // remove cache-buster do persistido
  const clean = String(p).replace(/\?v=\d+$/i, "");
  // garante string
  return clean || null;
}

function stripCacheBuster(url = "") {
  return String(url).replace(/\?v=\d+$/i, "");
}

function normalizeClasses(value) {
  if (!value) return [];
  const arrayValue = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map((item) => item.trim());

  const seen = new Set();
  const filtered = [];
  for (const item of arrayValue) {
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    filtered.push(item);
  }
  return filtered;
}
