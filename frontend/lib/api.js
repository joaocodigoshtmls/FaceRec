import axios from 'axios';

// Configurar baseURL:
// - Se VITE_API_BASE estiver definida, usa ela (tanto em dev quanto em prod).
// - Caso contrário: em prod usa "/api" (esperando rewrite/proxy no host), em dev usa localhost:3001.
const baseURL =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL,
  withCredentials: true, // Enviar credenciais (cookies, headers de auth)
});

// 🔒 Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Tenta múltiplas chaves possíveis onde o token pode estar armazenado
    const token = 
      localStorage.getItem('token') ||        // Chave principal
      localStorage.getItem('authToken') ||    // Alternativa 1
      localStorage.getItem('accessToken') ||  // Alternativa 2
      localStorage.getItem('jwt');            // Alternativa 3
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiBaseURL = baseURL;

export const apiOrigin = (() => {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(baseURL, window.location.origin);
    url.pathname = url.pathname.replace(/\/api$/, '');
    const cleanedPath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    return `${url.origin}${cleanedPath}`;
  } catch {
    return '';
  }
})();

export const buildUploadsUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!apiOrigin) return normalized;
  return `${apiOrigin}${normalized}`;
};

export default api;
