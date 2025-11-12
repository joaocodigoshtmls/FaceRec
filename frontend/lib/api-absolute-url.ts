/**
 * frontend/lib/api-absolute-url.ts
 * ⚠️ Fetch com URL ABSOLUTA para backend em AlwaysData
 * 
 * IMPORTANTE:
 * - Front: https://seu-app.vercel.app (Vercel)
 * - Back: https://facerec.alwaysdata.net (AlwaysData)
 * - NÃO use URLs relativas (/api/...) entre servidores diferentes
 */

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface ApiError {
  code?: string;
  message?: string;
  issues?: Array<{ field: string; message: string }>;
}

interface RegisterResponse {
  ok: boolean;
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  message?: string;
  code?: string;
  issues?: Array<{ field: string; message: string }>;
}

// ===== DETECTAR BASE URL =====
function getApiBaseUrl(): string {
  // Prioridade 1: Variável de ambiente Next.js
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    console.log('✓ API Base (from NEXT_PUBLIC_API_BASE_URL):', url);
    return url;
  }

  // Prioridade 2: Vite env (para Vite/React apps)
  try {
    // @ts-ignore
    const viteEnv = import.meta?.env?.VITE_API_URL;
    if (viteEnv) {
      console.log('✓ API Base (from VITE_API_URL):', viteEnv);
      return viteEnv;
    }
  } catch {
    // Fallback se não é Vite
  }

  // Prioridade 3: URL relativa (mesma origin - Vercel para Vercel)
  console.log('✓ API Base: relative /api (same origin)');
  return '/api';
}

const API_BASE_URL = getApiBaseUrl();

// ===== FUNÇÃO: Register com Tratamento de Erro =====
export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const url = `${API_BASE_URL}/auth/register`;

  console.log('📤 Fetching:', {
    method: 'POST',
    url,
    body: { ...payload, password: '***' },
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ⚠️ Só ative credentials se backend espera cookies
      // credentials: 'include',
      body: JSON.stringify(payload),
    });

    // Parse resposta (pode não ter corpo)
    let data: RegisterResponse | null = null;
    try {
      data = await response.json();
    } catch {
      // Response sem corpo (ex: 204)
      data = null;
    }

    console.log('📥 Response:', {
      status: response.status,
      ok: response.ok,
      data,
    });

    // ✅ 201: Sucesso
    if (response.status === 201 || (response.ok && data?.ok)) {
      return {
        ok: true,
        userId: data?.userId,
        user: data?.user,
        message: 'Usuário criado com sucesso',
      };
    }

    // ⚠️ 409: Email duplicado
    if (response.status === 409) {
      return {
        ok: false,
        code: 'EMAIL_CONFLICT',
        message: 'Este e-mail já está cadastrado',
      };
    }

    // ⚠️ 422: Validação falhou
    if (response.status === 422) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        issues: data?.issues || [],
      };
    }

    // ⚠️ 400: Bad request
    if (response.status === 400) {
      return {
        ok: false,
        code: 'BAD_REQUEST',
        message: data?.message || 'Requisição inválida',
      };
    }

    // 🔴 500+: Server error
    if (response.status >= 500) {
      console.error('🔴 Server Error:', data);
      return {
        ok: false,
        code: 'SERVER_ERROR',
        message: data?.message || 'Erro no servidor',
      };
    }

    // 🔴 Outro erro HTTP
    console.error('🔴 HTTP Error:', response.status, data);
    return {
      ok: false,
      code: 'HTTP_ERROR',
      message: data?.message || `Erro HTTP ${response.status}`,
    };
  } catch (error: any) {
    // 🔴 Erro de rede ou parsing
    console.error('🔴 Network/Fetch Error:', error);

    // Erro comum: CORS
    if (error?.message?.includes('CORS')) {
      return {
        ok: false,
        code: 'CORS_ERROR',
        message: 'CORS bloqueado: verifique se backend autoriza este domínio',
      };
    }

    // Erro comum: DNS/connection
    if (error?.message?.includes('Failed to fetch')) {
      return {
        ok: false,
        code: 'NETWORK_ERROR',
        message: `Não conseguiu conectar ao servidor: ${API_BASE_URL}`,
      };
    }

    return {
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'Erro desconhecido',
    };
  }
}

// ===== FUNÇÃO: Alias (outro nome) =====
export async function signup(payload: RegisterPayload): Promise<RegisterResponse> {
  return registerUser(payload);
}

// ===== EXPORT: Base URL para debugging =====
export function getBaseURL(): string {
  return API_BASE_URL;
}

// ===== EXPORT: Debug info =====
export function debugInfo(): object {
  return {
    apiBaseUrl: API_BASE_URL,
    environment: typeof window !== 'undefined' ? 'browser' : 'node',
    url: typeof window !== 'undefined' ? window.location.origin : 'N/A',
  };
}
