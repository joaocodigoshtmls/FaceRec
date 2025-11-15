# ✅ CORS Middleware - Checklist Completo

**Se está recebendo 500 sem headers CORS, use este middleware**

---

## 🎯 PADRÃO: Middleware Global CORS

Adicione **antes** de seus handlers:

```javascript
// api/cors-middleware.js
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  const allowlist = [
    'https://seu-app.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  // Whitelist check
  if (allowlist.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Headers padrão
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Vary', 'Origin');  // ← Cache-friendly
  res.setHeader('Access-Control-Max-Age', '86400');

  return res;
}

export function handleOptions(req, res) {
  applyCorsHeaders(req, res);
  return res.status(204).end();
}
```

---

## 🔧 IMPLEMENTAÇÃO: Em cada handler

```javascript
// api/auth/register.js
import { applyCorsHeaders, handleOptions } from '../cors-middleware.js';

export async function OPTIONS(req, res) {
  return handleOptions(req, res);
}

export async function POST(req, res) {
  try {
    applyCorsHeaders(req, res);  // ← CRUCIAL em TODO response

    // ... seu código ...

    return res.status(201).json({ ok: true, ... });
  } catch (err) {
    applyCorsHeaders(req, res);  // ← CRUCIAL mesmo em erro
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Internal error' });
  }
}
```

---

## ⚠️ ERROS COMUNS

### ❌ ERRO 1: CORS só em OPTIONS
```javascript
// ❌ ERRADO: CORS apenas em preflight
export async function OPTIONS(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(204).end();
}

export async function POST(req, res) {
  // ← FALTA CORS aqui!
  return res.status(201).json({ ok: true });  // Sem headers CORS
}
```

**Resultado**: Navegador aceita OPTIONS (204), mas bloqueia POST (sem CORS header)

**Solução**:
```javascript
export async function POST(req, res) {
  applyCorsHeaders(req, res);  // ← Adicionar
  return res.status(201).json({ ok: true });
}
```

### ❌ ERRO 2: CORS sem Vary: Origin
```javascript
// ❌ ERRADO: Falta Vary
res.setHeader('Access-Control-Allow-Origin', origin);
// Falta: res.setHeader('Vary', 'Origin');
```

**Problema**: Proxies/CDN cacheia resposta baseado em origin, mas não marca como variável

**Solução**:
```javascript
res.setHeader('Vary', 'Origin');  // ← Adicionar
res.setHeader('Access-Control-Allow-Origin', origin);
```

### ❌ ERRO 3: Permitir origin malicioso
```javascript
// ❌ ERRADO: Permitir tudo
res.setHeader('Access-Control-Allow-Origin', '*');  // Aberto demais!
```

**Problema**: Qualquer site pode chamar sua API

**Solução**:
```javascript
const allowlist = ['https://seu-app.vercel.app'];
if (allowlist.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

### ❌ ERRO 4: 500 sem CORS headers
```javascript
// ❌ ERRADO: Erro sem CORS
export async function POST(req, res) {
  try {
    // ... código que falha ...
  } catch (err) {
    // Falta CORS aqui!
    return res.status(500).json({ message: 'Error' });  // Sem headers CORS
  }
}
```

**Resultado**: Frontend vê CORS error "No 'Access-Control-Allow-Origin'"

**Solução**:
```javascript
export async function POST(req, res) {
  try {
    applyCorsHeaders(req, res);  // Início
    // ... código ...
    return res.status(201).json({ ... });
  } catch (err) {
    applyCorsHeaders(req, res);  // ← ANTES de res.json()
    return res.status(500).json({ message: 'Error' });
  }
}
```

---

## 📋 CHECKLIST ANTES DE DEPLOY

- [ ] `applyCorsHeaders()` está no INÍCIO de OPTIONS handler
- [ ] `applyCorsHeaders()` está no INÍCIO de POST handler
- [ ] `applyCorsHeaders()` está no try/catch (erro 500)
- [ ] `Vary: Origin` está nos headers
- [ ] Allowlist tem seu domínio Vercel
- [ ] Allowlist NÃO tem `*` (aberto demais)
- [ ] `Access-Control-Allow-Methods` inclui POST
- [ ] Testar preflight com curl:
  ```bash
  curl -i -X OPTIONS https://seu-api.com/auth/register \
    -H "Access-Control-Request-Method: POST" \
    -H "Origin: https://seu-app.vercel.app"
  ```
  Esperado: 204 + `Access-Control-Allow-Origin`

---

## 🎯 TEMPLATE: Copy-Paste

**Arquivo: `/api/cors-middleware.js`**
```javascript
/**
 * Aplicar headers CORS em todas as respostas
 */
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  const allowlist = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [
        'https://seu-app.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
      ];

  if (allowlist.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Max-Age', '86400');

  return res;
}

/**
 * Handler preflight OPTIONS
 */
export function handleOptions(req, res) {
  applyCorsHeaders(req, res);
  return res.status(204).end();
}
```

**Arquivo: `/api/auth/register.js`** (parcial)
```javascript
import { applyCorsHeaders, handleOptions } from '../cors-middleware.js';

export async function OPTIONS(req, res) {
  return handleOptions(req, res);
}

export async function POST(req, res) {
  try {
    applyCorsHeaders(req, res);
    // ... seu código ...
    return res.status(201).json({ ok: true });
  } catch (error) {
    applyCorsHeaders(req, res);
    return res.status(500).json({ ok: false, message: 'Error' });
  }
}
```

---

## 🧪 TESTE: Validar CORS

```bash
# 1. Preflight (esperado: 204 + headers)
curl -i -X OPTIONS http://localhost:3000/api/auth/register \
  -H "Access-Control-Request-Method: POST" \
  -H "Origin: http://localhost:5173"

# 2. POST sucesso (esperado: 201 + headers)
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"name":"Teste","email":"test@ex.com","password":"Senha123!"}'

# 3. Origin não permitida (esperado: NO Access-Control-Allow-Origin header)
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://malicioso.com" \
  -d '{"name":"Teste","email":"test@ex.com","password":"Senha123!"}'
```

---

**Status**: ✅ Pronto para copiar  
**Benefício**: 500 errors desaparecem, CORS funciona em todas respostas  
**Próximo**: Integrar em seus handlers
