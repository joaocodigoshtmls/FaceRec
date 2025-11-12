import express from 'express';
import authRoutes from './routes/auth.js';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './src/prisma.js';

dotenv.config();

const app = express();

/* ===== CORS Whitelist (domínios exatos) ===== */
const allowlist = [
  'https://facerec-f9sojq30p-joaocodigoshtmls-projects.vercel.app',
  'https://facerec.alwaysdata.net',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const corsOptions = {
  origin(origin, callback) {
    // Permitir requests sem Origin (curl, server-to-server) e origins na allowlist
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

// Middleware para adicionar Vary: Origin
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

// CORS middleware
app.use(cors(corsOptions));

// Responder explicitamente ao preflight
app.options('*', cors(corsOptions));

/* ===== Body parser ===== */
app.use(express.json({ limit: '10mb' }));

/* ===== Rotas ===== */
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Backend FaceRec rodando' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`✅ Servidor rodando na porta ${PORT}`);
	console.log(`📍 CORS habilitado para: ${allowlist.join(', ')}`);
});

process.on('SIGINT', async () => {
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await prisma.$disconnect();
	process.exit(0);
});
