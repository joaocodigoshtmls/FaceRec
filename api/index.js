// api/index.js - Exportar Express app para Vercel serverless

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

// Fallback para JWT_SECRET (evita 500 se variável não estiver configurada no Vercel)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido no ambiente — usando valor TEMPORÁRIO (apenas para testes).');
  process.env.JWT_SECRET = 'temp-secret-change-me';
}

dotenv.config();

const app = express();

/* ===== CORS Whitelist ===== */
const allowlist = [
  'https://facerec-f9sojq30p-joaocodigoshtmls-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowlist.includes(origin)) {
      return callback(null, true);
    }
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
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

/* ===== DB Pool ===== */
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;
  const port = process.env.DB_PORT || '3306';
  if (host && user && password && name) {
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
  }
  return null;
}

const DB_URL = getDatabaseUrl();
if (!DB_URL) {
  console.warn('⚠️ Variáveis de banco não configuradas. Defina DATABASE_URL ou DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.');
}

const pool = DB_URL
  ? mysql.createPool(DB_URL + '?connectionLimit=4&waitForConnections=true')
  : null;

/* ===== Helpers ===== */
const normalize = (v) => String(v || '').trim();
const normalizeEmail = (v) => normalize(v).toLowerCase();

/* ===== Rotas Auth mínimas (sem Prisma) ===== */
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Banco não configurado' });
    const { fullName, name, email, password, subject, school, phone, cpf } = req.body || {};
    const displayName = normalize(fullName || name);
    const normalizedEmail = normalizeEmail(email);
    if (!displayName) return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!normalizedEmail) return res.status(400).json({ error: 'E-mail é obrigatório' });
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

    const conn = await pool.getConnection();
    try {
      const [dup] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
      if (Array.isArray(dup) && dup.length > 0) {
        return res.status(409).json({ error: 'E-mail já cadastrado' });
      }

      const hash = await bcrypt.hash(password, 10);
      const [result] = await conn.execute(
        `INSERT INTO users (full_name, email, password_hash, role, subject, school, phone, cpf, created_at, updated_at)
         VALUES (?, ?, ?, 'professor', ?, ?, ?, ?, NOW(), NOW())`,
        [displayName, normalizedEmail, hash, subject || null, school || null, phone || null, cpf || null]
      );
      const userId = result.insertId?.toString?.() || String(result.insertId);

      const token = jwt.sign({ sub: userId, id: userId, role: 'professor' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
        message: 'Usuário criado com sucesso!',
        token,
        user: {
          id: userId,
          email: normalizedEmail,
          full_name: displayName,
          role: 'professor',
          subject: subject || null,
          school: school || null,
          phone: phone || null,
          cpf: cpf || null,
          profile_picture: null,
          classes: [],
        }
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Erro em /api/auth/register:', err);
    return res.status(500).json({ error: 'A server error has occurred' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Banco não configurado' });
    const { email, login, password } = req.body || {};
    const identifierRaw = email ?? login ?? '';
    const normalized = normalizeEmail(identifierRaw);
    if (!normalized) return res.status(400).json({ error: 'Informe o e-mail ou login' });

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, full_name, email, password_hash, role, subject, school, phone, cpf, profile_picture FROM users WHERE email = ? LIMIT 1`,
        [normalized]
      );
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'Usuário não encontrado' });
      const u = rows[0];
      const ok = await bcrypt.compare(password || '', u.password_hash);
      if (!ok) return res.status(400).json({ error: 'Senha incorreta' });
      const userId = String(u.id);
      const token = jwt.sign({ sub: userId, id: userId, role: u.role || 'professor' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.json({
        token,
        user: {
          id: userId,
          email: u.email,
          full_name: u.full_name,
          role: u.role || 'professor',
          subject: u.subject,
          school: u.school,
          phone: u.phone,
          cpf: u.cpf,
          profile_picture: u.profile_picture,
          classes: []
        }
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Erro em /api/auth/login:', err);
    return res.status(500).json({ error: 'A server error has occurred' });
  }
});

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Backend FaceRec (Vercel)' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date() });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

// Nada para desconectar explicitamente; pool do mysql2/promise cuida do ciclo no serverless

export default app;
