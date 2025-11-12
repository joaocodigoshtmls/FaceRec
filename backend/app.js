import express from 'express';
import authRoutes from './routes/auth.js';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './src/prisma.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});

process.on('SIGINT', async () => {
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await prisma.$disconnect();
	process.exit(0);
});
