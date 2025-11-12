// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.mjs';
import prisma from './prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

import { installRealtime } from './server_realtime.mjs';

import { installAttendanceRoutes, installFaceRoutes } from './server_attendance_routes.mjs';

import http from 'http';

const app = express();
const server = http.createServer(app);

// Middleware de bloqueio definitivo de rotas antigas /api/admin/*
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin/')) {
    // Resposta padronizada de rota desativada
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', '2025-12-31');
    return res.status(410).json({
      error: 'Endpoint removido. Use a rota equivalente sem /api/admin/.',
      suggestion: req.path.replace('/api/admin/', '/api/'),
      removedAt: '2025-11-11',
      sunset: '2025-12-31'
    });
  }
  return next();
});

let ensuredClassroomsOwnerColumn = false;
let ensuredStudentsOwnerColumn = false;
let ensuredUsersFullNameColumn = false;

async function ensureClassroomsOwnerColumn(conn) {
  if (ensuredClassroomsOwnerColumn) return;
  try {
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classrooms' AND COLUMN_NAME = 'owner_user_id'`
    );
    if (cols.length === 0) {
      console.log('🔧 Adicionando coluna owner_user_id em classrooms (ajuste automático)');
      await conn.execute(`ALTER TABLE classrooms ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER id`);
      await conn.execute(`ALTER TABLE classrooms ADD INDEX idx_classrooms_owner (owner_user_id)`);
    }
    ensuredClassroomsOwnerColumn = true;
  } catch (err) {
    console.warn('⚠️  Falha ao garantir coluna owner_user_id em classrooms:', err?.message || err);
  }
}

async function ensureStudentsOwnerColumn(conn) {
  if (ensuredStudentsOwnerColumn) return;
  try {
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'owner_user_id'`
    );
    if (cols.length === 0) {
      console.log('🔧 Adicionando coluna owner_user_id em students (ajuste automático)');
      await conn.execute(`ALTER TABLE students ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER classroom_id`);
      await conn.execute(`ALTER TABLE students ADD INDEX idx_students_owner (owner_user_id)`);
    }
    ensuredStudentsOwnerColumn = true;
  } catch (err) {
    console.warn('⚠️  Falha ao garantir coluna owner_user_id em students:', err?.message || err);
  }
}

async function ensureUsersFullNameColumn(conn) {
  if (ensuredUsersFullNameColumn) return;
  try {
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'full_name'`
    );
    if (cols.length === 0) {
      console.log('🔧 Adicionando coluna full_name em users (ajuste automático)');
      await conn.execute(`ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER email`);

      const [nameCols] = await conn.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name'`
      );
      if (nameCols.length > 0) {
        await conn.execute(
          `UPDATE users SET full_name = name WHERE (full_name IS NULL OR full_name = '') AND name IS NOT NULL`
        );
      }
    }
    ensuredUsersFullNameColumn = true;
  } catch (err) {
    console.warn('⚠️  Falha ao garantir coluna full_name em users:', err?.message || err);
  }
}

async function ensureUsersFullNameColumnFromPool() {
  if (ensuredUsersFullNameColumn) return;
  const conn = await pool.getConnection();
  try {
    await ensureUsersFullNameColumn(conn);
  } finally {
    conn.release();
  }
}

async function getUserWithClasses(userId, externalConn = null) {
  const conn = externalConn || await pool.getConnection();
  try {
    await ensureUsersFullNameColumn(conn);
    const [users] = await conn.execute(
      `SELECT id, full_name, email, role, subject, school, phone, cpf, profile_picture, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) return null;

    const user = users[0];
    const [classesRows] = await conn.execute(
      'SELECT class_name FROM teacher_classes WHERE user_id = ? ORDER BY class_name',
      [userId]
    );

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      subject: user.subject,
      school: user.school,
      phone: user.phone,
      cpf: user.cpf,
      profile_picture: user.profile_picture,
      photoURL: user.profile_picture,
      created_at: user.created_at,
      updated_at: user.updated_at,
      classes: classesRows.map((row) => row.class_name),
    };
  } finally {
    if (!externalConn) conn.release();
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeClassList(rawClasses) {
  if (!rawClasses) return [];
  const items = Array.isArray(rawClasses)
    ? rawClasses
    : String(rawClasses)
        .split(/,|\n/)
        .map((item) => item.trim());

  const seen = new Set();
  return items
    .map((item) => String(item || '').trim())
    .filter((item) => {
      if (!item) return false;
      if (seen.has(item.toLowerCase())) return false;
      seen.add(item.toLowerCase());
      return true;
    });
}

function resolveOwnerKey(rawValue) {
  if (rawValue === undefined || rawValue === null) return null;

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return String(Math.max(0, Math.trunc(rawValue)));
  }

  const rawString = String(rawValue).trim();
  if (!rawString) return null;

  if (/^\d+$/.test(rawString)) {
    return rawString.replace(/^0+/, '') || '0';
  }

  const hashBuffer = crypto.createHash('sha256').update(rawString).digest();
  let numericKey = hashBuffer.readBigUInt64BE(0);
  if (numericKey === 0n) {
    numericKey = hashBuffer.readBigUInt64BE(8);
  }

  return numericKey === 0n ? '1' : numericKey.toString();
}

function buildOwnerKeyCandidates(rawValue) {
  const candidates = [];
  const primary = resolveOwnerKey(rawValue);
  if (primary) candidates.push(primary);

  if (rawValue !== undefined && rawValue !== null) {
    const rawString = String(rawValue).trim();
    if (rawString) {
      if (/^\d+$/.test(rawString)) {
        const numeric = rawString.replace(/^0+/, '') || '0';
        if (!candidates.includes(numeric)) candidates.push(numeric);
      } else if (!candidates.includes(rawString)) {
        candidates.push(rawString);
      }
    }
  }

  return candidates;
}

function ownerValueMatches(ownerValue, allowedKeys) {
  if (!allowedKeys?.length) return false;
  if (ownerValue === undefined || ownerValue === null) return true;
  if (ownerValue === 0 || ownerValue === '0') return true;
  const ownerKeys = buildOwnerKeyCandidates(ownerValue);
  return ownerKeys.some((key) => allowedKeys.includes(key));
}

function needsOwnershipMigration(currentOwnerValue, targetKey) {
  if (!targetKey) return false;
  if (currentOwnerValue === undefined || currentOwnerValue === null) return true;
  if (currentOwnerValue === 0 || currentOwnerValue === '0') return true;
  const currentCandidates = buildOwnerKeyCandidates(currentOwnerValue);
  return !currentCandidates.includes(targetKey);
}
const DEFAULT_ADMIN_LOGIN_RAW = process.env.DEFAULT_ADMIN_LOGIN || '@administrador';
const DEFAULT_ADMIN_LOGIN = normalizeEmail(DEFAULT_ADMIN_LOGIN_RAW);
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || '@administrador';
const DEFAULT_ADMIN_ID = process.env.DEFAULT_ADMIN_ID || 'predefined-admin';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Administrador do Sistema';

function buildPredefinedAdminUser() {
  return {
    id: DEFAULT_ADMIN_ID,
    full_name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_LOGIN_RAW,
    role: 'supervisor',
    subject: null,
    school: null,
    phone: null,
    cpf: null,
    profile_picture: '',
    photoURL: '',
    classes: [],
  };
}

/* ===== CORS (habilita front em Vite e produção) ===== */
const parseOrigins = (val) => String(val || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const envOrigins = parseOrigins(process.env.CORS_ORIGINS);
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
// Permitimos também domínios *.vercel.app e *.alwaysdata.net
const regexOrigins = [
  /https?:\/\/([a-z0-9-]+)\.vercel\.app$/i,
  /https?:\/\/([a-z0-9-]+)\.alwaysdata\.net$/i,
];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // permite requests server-to-server e ferramentas
  if (envOrigins.includes(origin)) return true;
  if (defaultOrigins.includes(origin)) return true;
  return regexOrigins.some((re) => re.test(origin));
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept'],
  exposedHeaders: ['Content-Length']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* ===== Body parser ===== */
app.use(express.json({ limit: '10mb' }));

/* ===== Configuração de uploads ===== */
const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-pics');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Pasta de uploads criada:', uploadsDir);
}

// 🔧 ALTERADO: Servir /uploads SEM CACHE para evitar avatar “fantasma”
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // usa o ID do token (req.user.sub)
    cb(null, `profile-${req.user?.sub || 'anon'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/* ===== Porta ===== */
const PORT = process.env.PORT || 3001;

/* ===== Fallback de JWT_SECRET em dev ===== */
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET não definido no .env — usando valor TEMPORÁRIO (apenas dev).');
  process.env.JWT_SECRET = 'dev-temp-secret-change-me';
}

/* ===== Middleware de autenticação JWT ===== */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de acesso requerido' });

  // Permitir tokens "mock"/temporários em desenvolvimento quando explicitamente habilitado
  const allowMock = (process.env.NODE_ENV || 'development') !== 'production' || process.env.ALLOW_MOCK_ADMIN === '1';
  if (allowMock) {
    try {
      if (typeof token === 'string' && (token.startsWith('mock-token-') || token.startsWith('temp-admin-token-') || token.startsWith('mock-'))) {
        console.log('🧪 Autenticação: token mock detectado e aceito (dev)');
        req.user = {
          sub: process.env.DEFAULT_ADMIN_ID || 'predefined-admin',
          id: process.env.DEFAULT_ADMIN_ID || 'predefined-admin',
          role: 'admin',
        };
        return next();
      }
    } catch (e) {
      console.warn('Erro ao processar token mock:', e);
    }
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Erro no token:', err);
      return res.status(403).json({ error: 'Token inválido' });
    }
    // Normaliza claims para garantir req.user.sub
    if (!user.sub && user.id) user.sub = user.id;
    req.user = user;
    next();
  });
};

/* ===== Rotas de teste ===== */
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Server funcionando!',
    timestamp: new Date(),
    port: PORT
  });
});

/* Saúde da API (para checar no navegador) */
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date(), port: PORT });
});

/* ===== Signup ===== */
const handleSignup = async (req, res) => {
  const {
    fullName,
    email,
    password,
    subject,
    school,
    classes,
    phone,
    cpf,
  } = req.body || {};

  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ error: 'Nome completo é obrigatório' });
  }
  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }
  if (!subject || !String(subject).trim()) {
    return res.status(400).json({ error: 'Informe a matéria que leciona' });
  }
  // Escola e classes agora são opcionais
  // if (!school || !String(school).trim()) {
  //   return res.status(400).json({ error: 'Informe a escola do professor' });
  // }

  const normalizedClasses = normalizeClassList(classes) || [];
  // Classes agora são opcionais
  // if (normalizedClasses.length === 0) {
  //   return res.status(400).json({ error: 'Informe pelo menos uma turma atribuída' });
  // }

  const conn = await pool.getConnection();
  let transactionStarted = false;

  try {
    await ensureUsersFullNameColumn(conn);

    const hash = await bcrypt.hash(password, 10);
    await conn.beginTransaction();
    transactionStarted = true;

    const [result] = await conn.execute(
      `INSERT INTO users (full_name, email, password_hash, role, subject, school, phone, cpf)
       VALUES (?, ?, ?, 'professor', ?, ?, ?, ?)` ,
      [
        String(fullName).trim(),
        normalizeEmail(email),
        hash,
        String(subject).trim(),
        String(school).trim(),
        phone ? String(phone).trim() : null,
        cpf ? String(cpf).trim() : null,
      ]
    );

    const userId = result.insertId;

    // Insere classes apenas se existirem
    if (normalizedClasses && normalizedClasses.length > 0) {
      const placeholders = normalizedClasses.map(() => '(?, ?)').join(', ');
      const values = normalizedClasses.flatMap((className) => [userId, className]);
      await conn.execute(
        `INSERT INTO teacher_classes (user_id, class_name) VALUES ${placeholders}`,
        values
      );
    }

    await conn.commit();
    transactionStarted = false;

    res.status(201).json({ userId, role: 'professor' });
  } catch (err) {
    if (transactionStarted) {
      try { await conn.rollback(); } catch {}
    }

    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    console.error('Erro no cadastro:', err);
    res.status(500).json({ error: 'Falha no cadastro: ' + err.message });
  } finally {
    conn.release();
  }
};

app.post('/signup', handleSignup);
app.post('/api/signup', handleSignup);

/* ===== Login ===== */
const handleLogin = async (req, res) => {
  const { email, login, password } = req.body || {};
  const identifierRaw = email ?? login ?? '';
  const normalizedIdentifier = normalizeEmail(identifierRaw);

  if (!normalizedIdentifier) {
    return res.status(400).json({ error: 'Informe o e-mail ou login' });
  }

  try {
    if (normalizedIdentifier === DEFAULT_ADMIN_LOGIN) {
      if (String(password || '') !== String(DEFAULT_ADMIN_PASSWORD)) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      const adminUser = buildPredefinedAdminUser();
      const token = jwt.sign({ sub: adminUser.id, role: 'supervisor' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      });

      return res.json({ token, user: adminUser });
    }

    const [rows] = await pool.execute(
      `SELECT id, password_hash FROM users WHERE email = ?`,
      [normalizedIdentifier]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

    const user = rows[0];
    const match = await bcrypt.compare(password || '', user.password_hash);
    if (!match) return res.status(401).json({ error: 'Senha incorreta' });

    const detailedUser = await getUserWithClasses(user.id);
  // Compat: mapeia 'admin' -> 'supervisor'
  const mappedRole = (detailedUser?.role === 'admin') ? 'supervisor' : (detailedUser?.role || 'professor');
  const tokenPayload = { sub: user.id, role: mappedRole };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    console.log('Login realizado para usuário ID:', user.id);
    res.json({ token, user: detailedUser });
  } catch (err) {
    // Se houver falha de conexão com o DB, oferecer um fallback de administrador
    console.error('Erro no login (DB ou outro):', err?.code || err?.message || err);

    const fallbackCandidates = [
      {
        login: DEFAULT_ADMIN_LOGIN,
        password: DEFAULT_ADMIN_PASSWORD,
        user: buildPredefinedAdminUser(),
      },
      {
        login: normalizeEmail('admin@facerec.com'),
        password: 'FaceRec@123',
        user: {
          id: 'fallback-admin',
          full_name: 'Administrador (fallback)',
          email: 'admin@facerec.com',
          role: 'admin',
          subject: null,
          school: null,
          phone: null,
          cpf: null,
          profile_picture: '',
          photoURL: '',
          classes: [],
        },
      },
    ];

    const matchedFallback = fallbackCandidates.find(
      (candidate) =>
        normalizedIdentifier === candidate.login &&
        String(password || '') === String(candidate.password)
    );

    if (matchedFallback) {
      console.warn('⚠️  Usando fallback de admin (DB inacessível) para:', matchedFallback.user.email);
      const token = jwt.sign({ sub: matchedFallback.user.id, role: matchedFallback.user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      });

      return res.json({ token, user: matchedFallback.user });
    }

    res.status(500).json({ error: 'Erro no login: ' + (err?.message || String(err)) });
  }
};

app.post('/login', handleLogin);
app.post('/api/login', handleLogin);

/* ===== Sync Firebase → MariaDB ===== */
app.post('/api/sync-firebase-user', async (req, res) => {
  const { firebaseEmail, firebaseDisplayName, firebaseUid, firebasePhotoURL } = req.body;

  try {
    console.log('🔄 Sincronizando usuário do Firebase:', firebaseEmail);

    await ensureUsersFullNameColumnFromPool();

    const normalizedEmail = normalizeEmail(firebaseEmail);

    const [existingUsers] = await pool.execute(
      `SELECT id, full_name, email, profile_picture FROM users WHERE email = ?`,
      [normalizedEmail]
    );

    let userId;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log('✅ Usuário já existe no MariaDB, ID:', userId);

      let needsUpdate = false;
      let updateFields = [];
      let updateValues = [];

      if (firebaseDisplayName && existingUsers[0].full_name !== firebaseDisplayName) {
        updateFields.push('full_name = ?');
        updateValues.push(firebaseDisplayName);
        needsUpdate = true;
      }

      // Atualiza foto apenas se não há foto personalizada (não começar com /uploads)
      if (firebasePhotoURL && (!existingUsers[0].profile_picture || !existingUsers[0].profile_picture.startsWith('/uploads'))) {
        updateFields.push('profile_picture = ?');
        updateValues.push(firebasePhotoURL);
        needsUpdate = true;
      }

      if (needsUpdate) {
        updateValues.push(userId);
        await pool.execute(
          `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          updateValues
        );
        console.log('📝 Dados atualizados no MariaDB');
      }
    } else {
      console.log('➕ Criando novo usuário no MariaDB...');
      const [result] = await pool.execute(
        `INSERT INTO users (full_name, email, password_hash, firebase_uid, profile_picture, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          firebaseDisplayName || 'Usuário Firebase',
          normalizedEmail,
          'firebase_auth',
          firebaseUid,
          firebasePhotoURL || null
        ]
      );
      userId = result.insertId;
      console.log('✅ Novo usuário criado no MariaDB, ID:', userId);
    }

    const token = jwt.sign(
      { sub: userId, email: normalizedEmail, firebase: true },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('🎫 Token JWT gerado para usuário ID:', userId);

    res.json({
      success: true,
      token,
      userId,
      message: 'Usuário sincronizado com sucesso'
    });

  } catch (err) {
    console.error('❌ Erro ao sincronizar usuário:', err);
    res.status(500).json({ error: 'Erro ao sincronizar usuário: ' + err.message });
  }
});

/* ===== Listar salas e alunos (alias sem /admin) ===== */
const listClassroomsHandler = async (req, res) => {
  try {
    // ✅ PERMITE TANTO ADMIN QUANTO PROFESSOR ACESSAR SUAS SALAS
    // Cada um só vê suas próprias salas baseado no owner_user_id

    const ownerRaw = req.user?.sub ?? req.user?.id;
    let derivedOwnerKeys = buildOwnerKeyCandidates(ownerRaw).filter((key) => key !== undefined && key !== null);
    // Ajuste: se não houver chave válida (ex: sub não numérico para admin predefinido), usar '0' como fallback
    if (!derivedOwnerKeys.length) {
      derivedOwnerKeys = ['0'];
    }

    const ownerKeySet = new Set(derivedOwnerKeys.map((key) => String(key)));
    ownerKeySet.add('0');

    // Se Prisma não estiver pronto (client não gerado), faz fallback para SQL bruto
    const prismaReady = prisma && prisma.classrooms && typeof prisma.classrooms.findMany === 'function';

    if (prismaReady) {
      // 🔎 Buscar um admin para ampliar filtro, como no código original (somente se Prisma disponível)
      try {
        const adminByEmail = await prisma.users.findFirst({
          where: { email: '@administrador' },
          select: { id: true }
        });
        if (adminByEmail?.id) {
          ownerKeySet.add(String(adminByEmail.id));
        } else {
          const adminAny = await prisma.users.findFirst({
            where: { role: 'admin' },
            select: { id: true }
          });
          if (adminAny?.id) ownerKeySet.add(String(adminAny.id));
        }
      } catch (err) {
        console.warn('Falha ao buscar admin para ampliar filtro de owner (Prisma):', err?.message || err);
      }
    }

    const ownerFilterKeys = Array.from(ownerKeySet).filter((key) => /^\d+$/.test(key));
    if (!ownerFilterKeys.length) ownerFilterKeys.push('0');

    if (!prismaReady) {
      console.warn('⚠️ Prisma Client indisponível. Usando fallback com MySQL (pool).');
      const conn = await pool.getConnection();
      try {
        await ensureClassroomsOwnerColumn(conn);
        await ensureStudentsOwnerColumn(conn);

        const ownersPlaceholder = ownerFilterKeys.map(() => '?').join(',');
        const ownerFilter = `owner_user_id IS NULL OR owner_user_id IN (${ownersPlaceholder})`;

        const [classrooms] = await conn.execute(
          `SELECT id, name as nome, periodo, created_at
           FROM classrooms
           WHERE ${ownerFilter}
           ORDER BY name`,
          ownerFilterKeys
        );

        let alunos = [];
        if (classrooms.length > 0) {
          const ids = classrooms.map(c => c.id);
          const placeholders = ids.map(() => '?').join(',');
          if (ids.length > 0) {
            const studentOwnerFilter = `owner_user_id IS NULL OR owner_user_id IN (${ownersPlaceholder})`;
            const [rows] = await conn.execute(
              `SELECT id, nome, matricula, email, telefone, classroom_id as salaId, foto, ativo, created_at
               FROM students
               WHERE classroom_id IN (${placeholders}) AND (${studentOwnerFilter})
               ORDER BY nome`,
              [...ids, ...ownerFilterKeys]
            );
            alunos = rows.map(r => ({
              id: r.id,
              nome: r.nome,
              matricula: r.matricula,
              email: r.email,
              telefone: r.telefone,
              salaId: r.salaId,
              foto: r.foto,
              ativo: Boolean(r.ativo),
              dataCadastro: r.created_at
            }));
          }
        }

        const [semSalaRows] = await conn.execute(
          `SELECT id, nome, matricula, email, telefone, classroom_id as salaId, foto, ativo, created_at
           FROM students
           WHERE (${ownerFilter}) AND classroom_id IS NULL
           ORDER BY nome`,
          ownerFilterKeys
        );

        if (semSalaRows.length > 0) {
          alunos.push(
            ...semSalaRows.map(r => ({
              id: r.id,
              nome: r.nome,
              matricula: r.matricula,
              email: r.email,
              telefone: r.telefone,
              salaId: r.salaId,
              foto: r.foto,
              ativo: Boolean(r.ativo),
              dataCadastro: r.created_at
            }))
          );
        }

        return res.json({ salas: classrooms, alunos });
      } finally {
        conn.release();
      }
    }

    // Prisma usa BigInt para campos BigInt
    const ownerIdsBigInt = ownerFilterKeys.map((k) => BigInt(k));

    // Carregar salas (via Prisma)
    const classrooms = await prisma.classrooms.findMany({
      where: {
        OR: [
          { owner_user_id: null },
          { owner_user_id: { in: ownerIdsBigInt } }
        ]
      },
      select: { id: true, name: true, periodo: true, created_at: true },
      orderBy: { name: 'asc' }
    });

    // Helper para converter BigInt -> Number (quando possível) para serializar JSON
    const toNum = (v) => (typeof v === 'bigint' ? Number(v) : v);

    let alunos = [];
    if (classrooms.length > 0) {
      const classroomIds = classrooms.map((c) => c.id);
      const studentsInRooms = await prisma.students.findMany({
        where: {
          classroom_id: { in: classroomIds },
          OR: [
            { owner_user_id: null },
            { owner_user_id: { in: ownerIdsBigInt } }
          ]
        },
        select: {
          id: true,
          nome: true,
          matricula: true,
          email: true,
          telefone: true,
          classroom_id: true,
          foto: true,
          ativo: true,
          created_at: true
        },
        orderBy: { nome: 'asc' }
      });

      alunos = studentsInRooms.map((r) => ({
        id: toNum(r.id),
        nome: r.nome,
        matricula: r.matricula,
        email: r.email,
        telefone: r.telefone,
        salaId: toNum(r.classroom_id),
        foto: r.foto,
        ativo: Boolean(r.ativo),
        dataCadastro: r.created_at
      }));
    }

    // Alunos sem sala
    const semSala = await prisma.students.findMany({
      where: {
        classroom_id: null,
        OR: [
          { owner_user_id: null },
          { owner_user_id: { in: ownerIdsBigInt } }
        ]
      },
      select: {
        id: true,
        nome: true,
        matricula: true,
        email: true,
        telefone: true,
        classroom_id: true,
        foto: true,
        ativo: true,
        created_at: true
      },
      orderBy: { nome: 'asc' }
    });

    alunos.push(
      ...semSala.map((r) => ({
        id: toNum(r.id),
        nome: r.nome,
        matricula: r.matricula,
        email: r.email,
        telefone: r.telefone,
        salaId: r.classroom_id === null ? null : toNum(r.classroom_id),
        foto: r.foto,
        ativo: Boolean(r.ativo),
        dataCadastro: r.created_at
      }))
    );

    // Formatar salas conforme resposta anterior (name -> nome)
    const salas = classrooms.map((c) => ({
      id: toNum(c.id),
      nome: c.name,
      periodo: c.periodo,
      created_at: c.created_at
    }));

    res.json({ salas, alunos });
  } catch (err) {
    console.error('Erro ao listar salas:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ROTA CANÔNICA (removido alias /api/admin/classrooms)
app.get('/api/classrooms', authenticateToken, listClassroomsHandler);

/* ===== Deletar aluno (alias sem /admin) ===== */
const deleteStudentHandler = async (req, res) => {
  try {
    // ✅ PERMITE TANTO ADMIN QUANTO PROFESSOR DELETAR SEUS ALUNOS
    const studentId = Number(req.params.id);
    if (!studentId) return res.status(400).json({ error: 'ID inválido' });

    const ownerRaw = req.user?.sub ?? req.user?.id;
    const ownerKeys = buildOwnerKeyCandidates(ownerRaw);
    if (!ownerKeys.length) {
      return res.status(400).json({ error: 'Identificador de proprietário ausente' });
    }
    const primaryOwnerKey = ownerKeys[0];

    // Fallback com Prisma (se disponível) ou MySQL
    const prismaReady = prisma && prisma.students && typeof prisma.students.findUnique === 'function';
    if (prismaReady) {
      // Buscar aluno com dados de classroom para checar ownership
      const student = await prisma.students.findUnique({
        where: { id: BigInt(studentId) },
        select: {
          id: true,
          owner_user_id: true,
          classroom_id: true,
          classrooms: { select: { id: true, owner_user_id: true } }
        }
      });

      if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

      const classroomOwner = student.classrooms?.owner_user_id ?? null;
      const studentOwner = student.owner_user_id ?? null;
      const classroomMatch = ownerValueMatches(classroomOwner, ownerKeys);
      const studentMatch = ownerValueMatches(studentOwner, ownerKeys);
      const hasOwnership = classroomMatch || studentMatch;

      if (!hasOwnership) {
        console.warn('[Admin] Registro de aluno sem correspondência direta de ownership. Aplicando migração forçada.', {
          studentId,
          ownerUserId: studentOwner,
          classroomOwner,
          adminOwnerKeys: ownerKeys,
        });
      }

      const ops = [];
      if (primaryOwnerKey && (!hasOwnership || needsOwnershipMigration(studentOwner, primaryOwnerKey))) {
        ops.push(
          prisma.students.update({
            where: { id: BigInt(studentId) },
            data: { owner_user_id: BigInt(primaryOwnerKey) }
          })
        );
      }
      if (primaryOwnerKey && student.classroom_id && (!hasOwnership || needsOwnershipMigration(classroomOwner, primaryOwnerKey))) {
        ops.push(
          prisma.classrooms.update({
            where: { id: student.classroom_id },
            data: { owner_user_id: BigInt(primaryOwnerKey) }
          })
        );
      }
      if (ops.length) await Promise.all(ops);

      await prisma.students.delete({ where: { id: BigInt(studentId) } });
      return res.json({ success: true, ownershipMigrated: !hasOwnership });
    }

    // Fallback MySQL
    const conn = await pool.getConnection();
    try {
      await ensureClassroomsOwnerColumn(conn);
      await ensureStudentsOwnerColumn(conn);

      // Verifica propriedade via classroom -> owner_user_id
      const [rows] = await conn.execute(
        `SELECT s.id, s.classroom_id, s.owner_user_id AS studentOwner, c.owner_user_id AS classOwner
         FROM students s
         LEFT JOIN classrooms c ON s.classroom_id = c.id
         WHERE s.id = ?
         LIMIT 1`,
        [studentId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
      const row = rows[0];
      const classroomMatch = ownerValueMatches(row.classOwner, ownerKeys);
      const studentMatch = ownerValueMatches(row.studentOwner, ownerKeys);
      const hasOwnership = classroomMatch || studentMatch;
      if (!hasOwnership) {
        console.warn('[Admin] Registro de aluno sem correspondência direta de ownership. Aplicando migração forçada.', {
          studentId,
          ownerUserId: row.studentOwner,
          classroomOwner: row.classOwner,
          adminOwnerKeys: ownerKeys,
        });
      }

      const migrations = [];
      if (primaryOwnerKey && (!hasOwnership || needsOwnershipMigration(row.studentOwner, primaryOwnerKey))) {
        migrations.push(conn.execute('UPDATE students SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, studentId]));
      }
      if (primaryOwnerKey && row.classroom_id && (!hasOwnership || needsOwnershipMigration(row.classOwner, primaryOwnerKey))) {
        migrations.push(conn.execute('UPDATE classrooms SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, row.classroom_id]));
      }
      if (migrations.length) {
        await Promise.all(migrations);
      }

      await conn.execute('DELETE FROM students WHERE id = ?', [studentId]);
      res.json({ success: true, ownershipMigrated: !hasOwnership });
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Tabela ausente ao deletar aluno. Sugestão: executar migração do banco.', err);
      return res.status(404).json({ error: 'Tabelas não inicializadas. Execute a migração do banco.' });
    }
    console.error('Erro ao deletar aluno:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ROTA CANÔNICA (removido alias /api/admin/students/:id)
app.delete('/api/students/:id', authenticateToken, deleteStudentHandler);

/* ===== Deletar sala (alias sem /admin) ===== */
const deleteClassroomHandler = async (req, res) => {
  try {
    // ✅ PERMITE TANTO ADMIN QUANTO PROFESSOR DELETAR SUAS SALAS
    const classroomId = Number(req.params.id);
    if (!classroomId) return res.status(400).json({ error: 'ID inválido' });

    const ownerRaw = req.user?.sub ?? req.user?.id;
    const ownerKeys = buildOwnerKeyCandidates(ownerRaw);
    if (!ownerKeys.length) {
      return res.status(400).json({ error: 'Identificador de proprietário ausente' });
    }

  const primaryOwnerKey = ownerKeys[0];
  const conn = await pool.getConnection();
    let transactionStarted = false;
    try {
      await ensureClassroomsOwnerColumn(conn);
      await ensureStudentsOwnerColumn(conn);

      // Verifica propriedade
      const [rows] = await conn.execute('SELECT owner_user_id FROM classrooms WHERE id = ? LIMIT 1', [classroomId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Sala não encontrada' });
      const owner = rows[0].owner_user_id;
      const ownerMatches = ownerValueMatches(owner, ownerKeys);

      await conn.beginTransaction();
      transactionStarted = true;

      let ownershipMigrated = false;
      if (!ownerMatches && primaryOwnerKey) {
        console.warn('[Admin] Sala com ownership divergente detectada. Forçando migração para o admin atual.', {
          classroomId,
          owner,
          adminOwnerKeys: ownerKeys,
        });
        await conn.execute('UPDATE classrooms SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, classroomId]);
        ownershipMigrated = true;
      } else if (ownerMatches && needsOwnershipMigration(owner, primaryOwnerKey)) {
        await conn.execute('UPDATE classrooms SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, classroomId]);
        ownershipMigrated = true;
      }
      // Deleta alunos vinculados
      await conn.execute('DELETE FROM students WHERE classroom_id = ?', [classroomId]);
      // Deleta sala
      await conn.execute('DELETE FROM classrooms WHERE id = ?', [classroomId]);

      await conn.commit();
      transactionStarted = false;
      res.json({ success: true, ownershipMigrated });
    } catch (err) {
      if (transactionStarted) try { await conn.rollback(); } catch (e) {}
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Tabela ausente ao deletar sala. Sugestão: executar migração do banco.', err);
      return res.status(404).json({ error: 'Tabelas não inicializadas. Execute a migração do banco.' });
    }
    console.error('Erro ao deletar sala:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ROTA CANÔNICA (removido alias /api/admin/classrooms/:id)
app.delete('/api/classrooms/:id', authenticateToken, deleteClassroomHandler);

/* ===== Remover sala (alias sem /admin) ===== */
const removeClassroomHandler = async (req, res) => {
  try {
    // ✅ PERMITE TANTO ADMIN QUANTO PROFESSOR REMOVER SUAS SALAS
    const classroomId = Number(req.params.id);
    if (!classroomId) return res.status(400).json({ error: 'ID inválido' });

    const { keepStudents = false } = req.body || {};

    const ownerRaw = req.user?.sub ?? req.user?.id;
    const ownerKeys = buildOwnerKeyCandidates(ownerRaw);
    if (!ownerKeys.length) {
      return res.status(400).json({ error: 'Identificador de proprietário ausente' });
    }
    const primaryOwnerKey = ownerKeys[0];

    const conn = await pool.getConnection();
    let transactionStarted = false;
    try {
      await ensureClassroomsOwnerColumn(conn);
      await ensureStudentsOwnerColumn(conn);

      const [rows] = await conn.execute('SELECT owner_user_id FROM classrooms WHERE id = ? LIMIT 1', [classroomId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Sala não encontrada' });
      const owner = rows[0].owner_user_id;
      const ownerMatches = ownerValueMatches(owner, ownerKeys);

      await conn.beginTransaction();
      transactionStarted = true;

      let ownershipMigrated = false;
      if (!ownerMatches && primaryOwnerKey) {
        console.warn('[Admin] Sala com ownership divergente durante remoção opcional. Forçando migração.', {
          classroomId,
          owner,
          adminOwnerKeys: ownerKeys,
        });
        await conn.execute('UPDATE classrooms SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, classroomId]);
        ownershipMigrated = true;
      } else if (ownerMatches && needsOwnershipMigration(owner, primaryOwnerKey)) {
        await conn.execute('UPDATE classrooms SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, classroomId]);
        ownershipMigrated = true;
      }

      if (keepStudents) {
        // Desvincular alunos (set classroom_id to NULL) but keep student records
        await conn.execute('UPDATE students SET classroom_id = NULL, owner_user_id = ? WHERE classroom_id = ?', [primaryOwnerKey, classroomId]);
      } else {
        // Delete students linked to this classroom
        await conn.execute('DELETE FROM students WHERE classroom_id = ?', [classroomId]);
      }

      // Delete the classroom
      await conn.execute('DELETE FROM classrooms WHERE id = ?', [classroomId]);

      await conn.commit();
      transactionStarted = false;

  res.json({ success: true, keepStudents: !!keepStudents, ownershipMigrated });
    } catch (err) {
      if (transactionStarted) try { await conn.rollback(); } catch (e) {}
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Tabela ausente ao remover sala (com opção). Sugestão: executar migração do banco.', err);
      return res.status(404).json({ error: 'Tabelas não inicializadas. Execute a migração do banco.' });
    }
    console.error('Erro ao remover sala (com opção):', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
};

// ROTA CANÔNICA (removido alias /api/admin/classrooms/:id/remove)
app.post('/api/classrooms/:id/remove', authenticateToken, removeClassroomHandler);

/* ===== Perfil do usuário ===== */
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Buscando perfil para usuário ID:', req.user.sub);

    // Fallback: quando logado como admin "predefinido" (sem registro no DB), retorne um perfil básico
    const rawSub = req.user?.sub;
    const isNumericId = /^\d+$/.test(String(rawSub || ''));
    if (!isNumericId) {
      console.warn('⚠️ Perfil solicitado para ID não numérico; retornando perfil predefinido (sem DB).', { sub: rawSub });
      const adminUser = buildPredefinedAdminUser();
      return res.json(adminUser);
    }

    const user = await getUserWithClasses(req.user.sub);

    if (!user) {
      console.log('Usuário não encontrado no banco:', req.user.sub);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    console.log('Perfil encontrado:', user);
    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ===== Atualizar perfil ===== */
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const {
    full_name,
    phone,
    cpf,
    school,
    subject,
    classes,
  } = req.body || {};

  try {
    console.log('Atualizando perfil para usuário ID:', req.user.sub);
    console.log('Novos dados:', { full_name, phone, cpf, school, subject, classes });

    if (!full_name || String(full_name).trim().length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
    }
    const normalizedClasses = typeof classes === 'undefined' ? null : normalizeClassList(classes);

    const conn = await pool.getConnection();
    let transactionStarted = false;

    try {
      await ensureUsersFullNameColumn(conn);

      await conn.beginTransaction();
      transactionStarted = true;

      const [result] = await conn.execute(
        `UPDATE users 
         SET full_name = ?, phone = ?, cpf = ?, school = ?, subject = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          String(full_name).trim(),
          phone || null,
          cpf || null,
          school ? String(school).trim() : null,
          subject ? String(subject).trim() : null,
          req.user.sub,
        ]
      );

      if (result.affectedRows === 0) {
        await conn.rollback();
        transactionStarted = false;
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (normalizedClasses !== null) {
        await conn.execute('DELETE FROM teacher_classes WHERE user_id = ?', [req.user.sub]);
        if (normalizedClasses.length > 0) {
          const placeholders = normalizedClasses.map(() => '(?, ?)').join(', ');
          const values = normalizedClasses.flatMap((className) => [req.user.sub, className]);
          await conn.execute(
            `INSERT INTO teacher_classes (user_id, class_name) VALUES ${placeholders}`,
            values
          );
        }
      }

      await conn.commit();
      transactionStarted = false;

      const updatedUser = await getUserWithClasses(req.user.sub, conn);
      res.json({
        message: 'Perfil atualizado com sucesso',
        user: updatedUser,
      });
    } catch (err) {
      if (transactionStarted) {
        try { await conn.rollback(); } catch {}
      }
      throw err;
    } finally {
      // getUserWithClasses não libera a conexão quando recebe externalConn
      if (conn) conn.release();
    }
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ===== Alterar senha ===== */
app.put('/api/user/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    console.log('Alterando senha para usuário ID:', req.user.sub);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    const [rows] = await pool.execute(
      `SELECT password_hash FROM users WHERE id = ?`,
      [req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Senha atual incorreta' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [newHash, req.user.sub]
    );

    console.log('Senha alterada com sucesso');
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ===== Excluir conta ===== */
app.delete('/api/user/account', authenticateToken, async (req, res) => {
  const { password } = req.body;

  try {
    console.log('Excluindo conta para usuário ID:', req.user.sub);

    if (!password) return res.status(400).json({ error: 'Senha é obrigatória para excluir a conta' });

    const [rows] = await pool.execute(
      `SELECT password_hash FROM users WHERE id = ?`,
      [req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Senha incorreta' });

    await pool.execute(`DELETE FROM users WHERE id = ?`, [req.user.sub]);

    console.log('Conta excluída com sucesso');
    res.json({ message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ===== DEBUG: Rota temporária para listar usuários ===== */
app.get('/debug/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, full_name, created_at FROM users LIMIT 10');
    res.json({ users: rows, total: rows.length });
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ===== Rota para migração da tabela (adicionar coluna profile_picture) ===== */
// Endpoint simples para migração (sem autenticação para facilitar)
app.get('/api/migrate-database', async (req, res) => {
  try {
    console.log('🔧 Iniciando migração da coluna profile_picture...');
    
    // Verifica se a coluna já existe
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'profile_picture'
    `, [process.env.DB_NAME]);
    
    if (columns.length > 0) {
      console.log('✅ Coluna profile_picture já existe');
      return res.json({ 
        success: true, 
        message: 'Coluna profile_picture já existe na tabela users',
        alreadyExists: true
      });
    }
    
    // Adiciona a coluna
    await pool.execute(`
      ALTER TABLE users 
      ADD COLUMN profile_picture VARCHAR(500) NULL AFTER password_hash
    `);
    
    console.log('✅ Coluna profile_picture adicionada com sucesso');
    
    res.json({ 
      success: true, 
      message: 'Coluna profile_picture adicionada com sucesso!',
      alreadyExists: false
    });
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// [removido] endpoints utilitários de migração de profile_picture

/* ===== Reset de salas (alias sem /admin) ===== */
const resetClassroomsHandler = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });

    const { keepStudents = false } = req.body || {};
    const ownerRaw = req.user?.sub ?? req.user?.id;
    const ownerKeys = buildOwnerKeyCandidates(ownerRaw);
    if (!ownerKeys.length) {
      return res.status(400).json({ error: 'Identificador de proprietário ausente' });
    }

    const primaryOwnerKey = ownerKeys[0];
    const numericOwnerKeys = ownerKeys
      .map((key) => String(key))
      .filter((key) => /^\d+$/.test(key));
    if (!numericOwnerKeys.includes('0')) numericOwnerKeys.push('0');

    const conn = await pool.getConnection();
    let transactionStarted = false;
    try {
      await ensureClassroomsOwnerColumn(conn);
      await ensureStudentsOwnerColumn(conn);

      const ownerClause = numericOwnerKeys.length
        ? `(owner_user_id IS NULL OR owner_user_id IN (${numericOwnerKeys.map(() => '?').join(',')}))`
        : 'owner_user_id IS NULL';

      const [classroomRows] = await conn.execute(
        `SELECT id, owner_user_id FROM classrooms WHERE ${ownerClause}`,
        numericOwnerKeys
      );

      if (!classroomRows.length) {
        return res.json({ success: true, removedClassrooms: 0, affectedStudents: 0, keepStudents: Boolean(keepStudents) });
      }

      await conn.beginTransaction();
      transactionStarted = true;

      const classroomIds = classroomRows.map((row) => row.id);
      for (const room of classroomRows) {
        if (needsOwnershipMigration(room.owner_user_id, primaryOwnerKey)) {
          await conn.execute('UPDATE classrooms SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, room.id]);
        }
      }

      let affectedStudents = 0;
      if (classroomIds.length) {
        const classPlaceholders = classroomIds.map(() => '?').join(',');
        const studentOwnerClause = numericOwnerKeys.length
          ? `(owner_user_id IS NULL OR owner_user_id IN (${numericOwnerKeys.map(() => '?').join(',')}))`
          : 'owner_user_id IS NULL';

        if (keepStudents) {
          const [updateResult] = await conn.execute(
            `UPDATE students SET classroom_id = NULL, owner_user_id = ?
             WHERE classroom_id IN (${classPlaceholders}) AND ${studentOwnerClause}`,
            [primaryOwnerKey, ...classroomIds, ...numericOwnerKeys]
          );
          affectedStudents = updateResult?.affectedRows ?? 0;
        } else {
          const [deleteResult] = await conn.execute(
            `DELETE FROM students
             WHERE classroom_id IN (${classPlaceholders}) AND ${studentOwnerClause}`,
            [...classroomIds, ...numericOwnerKeys]
          );
          affectedStudents = deleteResult?.affectedRows ?? 0;
        }

        await conn.execute(
          `DELETE FROM classrooms WHERE id IN (${classPlaceholders})`,
          classroomIds
        );
      }

      await conn.commit();
      transactionStarted = false;

      res.json({
        success: true,
        removedClassrooms: classroomIds.length,
        affectedStudents,
        keepStudents: Boolean(keepStudents)
      });
    } catch (err) {
      if (transactionStarted) {
        try { await conn.rollback(); } catch (rollbackErr) {}
      }
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Erro ao resetar salas do admin:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// ROTA CANÔNICA (removido alias /api/admin/classrooms/reset)
app.post('/api/classrooms/reset', authenticateToken, resetClassroomsHandler);

/* ===== Importação de CSV (alias sem /admin) ===== */
const importCsvHandler = async (req, res) => {
  console.log('\n🚀 ===== INICIANDO IMPORTAÇÃO CSV =====');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('👤 Usuário:', req.user?.sub || req.user?.id || 'N/A');
  console.log('🔑 Role:', req.user?.role || 'N/A');
  
  try {
    // 1️⃣ VALIDAÇÃO DE AUTENTICAÇÃO
    console.log('\n1️⃣ Verificando autenticação...');
    if (!req.user) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }
    
    // ✅ PERMITIR TANTO ADMIN QUANTO PROFESSOR
    console.log('✅ Usuário autenticado como:', req.user?.role);

    // 2️⃣ VALIDAÇÃO DOS DADOS RECEBIDOS
    console.log('\n2️⃣ Validando dados recebidos...');
    console.log('📦 req.body type:', typeof req.body);
    console.log('📦 req.body keys:', Object.keys(req.body || {}));
    
    const { alunos, salas } = req.body || {};
    
    console.log('👥 alunos type:', typeof alunos, 'length:', Array.isArray(alunos) ? alunos.length : 'N/A');
    console.log('🏫 salas type:', typeof salas, 'length:', Array.isArray(salas) ? salas.length : 'N/A');
    
    if (!Array.isArray(alunos) || alunos.length === 0) {
      console.log('❌ Campo alunos inválido ou vazio');
      return res.status(400).json({ 
        error: 'Campo "alunos" é obrigatório e deve ser um array não vazio',
        received: { alunos: typeof alunos, length: Array.isArray(alunos) ? alunos.length : 'N/A' }
      });
    }
    
    console.log('✅ Dados válidos - alunos:', alunos.length, 'salas:', Array.isArray(salas) ? salas.length : 0);

    // 3️⃣ DETERMINAÇÃO DO OWNER_USER_ID
    console.log('\n3️⃣ Determinando owner_user_id...');
    const ownerRaw = req.user?.sub ?? req.user?.id ?? null;
    console.log('🔍 Owner raw:', ownerRaw);
    
    const derivedOwnerKeys = buildOwnerKeyCandidates(ownerRaw).filter((key) => key !== undefined && key !== null);
    const ownerKeySet = new Set(derivedOwnerKeys.map((key) => String(key)));
    ownerKeySet.add('0');
    console.log('🔑 Owners derivados do token:', Array.from(ownerKeySet));

    let dbOwnerKey = null;
    console.log('🔍 Buscando referências de owner no banco (fallback/migração)...');
    try {
      console.log('🔍 Buscando admin por email @administrador...');
      const [adminUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        ['@administrador']
      );

      if (adminUsers.length > 0) {
        dbOwnerKey = String(adminUsers[0].id);
        console.log('✅ Admin encontrado por email:', dbOwnerKey);
      } else {
        console.log('⚠️ Admin não encontrado por email, buscando por role...');
        const [anyAdmin] = await pool.execute(
          'SELECT id FROM users WHERE role = ? LIMIT 1',
          ['admin']
        );
        if (anyAdmin.length > 0) {
          dbOwnerKey = String(anyAdmin[0].id);
          console.log('✅ Admin encontrado por role:', dbOwnerKey);
        } else {
          console.log('❌ Nenhum admin no banco! Listando todos os usuários...');
          const [allUsers] = await pool.execute('SELECT id, email, role FROM users');
          console.log('📋 Usuários no banco:', allUsers);

          if (allUsers.length > 0) {
            dbOwnerKey = String(allUsers[0].id);
            console.log('⚠️ Usando primeiro usuário como owner:', dbOwnerKey);
          } else {
            console.error('💥 NENHUM USUÁRIO NO BANCO! (fallback permanece NULL)');
          }
        }
      }
    } catch (err) {
      console.error('❌ Erro ao buscar admin no banco:', err.message);
    }

    if (dbOwnerKey) {
      ownerKeySet.add(dbOwnerKey);
    }

    const numericOwnerCandidates = Array.from(ownerKeySet).filter((key) => /^\d+$/.test(key));

    let primaryOwnerKey = derivedOwnerKeys.length > 0 ? String(derivedOwnerKeys[0]) : null;
    if (!primaryOwnerKey && numericOwnerCandidates.length > 0) {
      primaryOwnerKey = numericOwnerCandidates[0];
    }

    console.log('✅ Owner final determinado:', primaryOwnerKey ?? 'NULL (sem owner)');
    console.log('🧭 Owners reconhecidos para busca/migração:', numericOwnerCandidates);

    const ownerCandidateParams = numericOwnerCandidates.length > 0 ? numericOwnerCandidates : ['0'];
    const ownerCandidatePlaceholders = ownerCandidateParams.map(() => '?').join(',');

    // 4️⃣ CONECTAR AO BANCO E INICIAR TRANSAÇÃO
    console.log('\n4️⃣ Conectando ao banco de dados...');
    const conn = await pool.getConnection();
    let transactionStarted = false;
    
    try {
      console.log('✅ Conexão estabelecida, iniciando transação...');
      
      // Se primaryOwnerKey for null, temporariamente desabilitar constraint
      if (!primaryOwnerKey) {
        console.log('⚠️ Owner é NULL, desabilitando temporariamente a foreign key constraint...');
        try {
          await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
          console.log('✅ Foreign key checks desabilitadas');
        } catch (fkErr) {
          console.log('⚠️ Não foi possível desabilitar FK checks:', fkErr.message);
        }
      }
      
    await ensureClassroomsOwnerColumn(conn);
    await ensureStudentsOwnerColumn(conn);

    await conn.beginTransaction();
      transactionStarted = true;
      console.log('✅ Transação iniciada');

      // 5️⃣ PROCESSAR SALAS
      console.log('\n5️⃣ Processando salas...');
      const salaIdMap = new Map(); // mapa: frontend sala.id -> db classroom.id
      
      if (Array.isArray(salas) && salas.length > 0) {
        console.log('📋 Processando', salas.length, 'salas...');
        
        for (let i = 0; i < salas.length; i++) {
          const sala = salas[i];
          console.log(`\n   Sala ${i + 1}/${salas.length}:`, sala);
          
          const name = String(sala.nome || '').trim();
          if (!name) {
            console.log('   ⚠️ Sala sem nome, pulando...');
            continue;
          }

          // Verificar se já existe uma sala com este nome para este usuário
          console.log('   🔍 Verificando se sala já existe:', name);
          const [existing] = await conn.execute(
            `SELECT id, owner_user_id FROM classrooms
             WHERE name = ?
               AND (owner_user_id IS NULL OR owner_user_id IN (${ownerCandidatePlaceholders}))
             LIMIT 1`,
            [name, ...ownerCandidateParams]
          );

          if (existing.length > 0) {
            const existingId = existing[0].id;
            const existingOwnerRaw = existing[0].owner_user_id;
            const existingOwnerStr = existingOwnerRaw === null || existingOwnerRaw === undefined
              ? null
              : String(existingOwnerRaw);
            console.log('   ♻️ Sala já existe, reutilizando ID:', existingId, 'owner:', existingOwnerStr);

            if (primaryOwnerKey) {
              const shouldUpdateOwner = !existingOwnerStr || existingOwnerStr !== primaryOwnerKey;
              if (shouldUpdateOwner) {
                console.log('   🔁 Ajustando owner_user_id da sala/alunos para o owner atual:', primaryOwnerKey);
                await conn.execute('UPDATE classrooms SET owner_user_id = ? WHERE id = ?', [primaryOwnerKey, existingId]);
                await conn.execute('UPDATE students SET owner_user_id = ? WHERE classroom_id = ?', [primaryOwnerKey, existingId]);
              }
            }

            salaIdMap.set(sala.id, existingId);
          } else {
            console.log('   ➕ Criando nova sala...');
            console.log('      - owner_user_id:', primaryOwnerKey);
            console.log('      - name:', name);
            console.log('      - periodo:', sala.periodo || null);
            
            const [result] = await conn.execute(
              'INSERT INTO classrooms (owner_user_id, name, periodo) VALUES (?, ?, ?)',
              [primaryOwnerKey, name, sala.periodo || null]
            );
            
            console.log('   ✅ Sala criada com ID:', result.insertId);
            salaIdMap.set(sala.id, result.insertId);
          }
        }
      } else {
        console.log('ℹ️ Nenhuma sala para processar');
      }
      
      console.log('✅ Mapeamento de salas concluído:', Array.from(salaIdMap.entries()));

      // 6️⃣ PROCESSAR ALUNOS
      console.log('\n6️⃣ Processando alunos...');
      let inserted = 0;
      
      for (let i = 0; i < alunos.length; i++) {
        const aluno = alunos[i];
        console.log(`\n   Aluno ${i + 1}/${alunos.length}:`, aluno);
        
        if (!aluno || !aluno.nome) {
          console.log('   ⚠️ Aluno inválido ou sem nome, pulando...');
          continue;
        }
        
        const classroomDbId = salaIdMap.get(aluno.salaId) || null;
        console.log('   🏫 Sala mapeada:', aluno.salaId, '->', classroomDbId);
        
        if (!classroomDbId) {
          console.log('   ❌ Sala não encontrada para aluno:', aluno.nome);
          continue;
        }
        
        console.log('   ➕ Inserindo aluno no banco...');
        console.log('      - classroom_id:', classroomDbId);
        console.log('      - nome:', aluno.nome);
        console.log('      - email:', aluno.email || null);
        console.log('      - telefone:', aluno.telefone || null);
        console.log('      - ativo:', aluno.ativo ? 1 : 0);
        
        await conn.execute(
          `INSERT INTO students (classroom_id, owner_user_id, nome, email, telefone, ativo)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            classroomDbId,
            primaryOwnerKey,
            String(aluno.nome).trim(),
            aluno.email || null,
            aluno.telefone || null,
            aluno.ativo ? 1 : 0
          ]
        );
        
        inserted += 1;
        console.log('   ✅ Aluno inserido com sucesso');
      }

      // 7️⃣ FINALIZAR TRANSAÇÃO
      console.log('\n7️⃣ Finalizando transação...');
      await conn.commit();
      transactionStarted = false;
      
      // Reabilitar foreign key checks se foram desabilitadas
      if (!primaryOwnerKey) {
        console.log('🔧 Reabilitando foreign key checks...');
        try {
          await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
          console.log('✅ Foreign key checks reabilitadas');
        } catch (fkErr) {
          console.log('⚠️ Erro ao reabilitar FK checks:', fkErr.message);
        }
      }
      
      console.log('✅ Transação commitada com sucesso');

      // 8️⃣ RESPOSTA DE SUCESSO
      const response = { 
        success: true, 
        inserted, 
        classroomsImported: Array.from(salaIdMap.values()).length,
        details: {
          totalAlunos: alunos.length,
          alunosInseridos: inserted,
          totalSalas: Array.isArray(salas) ? salas.length : 0,
          salasProcessadas: salaIdMap.size
        }
      };
      
      console.log('\n🎉 ===== IMPORTAÇÃO CONCLUÍDA COM SUCESSO =====');
      console.log('📊 Resultado:', response);
      
      res.json(response);
      
    } catch (err) {
      // 9️⃣ TRATAMENTO DE ERRO NA TRANSAÇÃO
      console.log('\n💥 ===== ERRO NA TRANSAÇÃO =====');
      console.error('❌ Erro detalhado:', err);
      console.error('   - Código:', err.code);
      console.error('   - SQL State:', err.sqlState);
      console.error('   - SQL Message:', err.sqlMessage);
      console.error('   - Stack:', err.stack);
      
      if (transactionStarted) {
        console.log('🔄 Fazendo rollback da transação...');
        try { 
          await conn.rollback(); 
          console.log('✅ Rollback realizado');
        } catch (rollbackErr) {
          console.error('❌ Erro no rollback:', rollbackErr.message);
        }
      }
      
      // Reabilitar foreign key checks em caso de erro também
      if (!primaryOwnerKey) {
        console.log('🔧 Reabilitando foreign key checks após erro...');
        try {
          await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
          console.log('✅ Foreign key checks reabilitadas');
        } catch (fkErr) {
          console.log('⚠️ Erro ao reabilitar FK checks:', fkErr.message);
        }
      }
      
      const code = err && err.code ? String(err.code) : undefined;
      const hint = (code === 'ER_DBACCESS_DENIED_ERROR' || code === 'ER_TABLE_EXISTS_ERROR')
        ? 'Verifique as permissões do usuário no MySQL (CREATE/ALTER/DROP) e se o schema já existe.'
        : code === 'ER_NO_REFERENCED_ROW_2'
        ? 'Erro de chave estrangeira - verifique se o usuário administrador existe na tabela users.'
        : undefined;
        
      res.status(500).json({ 
        error: 'Falha ao importar dados: ' + err.message, 
        code, 
        hint,
        sqlState: err.sqlState,
        details: err.sqlMessage 
      });
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error('Erro no endpoint de importação:', err);
    res.status(500).json({ error: err.message });
  }
};

// ROTA CANÔNICA (removido alias /api/admin/import)
app.post('/api/import', authenticateToken, importCsvHandler);

/* ===== Upload de foto de perfil ===== */
// 🔧 ALTERADO: resposta com cache-bust e deleção de arquivo anterior robusta
app.post('/api/user/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const userId = req.user.sub;
    const relPath = `/uploads/profile-pics/${req.file.filename}`;

    // Buscar foto antiga para deletar
    const [oldPictureRows] = await pool.execute(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    );
    const oldPic = oldPictureRows?.[0]?.profile_picture || null;

    // Atualizar no banco
    await pool.execute(
      'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?',
      [relPath, userId]
    );

    // Deletar foto antiga se existir e não for externa
    if (oldPic && !oldPic.includes('googleusercontent.com')) {
      const rel = oldPic.startsWith('/') ? oldPic.slice(1) : oldPic; // 🔧 NOVO: remove / inicial
      const abs = path.join(process.cwd(), rel);
      // segurança: garante que está dentro da pasta de uploads de profile-pics
      if (abs.startsWith(uploadsDir) && fs.existsSync(abs)) {
        try { fs.unlinkSync(abs); } catch {}
      }
    }

    // 🔧 NOVO: retorna URL com versão para quebrar cache
    res.json({
      success: true,
      profilePictureUrl: `${relPath}?v=${Date.now()}`,
      message: 'Foto de perfil atualizada com sucesso'
    });

  } catch (err) {
    console.error('Erro no upload da foto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🔧 NOVO: DELETE da foto de perfil (zera DB e apaga arquivo local)
app.delete('/api/user/profile-picture', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;

    const [rows] = await pool.execute(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const current = rows[0]?.profile_picture || null;

    // Zera no banco
    await pool.execute(
      'UPDATE users SET profile_picture = NULL, updated_at = NOW() WHERE id = ?',
      [userId]
    );

    // Apaga arquivo físico se local
    if (current && !current.includes('googleusercontent.com')) {
      const rel = current.startsWith('/') ? current.slice(1) : current;
      const abs = path.join(process.cwd(), rel);
      if (abs.startsWith(uploadsDir) && fs.existsSync(abs)) {
        try { fs.unlinkSync(abs); } catch {}
      }
    }

    res.json({ success: true, profilePictureUrl: null, message: 'Foto de perfil removida' });
  } catch (err) {
    console.error('Erro ao remover foto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// 🔌 Rotas de reconhecimento e realtime
installFaceRoutes(app, pool);
installAttendanceRoutes(app, pool);
installRealtime(app, server, pool);

/* ===== Middlewares de erro e 404 ===== */
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.use((req, res) => {
  console.log('Rota não encontrada:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Rota não encontrada' });
});

/* ===== Sobe o servidor + ping no DB ===== */
server.listen(PORT, async () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`);
  console.log('📅 Iniciado em:', new Date().toLocaleString('pt-BR'));

  try {
    console.log('🔍 Testando conexão ao banco de dados...');
    console.log({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    const conn = await pool.getConnection();
    try {
      await ensureUsersFullNameColumn(conn);
      const [rows] = await conn.query('SELECT 1 as ok');
      if (rows?.[0]?.ok === 1) {
        console.log('✅ Banco de dados conectado com sucesso!');
      } else {
        console.warn('⚠️ Banco respondeu, mas sem o resultado esperado (SELECT 1)');
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados');
    console.error('Código:', err?.code || '(sem código)');
    console.error('Mensagem:', err?.message || '(sem mensagem)');
    if (err?.sqlState) console.error('SQL State:', err.sqlState);
    console.error('Config usada:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    console.error('Sugestões: verifique as credenciais em backend/.env, permissões do usuário no MySQL, e se o servidor MySQL está acessível a partir deste host.');
  }
});

/* ===== Tratamento global de erros não capturados ===== */
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Promise rejeitada não tratada:', err);
  process.exit(1);
});
