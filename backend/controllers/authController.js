import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import prisma from '../src/prisma.js';

const normalizeLogin = (value) => String(value || '').trim().toLowerCase();

const DEFAULT_ADMIN_LOGIN_RAW = process.env.DEFAULT_ADMIN_LOGIN || '@administrador';
const DEFAULT_ADMIN_LOGIN = normalizeLogin(DEFAULT_ADMIN_LOGIN_RAW);
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || '@administrador';
const DEFAULT_ADMIN_ID = process.env.DEFAULT_ADMIN_ID || 'predefined-admin';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Administrador do Sistema';

const normalizeRole = (role) => {
  if (!role) return 'professor';
  const r = String(role).toLowerCase();
  if (r === 'admin') return 'supervisor'; // compatibilidade com dados antigos
  return r;
};

const formatUserResponse = (user) => ({
  id: user.id?.toString() ?? '',
  email: user.email,
  full_name: user.fullName,
  role: normalizeRole(user.role) || 'professor',
  subject: user.subject,
  school: user.school,
  phone: user.phone,
  cpf: user.cpf,
  profile_picture: user.profilePicture,
  classes: user.teacherClasses?.map((klass) => klass.className) ?? [],
});

export const register = async (req, res) => {
  const { fullName, name, email, password, subject, school, phone, cpf } = req.body || {};

  const displayName = String(fullName || name || '').trim();
  const normalizedEmail = normalizeLogin(email);

  if (!displayName) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: displayName,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        subject: subject ? String(subject).trim() : null,
        school: school ? String(school).trim() : null,
        phone: phone ? String(phone).trim() : null,
        cpf: cpf ? String(cpf).trim() : null,
      },
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: formatUserResponse({ ...user, teacherClasses: [] }),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    console.error('Erro ao registrar usuário via Prisma:', error);
    res.status(500).json({ error: 'Erro no registro' });
  }
};

export const login = async (req, res) => {
  const { email, login, password } = req.body || {};
  const identifierRaw = email ?? login ?? '';
  const trimmedIdentifier = String(identifierRaw || '').trim();
  const normalizedIdentifier = normalizeLogin(trimmedIdentifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({ error: 'Informe o e-mail ou login' });
  }

  if (normalizedIdentifier === DEFAULT_ADMIN_LOGIN) {
    if (String(password || '') !== String(DEFAULT_ADMIN_PASSWORD)) {
      return res.status(400).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign({ sub: DEFAULT_ADMIN_ID, id: DEFAULT_ADMIN_ID, role: 'supervisor' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({
      token,
      user: {
        id: DEFAULT_ADMIN_ID,
        email: DEFAULT_ADMIN_LOGIN_RAW,
        full_name: DEFAULT_ADMIN_NAME,
        role: 'supervisor',
        classes: [],
      },
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedIdentifier },
      include: {
        teacherClasses: {
          orderBy: { className: 'asc' },
          select: { className: true },
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    const isMatch = await bcrypt.compare(password || '', user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Senha incorreta' });
    }

    const userId = user.id.toString();
    const tokenPayload = { sub: userId, id: userId, role: normalizeRole(user.role) || 'professor' };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Erro no login Prisma:', error);
    res.status(500).json({ error: 'Erro no login' });
  }
};

// Login/registro via Firebase OAuth (sem mocks). Recebe dados do usuário autenticado pelo Firebase.
// Espera: { firebaseUid, email, displayName, photoURL }
export const firebaseLogin = async (req, res) => {
  const { firebaseUid, email, displayName, photoURL } = req.body || {};
  const uid = String(firebaseUid || '').trim();
  const normalizedEmail = normalizeLogin(email);
  const name = String(displayName || '').trim();

  if (!uid || !normalizedEmail) {
    return res.status(400).json({ error: 'Dados incompletos para login Firebase' });
  }

  try {
    // Tenta localizar por UID ou por email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: uid },
          { email: normalizedEmail }
        ]
      },
      include: {
        teacherClasses: { select: { className: true } }
      }
    });

    if (!user) {
      const randomPass = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(randomPass, 10);
      user = await prisma.user.create({
        data: {
          fullName: name || normalizedEmail,
          email: normalizedEmail,
          passwordHash,
          role: 'professor',
          firebaseUid: uid,
          profilePicture: photoURL || null,
        },
        include: {
          teacherClasses: true,
        },
      });
    } else if (!user.firebaseUid) {
      // Atualiza UID e foto se ainda não setado
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: uid,
          profilePicture: photoURL || user.profilePicture || null,
        },
        include: { teacherClasses: { select: { className: true } } },
      });
    }

    const token = jwt.sign({ sub: user.id.toString(), id: user.id.toString(), role: 'professor' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, user: formatUserResponse(user) });
  } catch (error) {
    console.error('Erro no firebaseLogin:', error);
    return res.status(500).json({ error: 'Falha no login Firebase' });
  }
};
