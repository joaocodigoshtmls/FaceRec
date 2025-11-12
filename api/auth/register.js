// api/auth/register.js - Handler corrigido para Vercel com preflight OPTIONS e validação
// Exporta handlers nomeados: OPTIONS e POST (reconhecidos pelo Vercel)

import cors from 'cors';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ===== CORS Whitelist =====
const allowlist = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowlist.includes(origin)) return callback(null, true);
    // Padrão: *.vercel.app (EDITE AQUI para seu domínio customizado)
    if (/^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return callback(null, true);
    if (/^https:\/\/(seu-dominio-aqui\.com|api\.seu-dominio\.com)$/i.test(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'Authorization'],
  maxAge: 86400, // 24h
};

// ===== Helpers =====
const normalize = (v) => String(v || '').trim();
const normalizeEmail = (v) => normalize(v).toLowerCase();

function friendlyDbError(err) {
  const code = err?.code || err?.name || 'UNKNOWN';
  const map = {
    ER_ACCESS_DENIED_ERROR: 'Acesso ao banco negado: verifique usuário e senha.',
    ER_BAD_DB_ERROR: 'Banco de dados não existe: verifique DB_NAME/DATABASE_URL.',
    ER_NO_SUCH_TABLE: "Tabela requerida não existe (ex.: 'users'): aplique as migrações.",
    ENOTFOUND: 'Host do banco não encontrado: verifique DB_HOST.',
    ECONNREFUSED: 'Conexão recusada: verifique porta/Firewall/Permissões.',
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

// ===== Validators (Zod-like) =====
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

// ===== DB Pool (lazy initialization) =====
let pool = null;

function getOrCreatePool() {
  if (pool) return pool;
  const dbConf = getDbConfig();
  if (!dbConf) {
    throw new Error('Variáveis de banco não configuradas.');
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

// ===== Handler: OPTIONS (Preflight) =====
export async function OPTIONS(req, res) {
  // Retorna headers CORS sem body
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(204).end();
}

// ===== Handler: POST (Register) =====
export async function POST(req, res) {
  try {
    // 1. Headers CORS
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];
    const origin = req.headers.origin || '';
    
    if (allowedOrigins.includes(origin) || /^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin) || /^https:\/\/(seu-dominio-aqui\.com|api\.seu-dominio\.com)$/i.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 2. Parse body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ ok: false, message: 'JSON inválido' });
      }
    }

    // 3. Validação
    const validation = validateRegister(body);
    if (!validation.valid) {
      return res.status(422).json({ ok: false, issues: validation.errors });
    }

    const { name, email, password } = validation;

    // 4. Banco de dados
    const dbPool = getOrCreatePool();
    const conn = await dbPool.getConnection();

    try {
      // 5. Verificar email duplicado
      const [dup] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (Array.isArray(dup) && dup.length > 0) {
        return res.status(409).json({ ok: false, message: 'Email already registered' });
      }

      // 6. Hash de senha com bcryptjs
      const passwordHash = await bcrypt.hash(password, 10);

      // 7. Inserir user
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
    const expose = process.env.VERCEL_ENV === 'preview' || process.env.DEBUG_API === '1';

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Vary', 'Origin');

    return res.status(500).json(
      expose
        ? { 
            ok: false, 
            message: 'Internal server error',
            code: friendly.code,
            hint: friendly.message,
            detail: {
              errno: err?.errno,
              sqlState: err?.sqlState,
              message: err?.message,
            },
          }
        : { 
            ok: false, 
            message: friendly.message,
            code: friendly.code,
          }
    );
  }
}
