import express from 'express';
import authRoutes from './routes/auth.js';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './src/prisma.js';

dotenv.config();

const app = express();

/* ===== CORS robusto ===== */
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
const regexOrigins = [
  /https?:\/\/([a-z0-9-]+)\.vercel\.app$/i,
  /https?:\/\/([a-z0-9-]+)\.alwaysdata\.net$/i,
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
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
	console.log(`📍 CORS habilitado para: localhost, *.vercel.app, *.alwaysdata.net`);
});

process.on('SIGINT', async () => {
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await prisma.$disconnect();
	process.exit(0);
});
