// frontend/lib/authApi.js - Funções de autenticação com tratamento de erros e CORS

import api from './api';

/**
 * Registrar novo usuário
 * @param {Object} data - { name, email, password }
 * @returns {Promise<{ ok: boolean, userId?: string, user?: Object, message?: string, issues?: Array }>}
 * 
 * Respostas possíveis:
 * - 201: { ok: true, userId, user: { id, email, name, role, createdAt } }
 * - 409: { ok: false, message: 'Email already registered' }
 * - 422: { ok: false, issues: [{ field, message }, ...] }
 * - 500: { ok: false, message: 'Internal error' }
 */
export async function register(data) {
  try {
    const response = await api.post('/auth/register', {
      fullName: data.name || data.fullName,
      name: data.name || data.fullName,
      email: data.email,
      password: data.password,
      subject: data.subject || null,
      school: data.school || null,
      phone: data.phone || null,
      cpf: data.cpf || null,
    });

    // Sucesso: salvar token se existir
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('authToken', response.data.token); // Backup
    }

    return {
      ok: true,
      userId: response.data?.userId || response.data?.user?.id,
      user: response.data?.user,
      message: response.data?.message || 'Usuário criado com sucesso!',
    };
  } catch (error) {
    const response = error.response;

    // 409: Conflito (email já existe)
    if (response?.status === 409) {
      return {
        ok: false,
        message: response.data?.message || 'Email já cadastrado',
        code: 'CONFLICT',
      };
    }

    // 422: Validação falhou
    if (response?.status === 422) {
      return {
        ok: false,
        message: 'Validação falhou',
        issues: response.data?.issues || [],
        code: 'VALIDATION_ERROR',
      };
    }

    // 500: Erro interno
    if (response?.status === 500) {
      return {
        ok: false,
        message: response.data?.message || 'Erro ao criar usuário',
        code: 'SERVER_ERROR',
        hint: response.data?.hint,
      };
    }

    // Outros erros (CORS, rede, etc)
    return {
      ok: false,
      message: error.message || 'Erro na requisição',
      code: error.code || 'NETWORK_ERROR',
    };
  }
}

/**
 * Login com email/senha
 * @param {string} email - Email do usuário
 * @param {string} password - Senha
 * @returns {Promise<{ ok: boolean, token?: string, user?: Object, message?: string }>}
 */
export async function login(email, password) {
  try {
    const response = await api.post('/auth/login', { email, password });

    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('authToken', response.data.token);
    }

    return {
      ok: true,
      token: response.data?.token,
      user: response.data?.user,
      message: 'Login realizado!',
    };
  } catch (error) {
    const response = error.response;
    return {
      ok: false,
      message: response?.data?.message || response?.data?.error || 'Erro no login',
      code: response?.data?.code,
    };
  }
}

/**
 * Logout
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('jwt');
}

/**
 * Obter token armazenado
 */
export function getStoredToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('jwt')
  );
}

export default {
  register,
  login,
  logout,
  getStoredToken,
};
