// frontend/lib/authApi-hardened.js
// Com suporte para URL absoluta (backend em AlwaysData)

import axios from 'axios';

/**
 * Detecta e configura API_BASE_URL
 * Prioridade:
 * 1. VITE_API_URL (variável de ambiente)
 * 2. VITE_API_ENDPOINT (alternativa)
 * 3. /api (relativa - Vercel by default)
 */
function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL || 
                  import.meta.env.VITE_API_ENDPOINT ||
                  '';
  
  if (fromEnv) {
    console.log('API Base URL (from env):', fromEnv);
    return fromEnv;
  }
  
  // Fallback: assume mesma origin
  console.log('API Base URL: relative /api');
  return '/api';
}

// Instância axios com configuração dinâmica
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  withCredentials: true, // CORS com cookies se necessário
});

// Interceptor de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('Erro de rede:', error.message);
      throw {
        code: 'NETWORK_ERROR',
        message: 'Erro de conexão com servidor',
      };
    }
    return Promise.reject(error);
  }
);

/**
 * Register com tratamento de erros
 */
export async function register(data) {
  try {
    const response = await api.post('/auth/register', data);
    
    // 201: Sucesso
    if (response.status === 201) {
      if (response.data?.ok) {
        // Guardar token se retornado
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('userId', response.data.userId);
        }
        return { success: true, user: response.data.user, code: 'REGISTERED' };
      }
    }
    
    return { success: false, message: response.data?.message || 'Erro desconhecido' };
  } catch (error) {
    const response = error.response;
    
    // 409: Email já existe
    if (response?.status === 409) {
      return {
        success: false,
        code: 'EMAIL_CONFLICT',
        message: 'Este e-mail já está cadastrado',
      };
    }
    
    // 422: Validação falhou
    if (response?.status === 422) {
      const issues = response.data?.issues || [];
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        fields: Object.fromEntries(
          issues.map(issue => [issue.field, issue.message])
        ),
      };
    }
    
    // 400: Bad request (JSON inválido)
    if (response?.status === 400) {
      return {
        success: false,
        code: 'BAD_REQUEST',
        message: response.data?.message || 'Requisição inválida',
      };
    }
    
    // 500+: Server error
    if (response?.status >= 500) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        message: response.data?.message || 'Erro no servidor',
        hint: response.data?.hint || '',
      };
    }
    
    // Rede ou unknown
    return {
      success: false,
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Alias: signup (usado em /api/signup)
 */
export async function signup(data) {
  return register(data);
}

/**
 * Getter: Retorna a URL base configurada
 */
export function getBaseURL() {
  return getApiBaseUrl();
}

export default api;
