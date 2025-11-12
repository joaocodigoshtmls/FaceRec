// api/auth/register-v2.js - Handler aprimorado com CORS via .env
// Exporta: OPTIONS(req, res) e POST(req, res)
// Runtime: Node.js (suporta bcryptjs)

import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ===== CORS Configurável via .env =====
function getCorsOrigins() {
  const envOrigins = process.env.CORS_ORIGINS || '';
  const defaults = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];
  
  const customOrigins = envOrigins
    .split(',')
    .map(o => o.trim())
    .filter(o => o.length > 0);
  
  return [...defaults, ...customOrigins];
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  const allowlist = getCorsOrigins();
  
  // Whitelist exata
  if (allowlist.includes(origin)) return true;
  
  // Padrão: *.vercel.app
  if (/^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return true;
  
  return false;
}

// ===== Helpers =====
const normalize = (v) => String(v || '').trim();
const normalizeEmail = (v) => normalize(v).toLowerCase();

function friendlyDbError(err) {
  const code = err?.code || err?.name || 'UNKNOWN';
  const map = {
    ER_ACCESS_DENIED_ERROR: 'Acesso ao banco negado: verifique usuário e senha.',
    ER_BAD_DB_ERROR: 'Banco de dados não existe: verifique DB_NAME/DATABASE_URL.',
    ER_NO_SUCH_TABLE: "Tabela 'users' não existe: aplique migrações Prisma.",
    ENOTFOUND: 'Host do banco não encontrado: verifique DB_HOST.',
    ECONNREFUSED: 'Conexão recusada: verifique porta/firewall.',
  };
  return { code, message: map[code] || 'Erro de banco de dados' };
}

function getDbConfig() {
  if (process.env.DATABASE_URL) return { url: process.env.DATABASE_URL };
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT || 3306);
  if (host && user && password && database) {
    return { host, user, password, database, port };
  }
  return null;
}

// ===== Validators =====
function validateRegister(data) {
  const errors = [];
  
  const name = normalize(data?.fullName || data?.name || '');
  if (!name || name.length < 2) {
    errors.push({ field: 'name', message: 'Nome deve ter pelo menos 2 caracteres' });
  }
  
  const email = normalizeEmail(data?.email || '');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'E-mail inválido' });
  }
  
  const password = String(data?.password || '');
  if (!password || password.length < 8) {
    errors.push({ field: 'password', message: 'Senha deve ter pelo menos 8 caracteres' });
  }
  
  return { valid: errors.length === 0, errors, name, email, password };
}

// ===== DB Pool =====
let pool = null;

function getOrCreatePool() {
  if (pool) return pool;
  const dbConf = getDbConfig();
  if (!dbConf) {
    throw new Error('DATABASE_URL ou DB_* não configurados');
  }
  if (dbConf.url) {
    pool = mysql.createPool(dbConf.url);
  } else {
    pool = mysql.createPool({
      host: dbConf.host,
      user: dbConf.user,
      password: dbConf.password,
      database: dbConf.database,
      port: dbConf.port,
      waitForConnections: true,
      connectionLimit: 4,
    });
  }
  return pool;
}

// ===== Middleware: Aplicar CORS Headers =====
function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  
  // Vary: Origin (cache-friendly CORS)
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ===== Handler: OPTIONS (Preflight) =====
export async function OPTIONS(req, res) {
  applyCorsHeaders(req, res);
  res.status(204).end();
}

// ===== Handler: POST (Register) =====
export async function POST(req, res) {
  try {
    applyCorsHeaders(req, res);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Parse body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ ok: false, message: 'JSON inválido' });
      }
    }

    // Validação
    const validation = validateRegister(body);
    if (!validation.valid) {
      return res.status(422).json({ ok: false, issues: validation.errors });
    }

    const { name, email, password } = validation;

    // Banco
    const dbPool = getOrCreatePool();
    const conn = await dbPool.getConnection();

    try {
      // Verificar email único
      const [dup] = await conn.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      if (Array.isArray(dup) && dup.length > 0) {
        return res.status(409).json({
          ok: false,
          message: 'Email already registered',
          code: 'EMAIL_CONFLICT',
        });
      }

      // Hash senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert
      const [result] = await conn.execute(
        `INSERT INTO users (full_name, email, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, 'professor', NOW(), NOW())`,
        [name, email, passwordHash]
      );

      const userId = result.insertId?.toString?.() || String(result.insertId);

      return res.status(201).json({
        ok: true,
        userId,
        message: 'Usuário criado com sucesso!',
        user: {
          id: userId,
          email,
          name,
          role: 'professor',
          createdAt: new Date().toISOString(),
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Erro em POST /api/auth/register:', err);
    
    const friendly = friendlyDbError(err);
    const expose = process.env.DEBUG_API === '1';

    applyCorsHeaders(req, res);

    return res.status(500).json(
      expose
        ? {
            ok: false,
            message: 'Internal server error',
            code: friendly.code,
            hint: friendly.message,
          }
        : {
            ok: false,
            message: friendly.message,
            code: friendly.code,
          }
    );
  }
}
