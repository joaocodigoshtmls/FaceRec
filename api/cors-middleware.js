// api/cors-middleware.js - Middleware CORS reutilizável para todas as rotas

const allowlist = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

/**
 * Verificar se origin está na whitelist
 * @param {string} origin - Origin header do browser
 * @returns {boolean}
 */
function isOriginAllowed(origin) {
  if (!origin) return true; // Requisições sem origin são permitidas (ex: curl)
  
  // Whitelist exata
  if (allowlist.includes(origin)) return true;
  
  // Padrão: qualquer .vercel.app
  if (/^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return true;
  
  // EDITAR AQUI: Adicionar seu domínio customizado
  // Exemplo: https://facerec.com, https://app.facerec.com
  if (/^https:\/\/(seu-dominio-aqui\.com|app\.seu-dominio-aqui\.com|api\.seu-dominio-aqui\.com)$/i.test(origin)) return true;
  
  return false;
}

/**
 * Middleware CORS para Express
 * Usar: app.use(corsMiddleware);
 */
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin || '';
  
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24h
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Authorization, X-Total-Count');
  
  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
}

/**
 * Função para adicionar headers CORS a uma resposta
 * Usar em handlers serverless (Vercel)
 * @param {Request} req - Node request
 * @param {Response} res - Node response
 */
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

/**
 * Handler genérico para OPTIONS (preflight)
 * @param {Request} req
 * @param {Response} res
 */
export function handleOptions(req, res) {
  applyCorsHeaders(req, res);
  res.status(204).end();
}

export default {
  corsMiddleware,
  applyCorsHeaders,
  handleOptions,
  isOriginAllowed,
};
