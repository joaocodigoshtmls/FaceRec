// api/index.js - Exportar Express app para Vercel serverless

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../backend/routes/auth.js';
import prisma from '../backend/src/prisma.js';

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

/* ===== Rotas ===== */
app.use('/api/auth', authRoutes);

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

// Cleanup on serverless shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
