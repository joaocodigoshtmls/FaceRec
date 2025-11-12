import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { parseCSV } from '@/lib/csv';

const DataContext = createContext(null);

// Chaves base de cache (serão "namespaced" por usuário para evitar vazamento entre contas)
const LS_SALAS = 'fr_data_salas';
const LS_ALUNOS = 'fr_data_alunos';
const LS_LAST = 'fr_data_last_import';

// Utilitário: obtém o identificador do usuário logado (id prefere, senão email/uid)
const getActiveUserId = () => {
  try {
    const raw = localStorage.getItem('usuario');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return (
      u?.id?.toString?.() ||
      (u?.email ? `email:${u.email}` : null) ||
      (u?.uid ? `uid:${u.uid}` : null)
    );
  } catch {
    return null;
  }
};

const nsKey = (base) => {
  const uid = getActiveUserId();
  return uid ? `${base}:${uid}` : base; // sem uid, usa chave legacy (compat)
};

const ensureString = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  try {
    return String(value);
  } catch {
    return '';
  }
};

const toOptionalString = (value) => {
  const str = ensureString(value).trim();
  return str || null;
};

const normalizeSala = (raw) => {
  if (!raw) return null;
  const nome = ensureString(raw.nome ?? raw.name ?? '').trim();
  if (!nome) return null;

  const idSource = raw.id ?? raw.uuid ?? raw.slug ?? raw.salaId ?? raw.code ?? nome;
  const id = ensureString(idSource).trim() || nome;

  return {
    id,
    nome,
    periodo: toOptionalString(raw.periodo ?? raw.period ?? raw.turno),
    createdAt: raw.createdAt ?? raw.created_at ?? null,
  };
};

const normalizeAluno = (raw) => {
  if (!raw) return null;
  const nome = ensureString(raw.nome ?? raw.name ?? '').trim();
  if (!nome) return null;

  const salaIdRaw = raw.salaId ?? raw.classroomId ?? raw.classroom_id ?? raw.classroomID ?? raw.sala ?? null;
  const salaId = toOptionalString(salaIdRaw);

  const idSource = raw.id ?? raw.studentId ?? raw.uuid ?? raw.matricula ?? null;
  const fallbackId = `${nome}-${ensureString(raw.email ?? '').trim()}`;
  const id = toOptionalString(idSource) || fallbackId;

  return {
    id,
    nome,
    email: toOptionalString(raw.email ?? raw.mail),
    telefone: toOptionalString(raw.telefone ?? raw.phone ?? raw.celular),
    salaId,
    ativo: Boolean(raw.ativo ?? raw.active ?? true),
    matricula: toOptionalString(raw.matricula),
    foto: toOptionalString(raw.foto ?? raw.profile_picture ?? raw.photoURL),
    dataCadastro: raw.dataCadastro ?? raw.created_at ?? raw.createdAt ?? null,
  };
};

const normalizeSalas = (items) => (Array.isArray(items) ? items.map(normalizeSala).filter(Boolean) : []);
const normalizeAlunos = (items) => (Array.isArray(items) ? items.map(normalizeAluno).filter(Boolean) : []);

export function DataProvider({ children }) {
  const [salas, setSalas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [lastImport, setLastImport] = useState(null);

  useEffect(() => {
    try {
      // Carrega por chave namespaced; se vazio e existir legado, migra e apaga legado
      const keySalas = nsKey(LS_SALAS);
      const keyAlunos = nsKey(LS_ALUNOS);
      const keyLast = nsKey(LS_LAST);

      const legacySalasStr = localStorage.getItem(LS_SALAS);
      const legacyAlunosStr = localStorage.getItem(LS_ALUNOS);
      const legacyLastStr = localStorage.getItem(LS_LAST);

      const salasStr = localStorage.getItem(keySalas) ?? '[]';
      const alunosStr = localStorage.getItem(keyAlunos) ?? '[]';
      const lastStr = localStorage.getItem(keyLast) ?? 'null';

      let storedSalas = normalizeSalas(JSON.parse(salasStr));
      let storedAlunos = normalizeAlunos(JSON.parse(alunosStr));
      let storedLast = JSON.parse(lastStr);

      // Migração de legado: se não há namespaced mas há legado, migra e limpa legado
      const hasNamespaced = (salasStr && salasStr !== '[]') || (alunosStr && alunosStr !== '[]') || (lastStr && lastStr !== 'null');
      if (!hasNamespaced && (legacySalasStr || legacyAlunosStr || legacyLastStr)) {
        try {
          const legacySalas = normalizeSalas(JSON.parse(legacySalasStr || '[]'));
          const legacyAlunos = normalizeAlunos(JSON.parse(legacyAlunosStr || '[]'));
          const legacyLast = JSON.parse(legacyLastStr || 'null');
          if (legacySalas.length) {
            localStorage.setItem(keySalas, JSON.stringify(legacySalas));
            storedSalas = legacySalas;
          }
          if (legacyAlunos.length) {
            localStorage.setItem(keyAlunos, JSON.stringify(legacyAlunos));
            storedAlunos = legacyAlunos;
          }
          if (legacyLast && typeof legacyLast === 'object') {
            localStorage.setItem(keyLast, JSON.stringify(legacyLast));
            storedLast = legacyLast;
          }
          // apaga legado para evitar vazamento entre contas
          localStorage.removeItem(LS_SALAS);
          localStorage.removeItem(LS_ALUNOS);
          localStorage.removeItem(LS_LAST);
        } catch {}
      }
      // Fallback: se não houver salas mas existem alunos com salaId, reconstruir salas a partir dos alunos
      let effectiveSalas = storedSalas;
      if (!effectiveSalas.length && storedAlunos.length) {
        const map = new Map();
        for (const aluno of storedAlunos) {
          const sid = aluno?.salaId;
          if (!sid) continue;
          if (!map.has(sid)) {
            map.set(sid, {
              id: sid,
              nome: sid, // sem nome original, usamos o id; usuário pode editar depois
              periodo: null,
              createdAt: null,
              _reconstructed: true,
            });
          }
        }
        effectiveSalas = Array.from(map.values()).map(normalizeSala).filter(Boolean);
        if (effectiveSalas.length) {
          console.log('[DataContext] Reconstruindo salas a partir de alunos no cache', { reconstruidas: effectiveSalas.length });
          localStorage.setItem(keySalas, JSON.stringify(effectiveSalas));
        }
      }
      if (effectiveSalas.length) setSalas(effectiveSalas);
      if (storedAlunos.length) setAlunos(storedAlunos);
      if (storedLast && typeof storedLast === 'object') setLastImport(storedLast);
      console.log('[DataContext] Inicialização com cache', {
        salas: effectiveSalas.length,
        alunos: storedAlunos.length,
        lastImport: storedLast?.counts,
      });
    } catch {
      // fallback silently
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(nsKey(LS_SALAS), JSON.stringify(normalizeSalas(salas)));
  }, [salas]);

  useEffect(() => {
    localStorage.setItem(nsKey(LS_ALUNOS), JSON.stringify(normalizeAlunos(alunos)));
  }, [alunos]);

  useEffect(() => {
    const key = nsKey(LS_LAST);
    if (lastImport) {
      localStorage.setItem(key, JSON.stringify(lastImport));
    } else {
      localStorage.removeItem(key);
    }
  }, [lastImport]);

  const syncFromServer = useCallback(async () => {
  const cachedSalas = normalizeSalas(JSON.parse(localStorage.getItem(nsKey(LS_SALAS)) || '[]'));
  const cachedAlunos = normalizeAlunos(JSON.parse(localStorage.getItem(nsKey(LS_ALUNOS)) || '[]'));
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt');

      if (!token) {
        setSalas(cachedSalas);
        setAlunos(cachedAlunos);
        console.log('[DataContext] syncFromServer sem token, usando cache', {
          salas: cachedSalas.length,
          alunos: cachedAlunos.length,
        });
        return { salas: cachedSalas, alunos: cachedAlunos };
      }

      const { data } = await api.get('/classrooms');
      const fetchedSalas = normalizeSalas(data?.salas);
      const fetchedAlunos = normalizeAlunos(data?.alunos);

      const finalSalas = fetchedSalas.length ? fetchedSalas : cachedSalas;
      const finalAlunos = fetchedAlunos.length ? fetchedAlunos : cachedAlunos;

      setSalas(finalSalas);
      setAlunos(finalAlunos);

  localStorage.setItem(nsKey(LS_SALAS), JSON.stringify(finalSalas));
  localStorage.setItem(nsKey(LS_ALUNOS), JSON.stringify(finalAlunos));

      console.log('[DataContext] syncFromServer carregou do backend', {
        salas: finalSalas.length,
        alunos: finalAlunos.length,
        origem: fetchedSalas.length || fetchedAlunos.length ? 'backend' : 'cache',
      });

      return { salas: finalSalas, alunos: finalAlunos };
    } catch (error) {
      console.warn('DataContext: falha ao sincronizar com o servidor', error);
      setSalas(cachedSalas);
      setAlunos(cachedAlunos);
      console.log('[DataContext] syncFromServer falhou, revertendo cache', {
        salas: cachedSalas.length,
        alunos: cachedAlunos.length,
      });
      return { salas: cachedSalas, alunos: cachedAlunos, offline: true };
    }
  }, []);

  const importRecords = useCallback(async ({ salas: nextSalas, alunos: nextAlunos }) => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt');

    let normalizedSalasInput = normalizeSalas(nextSalas);
    const normalizedAlunosInput = normalizeAlunos(nextAlunos);

    // Garante consistência: se vierem alunos com salaId inexistente em salas, cria salas mínimas
    if (normalizedAlunosInput.length) {
      const known = new Set(normalizedSalasInput.map((s) => s.id));
      const missing = new Map();
      for (const aluno of normalizedAlunosInput) {
        const sid = aluno?.salaId;
        if (!sid || known.has(sid) || missing.has(sid)) continue;
        missing.set(sid, normalizeSala({ id: sid, nome: String(sid) }));
      }
      if (missing.size) {
        const extras = Array.from(missing.values()).filter(Boolean);
        if (extras.length) {
          normalizedSalasInput = [...normalizedSalasInput, ...extras];
        }
      }
    }

    const applyLocalUpdate = (countsHint) => {
      setSalas(normalizedSalasInput);
      setAlunos(normalizedAlunosInput);
      localStorage.setItem(nsKey(LS_SALAS), JSON.stringify(normalizedSalasInput));
      localStorage.setItem(nsKey(LS_ALUNOS), JSON.stringify(normalizedAlunosInput));

      const counts = countsHint || {
        salas: normalizedSalasInput.length,
        alunos: normalizedAlunosInput.length,
      };
      setLastImport({ at: new Date().toISOString(), counts });
      console.log('[DataContext] applyLocalUpdate', {
        salas: normalizedSalasInput.length,
        alunos: normalizedAlunosInput.length,
        counts,
      });
    };

    if (!token) {
      applyLocalUpdate();
      return { success: true, offline: true };
    }

    try {
      const payload = { salas: nextSalas, alunos: nextAlunos };
      const { data } = await api.post('/import', payload);

      applyLocalUpdate({
        salas: data?.details?.salasProcessadas ?? normalizedSalasInput.length,
        alunos: data?.inserted ?? normalizedAlunosInput.length,
      });

      try {
        const synced = await syncFromServer();
        if (synced) {
          setLastImport({
            at: new Date().toISOString(),
            counts: { salas: synced.salas.length, alunos: synced.alunos.length },
          });
        }
      } catch (err) {
        console.warn('DataContext: falha ao atualizar dados após importação, usando cache local', err);
      }

      return data;
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('DataContext: import bloqueada por falta de autenticação, aplicando modo offline');
        applyLocalUpdate();
        return { success: true, offline: true };
      }
      throw error;
    }
  }, [syncFromServer]);

  const importCSV = useCallback(async (file) => {
    const parsed = await parseCSV(file);
    return parsed;
  }, []);

  const createSala = useCallback(({ nome, periodo }) => {
    const trimmedNome = String(nome || '').trim();
    if (!trimmedNome) return null;

    const rawSala = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`,
      nome: trimmedNome,
      periodo: periodo ? String(periodo).trim() : null,
      createdAt: new Date().toISOString(),
    };

    const normalizedSala = normalizeSala(rawSala);
    if (!normalizedSala) return null;

    setSalas((prev) => [...prev, normalizedSala]);
    return normalizedSala;
  }, []);

  const updateSala = useCallback((id, patch) => {
    const targetId = toOptionalString(id);
    if (!targetId) return null;

    let updatedSala = null;
    setSalas((prev) => {
      const next = prev.map((sala) => {
        if (toOptionalString(sala.id) !== targetId) return sala;

        const rawSala = {
          ...sala,
          ...patch,
          id: targetId,
          nome: patch?.nome !== undefined ? String(patch.nome).trim() : sala.nome,
          periodo: patch?.periodo !== undefined ? toOptionalString(patch.periodo) : sala.periodo,
          createdAt: sala.createdAt ?? sala.created_at ?? null,
        };

        const normalized = normalizeSala(rawSala) ?? sala;
        updatedSala = normalized;
        return normalized;
      });
      return next;
    });
    return updatedSala;
  }, []);

  const deleteSala = useCallback((id) => {
    const targetId = toOptionalString(id);
    if (!targetId) return;
    setSalas((prev) => prev.filter((sala) => toOptionalString(sala.id) !== targetId));
    setAlunos((prev) => prev.filter((aluno) => toOptionalString(aluno.salaId) !== targetId));
  }, []);

  const reset = useCallback(() => {
    setSalas([]);
    setAlunos([]);
    setLastImport(null);
    localStorage.removeItem(nsKey(LS_SALAS));
    localStorage.removeItem(nsKey(LS_ALUNOS));
    localStorage.removeItem(nsKey(LS_LAST));
  }, []);

  useEffect(() => {
    syncFromServer().catch(() => {
      // mantém dados do cache local quando offline ou sem auth
    });
  }, [syncFromServer]);

  // Reage dinamicamente a obtenção de token após login e troca de usuário
  useEffect(() => {
    const handler = (ev) => {
      const detail = ev?.detail || {};
      const token = detail.token || localStorage.getItem('token');
      if (!token) return;
      // Se usuário mudou, limpa caches namespaced do usuário anterior (somente se havia legado)
      console.log('[DataContext] authTokenSet detectado -> tentando resync', detail);
      syncFromServer().catch(() => {});
    };
    window.addEventListener('authTokenSet', handler);
    return () => window.removeEventListener('authTokenSet', handler);
  }, [syncFromServer]);

  // Também escuta mudanças de storage em outra aba que adicionem token
  useEffect(() => {
    const storageHandler = (e) => {
      if (e.key === 'token' && e.newValue) {
        console.log('[DataContext] storage token set -> resync');
        syncFromServer().catch(() => {});
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [syncFromServer]);

  const value = useMemo(() => ({
    salas,
    alunos,
    lastImport,
    importCSV,
    importRecords,
    createSala,
    updateSala,
    deleteSala,
    syncFromServer,
    reset,
  }), [salas, alunos, lastImport, importCSV, importRecords, createSala, updateSala, deleteSala, syncFromServer, reset]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData deve ser usado dentro de <DataProvider>');
  return context;
}
