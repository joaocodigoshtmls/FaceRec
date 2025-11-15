# 🔴 DEBUG: 500 Error em /api/auth/register

**Se você está recebendo 500 em POST `/api/auth/register`, use este guia**

---

## 🎯 PASSO 1: Identificar a Raiz (2 min)

Abra **DevTools** (F12) → Aba **Network** → Execute POST

### ✓ Request URL está CORRETO?
```
❌ Errado:  https://seu-app.vercel.app/api/auth/register  (round-trip desnecessário)
✅ Correto: https://facerec.alwaysdata.net/api/auth/register  (URL absoluta backend)
```

Se Request URL aponta para Vercel em vez de AlwaysData, **vai dar CORS error ou 500 silencioso**.

**Solução**: Usar URL absoluta no frontend.

---

## 🎯 PASSO 2: Verificar Logs do Backend (AlwaysData)

Acesse **console do AlwaysData** → Logs da função:

### Erros comuns que viram 500:

```javascript
// ❌ ERRO 1: DATABASE_URL não configurado ou inválido
"Error: ENOTFOUND mysql-facerec.alwaysdata.net"
// Solução: Verificar .env em AlwaysData → DATABASE_URL

// ❌ ERRO 2: Prisma não migrou
"PrismaClientKnownRequestError: Error in default index"
"Table 'users' doesn't exist"
// Solução: Rodar em AlwaysData: npx prisma migrate deploy

// ❌ ERRO 3: bcryptjs não disponível
"ReferenceError: crypto is not defined"
// Solução: Forçar Node.js runtime (não Edge)

// ❌ ERRO 4: req.body vem undefined
"Cannot read property 'name' of undefined"
// Solução: Verificar express.json() middleware

// ❌ ERRO 5: Variável de ambiente faltando
"process.env.DB_PASSWORD is undefined"
// Solução: Confirmar .env está no AlwaysData
```

---

## 🎯 PASSO 3: Teste de Fumaça (Curl)

Execute cada um em sequência:

### ✅ TESTE A: Preflight (espera 204)
```bash
curl -i -X OPTIONS https://facerec.alwaysdata.net/api/auth/register \
  -H "Origin: https://seu-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"

# Esperado:
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: https://seu-app.vercel.app
# Access-Control-Allow-Methods: POST, OPTIONS
```

Se retorna **405** ou não tem `Access-Control-Allow-Origin`:
- Handler OPTIONS não está exportado
- CORS middleware não está configurado

### ✅ TESTE B: POST Válido (espera 201)
```bash
curl -i -X POST https://facerec.alwaysdata.net/api/auth/register \
  -H "Origin: https://seu-app.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste123@ex.com","password":"SenhaSegura123!"}'

# Esperado:
# HTTP/1.1 201 Created
# {"ok":true,"userId":"123","user":{...}}
```

Se retorna **500**:
- Ver logs em tempo real (passo 2)
- Verificar DATABASE_URL
- Confirmar Prisma migrou

### ✅ TESTE C: Email Duplicado (espera 409)
```bash
# Executar o mesmo POST do TESTE B novamente
curl -i -X POST https://facerec.alwaysdata.net/api/auth/register \
  -H "Origin: https://seu-app.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste123@ex.com","password":"SenhaSegura123!"}'

# Esperado:
# HTTP/1.1 409 Conflict
# {"ok":false,"code":"EMAIL_CONFLICT","message":"Email already registered"}
```

Se retorna **500** em vez de 409:
- Prisma P2002 não está sendo tratada
- Ver checklist abaixo

### ✅ TESTE D: Validação Ruim (espera 422)
```bash
curl -i -X POST https://facerec.alwaysdata.net/api/auth/register \
  -H "Origin: https://seu-app.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"invalido","password":"123"}'

# Esperado:
# HTTP/1.1 422 Unprocessable Entity
# {"ok":false,"code":"VALIDATION_ERROR","issues":[...]}
```

Se retorna **500**:
- Validação está dando throw sem try/catch
- Ver checklist "Tratamento de Erro"

---

## 📋 CHECKLIST: 80% dos 500 vêm daqui

- [ ] **DATABASE_URL** está em `.env` no AlwaysData?
  ```bash
  DATABASE_URL="mysql://facerec:password@mysql-facerec.alwaysdata.net:3306/facerec_1"
  ```

- [ ] **Prisma migrou**? (rodar uma vez no AlwaysData)
  ```bash
  npx prisma migrate deploy
  # ou
  npx prisma db push
  ```

- [ ] **express.json()** está ativo no app.js?
  ```javascript
  app.use(express.json());
  ```

- [ ] **CORS middleware** está antes do handler?
  ```javascript
  app.use(cors({
    origin: ['https://seu-app.vercel.app', 'http://localhost:3000'],
    credentials: false
  }));
  ```

- [ ] **OPTIONS handler** está exportado?
  ```javascript
  export async function OPTIONS(req, res) {
    res.status(204).end();
  }
  ```

- [ ] **POST handler** está exportado?
  ```javascript
  export async function POST(req, res) {
    // ...
  }
  ```

- [ ] **P2002 (email único) é tratada**?
  ```javascript
  if (e?.code === 'P2002') {
    return res.status(409).json({ ok: false, code: 'EMAIL_EXISTS' });
  }
  ```

- [ ] **Validação com try/catch**?
  ```javascript
  const result = schema.safeParse(body);
  if (!result.success) {
    return res.status(422).json({ errors: result.error.issues });
  }
  ```

- [ ] **bcryptjs tem Node.js runtime**? (não Edge)
  ```json
  // vercel.json ou similar
  { "runtime": "nodejs20.x" }
  ```

- [ ] **CORS headers em TODAS as respostas** (inclusive 500)?
  ```javascript
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return res.status(500).json({ ... });
  ```

---

## 🔧 CONSERTO RÁPIDO: Middleware CORS Global

Se está obtendo 500 sem headers CORS, adicione middleware:

```javascript
// api/auth/register.js
function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  const allowlist = [
    'https://seu-app.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  if (allowlist.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export async function OPTIONS(req, res) {
  applyCorsHeaders(req, res);
  return res.status(204).end();
}

export async function POST(req, res) {
  applyCorsHeaders(req, res);
  
  try {
    // ... seu código ...
    return res.status(201).json({ ok: true, ... });
  } catch (err) {
    console.error('Erro:', err);
    applyCorsHeaders(req, res); // ← CRUCIAL: CORS mesmo em erro
    return res.status(500).json({ ok: false, code: 'INTERNAL', message: 'Internal server error' });
  }
}
```

**Crucial**: `applyCorsHeaders()` deve ser chamada em TODAS as respostas.

---

## 📊 TABELA DE DEBUG

| Status | Causa Comum | Solução |
|--------|------------|---------|
| **405** | OPTIONS não exportado | Adicionar `export async function OPTIONS()` |
| **500 sem CORS header** | CORS middleware faltando | Adicionar `applyCorsHeaders()` em todas respostas |
| **500 com "undefined"** | req.body é undefined | Verificar `express.json()` |
| **500 com "ENOTFOUND"** | DATABASE_URL inválida | Conferir `.env` AlwaysData |
| **500 com "Table doesn't exist"** | Prisma não migrou | Rodar `npx prisma migrate deploy` |
| **500 com "crypto undefined"** | Edge Runtime + bcrypt | Forçar Node.js 20.x |
| **409 retorna 500** | P2002 não tratada | Adicionar `if (e?.code === 'P2002')` |
| **422 retorna 500** | Validação sem try/catch | Usar `schema.safeParse()` |

---

## 🚀 PRÓXIMO PASSO

1. Rodar **TESTE A** (preflight)
   - Se falha: problemas de exportação/middleware
2. Rodar **TESTE B** (POST válido)
   - Se falha com 500: verificar logs AlwaysData
3. Rodar **TESTE C** (email duplicado)
   - Se retorna 500: adicionar tratamento P2002
4. Abrir **DevTools Network** no frontend
   - Confirmar Request URL é absoluta (AlwaysData, não Vercel)

Se os 4 testes passarem, 500 foi eliminado! ✅

---

**Status**: Guia de troubleshooting prático  
**Tempo**: 5-10 minutos para resolver
