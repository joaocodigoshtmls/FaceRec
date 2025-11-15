# 🔗 Integração com Express Existente (Opcional)

## ⚠️ IMPORTANTE

Este documento é **opcional**. Se você está migrando de `app.post()` em Express para handlers nomeados em Vercel, use estas instruções.

**Recomendação**: Use `/api/auth/register.js` como está (handlers separados). Ele funciona melhor em Vercel serverless.

---

## Opção A: Usar Middleware CORS + Express app.post() (Express puro)

Se você quer manter o Express `app.post()` para testes locais, use o middleware:

### Passo 1: Atualizar `/api/index.js`

**Adicionar no topo:**
```javascript
import { corsMiddleware } from './cors-middleware.js';
```

**Substituir cors setup por:**
```javascript
// Remover:
// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));

// Adicionar:
app.use(corsMiddleware);
```

**Resultado:**
```javascript
import express from 'express';
import { corsMiddleware } from './cors-middleware.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();

app.use(corsMiddleware);  // ← Middleware CORS
app.use(express.json({ limit: '10mb' }));

// ... resto do código
```

### Passo 2: Adicionar Validação ao POST Existente

**Arquivo**: `/api/index.js` linha ~106 (app.post('/api/auth/register'))

**Substituir:**
```javascript
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Banco não configurado' });
    const { fullName, name, email, password, subject, school, phone, cpf } = req.body || {};
    const displayName = normalize(fullName || name);
    const normalizedEmail = normalizeEmail(email);
    if (!displayName) return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!normalizedEmail) return res.status(400).json({ error: 'E-mail é obrigatório' });
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    // ... resto
  }
}
```

**Por:**
```javascript
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ ok: false, error: 'Banco não configurado' });
    
    // ===== Validação melhorada =====
    const validation = validateRegister(req.body);
    if (!validation.valid) {
      return res.status(422).json({ ok: false, issues: validation.errors });
    }
    
    const { name, email, password } = validation;
    const { subject, school, phone, cpf } = req.body || {};

    const conn = await pool.getConnection();
    try {
      // ===== Verificar email único =====
      const [dup] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (Array.isArray(dup) && dup.length > 0) {
        return res.status(409).json({ ok: false, message: 'Email already registered' });
      }

      // ===== Hash com bcryptjs =====
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await conn.execute(
        `INSERT INTO users (full_name, email, password_hash, role, subject, school, phone, cpf, created_at, updated_at)
         VALUES (?, ?, ?, 'professor', ?, ?, ?, ?, NOW(), NOW())`,
        [name, email, passwordHash, subject || null, school || null, phone || null, cpf || null]
      );
      
      const userId = result.insertId?.toString?.() || String(result.insertId);

      const token = jwt.sign({ sub: userId, id: userId, role: 'professor' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      return res.status(201).json({
        ok: true,
        userId,
        message: 'Usuário criado com sucesso!',
        token,
        user: {
          id: userId,
          email,
          full_name: name,
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
    const detail = {
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
      message: err?.message,
    };
    const friendly = friendlyDbError(err);
    const expose = (process.env.VERCEL_ENV === 'preview' || process.env.DEBUG_API === '1');
    return res.status(500).json(
      expose
        ? { ok: false, error: 'server-error', detail, hint: friendly }
        : { ok: false, error: friendly.message, code: friendly.code }
    );
  }
});
```

### Passo 3: Adicionar Função `validateRegister()`

**Antes de `app.post('/api/auth/register')`:**
```javascript
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
```

### Passo 4: Testar

```bash
# Preflight:
curl -i -X OPTIONS http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173"
# Esperado: 204

# POST:
curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@ex.com","password":"Pass123456"}'
# Esperado: 201
```

---

## Opção B: Usar Handlers Separados para Vercel (RECOMENDADO)

Se você quer otimizar para Vercel serverless, use handlers nomeados:

### Estrutura de Pastas
```
api/
├── index.js (Express app - para dev local)
├── auth/
│   └── register.js (Handler Vercel - export OPTIONS/POST)
├── cors-middleware.js (reutilizável)
└── [...]all].js (catch-all)
```

### `/api/auth/register.js` já vem pronto (veja acima)

### `/api/[...all].js` redireciona para Express
```javascript
// Catch-all para rotas que estão em Express
import app from './index.js';
export default app;
```

### Vercel reconhece ambas:
- `api/auth/register.js` → handlers nomeados (prioridade)
- `api/[...all].js` → Express fallback

---

## Comparação: Express vs Handlers Nomeados

| Aspecto | Express `app.post()` | Handlers Nomeados |
|--------|---------------------|-------------------|
| **Vercel otimizado** | ⚠️ Funciona mas não ideal | ✅ Ideal |
| **Preflight OPTIONS** | ⚠️ Precisa middleware CORS | ✅ Automático |
| **Cold start** | Mais lento (inicia Express) | Mais rápido |
| **Tamanho função** | +Express bundle | Só a função |
| **Local Express** | ✅ Funciona naturalmente | ⚠️ Precisa app.listen() |
| **Escalabilidade** | Simples | ✅ Pode ter múltiplas funções |

**Recomendação**: Use `/api/auth/register.js` (handlers nomeados) para produção, `app.post()` só para testes locais com `npm run dev`.

---

## Como Usar Ambas Simultaneamente

### 1. Testes Locais (Express)
```bash
cd backend
npm run dev
# Testa em http://localhost:3001/api/auth/register
```

### 2. Vercel Production (Handlers)
```bash
# Deploy automático usa /api/auth/register.js
# GET /api/auth/register → 405 (GET não permitido)
# OPTIONS /api/auth/register → 204 (preflight OK)
# POST /api/auth/register → 201 (registration OK)
```

### 3. Express Fallback (rotas outras)
```javascript
// /api/[...all].js importa app do Express
// Rotas que não têm handler separado caem em Express
```

---

## Checklist de Integração

- [ ] Copiar `/api/cors-middleware.js` para `/api/`
- [ ] Adicionar `import { corsMiddleware } from './cors-middleware.js'` em `/api/index.js`
- [ ] Substituir `app.use(cors(...))` por `app.use(corsMiddleware)`
- [ ] Adicionar função `validateRegister()` em `/api/index.js`
- [ ] Atualizar `app.post('/api/auth/register')` com validação e status codes corretos
- [ ] Testar preflight local: `curl -i -X OPTIONS ...`
- [ ] Testar POST local: `curl -i -X POST ...`
- [ ] Verificar que `/api/auth/register.js` existe e tem handlers nomeados
- [ ] Fazer commit de ambos: `app.post()` (Express) e `export function OPTIONS/POST()` (Vercel)
- [ ] Deploy e testar em Vercel

---

## Se Escolher Express Puro (não recomendado para Vercel)

**Desvantagens:**
- ⚠️ Vercel prefere handlers nomeados
- ⚠️ Cold start mais lento
- ⚠️ Tamanho de função pode aumentar

**Vantagens:**
- ✅ Simples de entender
- ✅ Tudo em um lugar (Express)
- ✅ Fácil reuse de middleware

**Se insistir:**
```bash
# Só use Express sem handlers separados
# Delete: /api/auth/register.js
# Atualize: /api/index.js com middlewares CORS

# Mas prepare-se para:
# - 405 preflight em algumas configs do Vercel
# - Cold start mais lento
# - Possíveis timeouts em funções grandes
```

---

## Recomendação Final

🎯 **Use**: `/api/auth/register.js` (handlers nomeados) + Express local para dev

```bash
# Local: npm run dev (Express em localhost:3001)
# Prod: Vercel (usa handlers nomeados)
# Fallback: Express via [...all].js para outras rotas

# Melhor dos dois mundos!
```

