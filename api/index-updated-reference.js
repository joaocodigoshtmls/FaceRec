// api/index-updated.js - EXEMPLO de como integrar o handler register.js ao Express app
// ⚠️ APENAS PARA REFERÊNCIA - Use a rota separada /api/auth/register.js para Vercel

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import { corsMiddleware, applyCorsHeaders } from './cors-middleware.js';

// Fallback para JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido no ambiente — usando valor TEMPORÁRIO (apenas para testes).');
  process.env.JWT_SECRET = 'temp-secret-change-me';
}

dotenv.config();

const app = express();

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
    if (/^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return callback(null, true);
    if (/^https:\/\/(seu-dominio-aqui\.com|api\.seu-dominio-aqui\.com)$/i.test(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'Authorization'],
};

// Middleware
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ← IMPORTANTE: preflight para todas as rotas

app.use(express.json({ limit: '10mb' }));

// ===== DB Pool =====
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

const dbConf = getDbConfig();
if (!dbConf) {
  console.warn('⚠️ Variáveis de banco não configuradas. Defina DATABASE_URL ou DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.');
}

const pool = dbConf
  ? (dbConf.url
      ? mysql.createPool(dbConf.url)
      : mysql.createPool({
          host: dbConf.host,
          user: dbConf.user,
          password: dbConf.password,
          database: dbConf.database,
          port: dbConf.port,
          waitForConnections: true,
          connectionLimit: 4,
        }))
  : null;

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

// ===== Rotas Auth com Validação =====

/**
 * POST /api/auth/register
 * Cadastro de novo usuário com validação e hash de senha
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ ok: false, error: 'Banco não configurado' });

    // Validação
    const validation = validateRegister(req.body);
    if (!validation.valid) {
      return res.status(422).json({ ok: false, issues: validation.errors });
    }

    const { name, email, password } = validation;
    const { subject, school, phone, cpf } = req.body || {};

    const conn = await pool.getConnection();
    try {
      // Verificar email duplicado
      const [dup] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (Array.isArray(dup) && dup.length > 0) {
        return res.status(409).json({ ok: false, message: 'Email already registered' });
      }

      // Hash de senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Inserir usuário
      const [result] = await conn.execute(
        `INSERT INTO users (full_name, email, password_hash, role, subject, school, phone, cpf, created_at, updated_at)
         VALUES (?, ?, ?, 'professor', ?, ?, ?, ?, NOW(), NOW())`,
        [name, email, passwordHash, subject || null, school || null, phone || null, cpf || null]
      );

      const userId = result.insertId?.toString?.() || String(result.insertId);

      // JWT Token
      const token = jwt.sign({ sub: userId, id: userId, role: 'professor' }, process.env.JWT_SECRET, { expiresIn: '24h' });

      return res.status(201).json({
        ok: true,
        userId,
        token,
        message: 'Usuário criado com sucesso!',
        user: {
          id: userId,
          email,
          name,
          role: 'professor',
          subject: subject || null,
          school: school || null,
          phone: phone || null,
          cpf: cpf || null,
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
});

/**
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ ok: false, error: 'Banco não configurado' });
    
    const { email, login, password } = req.body || {};
    const identifierRaw = email ?? login ?? '';
    const normalized = normalizeEmail(identifierRaw);
    
    if (!normalized) return res.status(400).json({ ok: false, message: 'Informe o e-mail ou login' });

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, full_name, email, password_hash, role FROM users WHERE email = ? LIMIT 1`,
        [normalized]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ ok: false, message: 'Usuário não encontrado' });
      }
      
      const u = rows[0];
      const ok = await bcrypt.compare(password || '', u.password_hash);
      
      if (!ok) {
        return res.status(400).json({ ok: false, message: 'Senha incorreta' });
      }
      
      const userId = String(u.id);
      const token = jwt.sign({ sub: userId, id: userId, role: u.role || 'professor' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      return res.json({
        ok: true,
        token,
        user: {
          id: userId,
          email: u.email,
          full_name: u.full_name,
          role: u.role || 'professor',
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Erro em POST /api/auth/login:', err);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// ===== Fallback =====
app.get('/', (req, res) => {
  res.json({ message: 'API de Autenticação FaceRec' });
});

export default app;
