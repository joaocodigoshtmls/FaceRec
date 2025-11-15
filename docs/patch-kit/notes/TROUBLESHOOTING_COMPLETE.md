# 🚑 TROUBLESHOOTING COMPLETO - 500 Error + React #31

**Consolidação de todos os problemas e soluções**

---

## 🎯 DIAGNÓSTICO RÁPIDO (2 min)

### Sintoma 1: "500 Internal Server Error"
```
Status: 500
Response: {"message":"Internal server error"}
```

**Checklist (marque conforme resolver)**:
- [ ] Testar preflight: `curl -X OPTIONS ...` retorna 204?
- [ ] Verificar DATABASE_URL em AlwaysData
- [ ] Rodar `npx prisma migrate deploy` no backend
- [ ] Verificar logs em tempo real (AlwaysData console)
- [ ] CORS headers em TODAS respostas? Incluindo erro?

### Sintoma 2: "405 Method Not Allowed"
```
Status: 405
Motivo: Handler não exportado
```

**Solução rápida**:
```javascript
// Verificar em api/auth/register.js
export async function OPTIONS(req, res) { ... }
export async function POST(req, res) { ... }
```

### Sintoma 3: "React Error #31: Objects are not valid as React child"
```
Console: Objects are not valid as a React child (found: object with keys 'code', 'message')
```

**Solução rápida**:
```jsx
// ❌ ERRADO
const [error, setError] = useState({});
return <p>{error}</p>;

// ✅ CORRETO
const [errorMsg, setErrorMsg] = useState('');
return <p>{errorMsg}</p>;
```

### Sintoma 4: "CORS policy: No 'Access-Control-Allow-Origin' header"
```
Console: Access to XMLHttpRequest... has been blocked by CORS policy
```

**Solução rápida**: Adicionar middleware CORS em TODAS respostas:
```javascript
applyCorsHeaders(req, res);  // Antes de res.json()
```

---

## 📊 GUIA POR PROBLEMA

### 🔴 Problema: 500 + "Cannot read property 'name' of undefined"

**Causa**: `req.body` é undefined → `express.json()` faltando

**Arquivo**: `/api/app.js` (ou `server.js`)
```javascript
// ❌ ERRADO
app.use(cors());
app.post('/auth/register', registerHandler);  // req.body vem undefined

// ✅ CORRETO
app.use(express.json());  // ← ADICIONAR ANTES
app.use(cors());
app.post('/auth/register', registerHandler);
```

### 🔴 Problema: 500 + "Table 'users' doesn't exist"

**Causa**: Prisma não migrou

**Solução**:
```bash
# No AlwaysData, SSH/Terminal:
cd seu-projeto
npx prisma migrate deploy
# OU
npx prisma db push
```

**Verificar**:
```bash
npx prisma studio  # UI para ver tabelas
```

### 🔴 Problema: 500 + "ENOTFOUND mysql-facerec.alwaysdata.net"

**Causa**: DATABASE_URL inválida ou host offline

**Verificar**:
```bash
# 1. Testar conexão DB
curl -v telnet://mysql-facerec.alwaysdata.net:3306

# 2. Verificar .env no AlwaysData
echo $DATABASE_URL

# 3. Ver logs AlwaysData em tempo real
```

### 🔴 Problema: 500 + "crypto is not defined"

**Causa**: Edge Runtime + bcryptjs (incompatível)

**Solução**: Forçar Node.js em `vercel.json`:
```json
{
  "functions": {
    "api/auth/register.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### 🔴 Problema: 409 email duplicado retorna 500

**Causa**: Prisma P2002 (unique constraint) não tratada

**Arquivo**: `/api/auth/register.js`
```javascript
try {
  await prisma.user.create({...});
} catch (e) {
  if (e?.code === 'P2002') {
    return res.status(409).json({ code: 'EMAIL_EXISTS' });  // ← ADICIONAR
  }
  throw e;  // Re-throw outros erros
}
```

### 🔴 Problema: 422 validation retorna 500

**Causa**: Validação usando throw sem catch

**Arquivo**: `/api/auth/register.js`
```javascript
// ❌ ERRADO
if (!email) throw new Error('Invalid email');

// ✅ CORRETO
if (!email) {
  return res.status(422).json({ issues: [{field: 'email', message: '...'}] });
}
```

### 🔴 Problema: Request URL vai para Vercel em vez de AlwaysData

**Causa**: Frontend usando URL relativa `/api`

**Arquivo**: `frontend/.env.local`
```bash
# Adicionar:
VITE_API_URL="https://seu-backend.alwaysdata.net"
```

**Arquivo**: `frontend/lib/api.js`
```javascript
// Usar esta função:
function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),  // ← Absoluta ou relativa
});
```

### 🔴 Problema: React não renderiza mensagem de erro

**Causa**: Renderizando objeto em vez de string

**Padrão correto**:
```jsx
// Estado
const [errorMsg, setErrorMsg] = useState('');  // ← String, não objeto

// Tratamento
catch (error) {
  setErrorMsg(error?.message || 'Erro desconhecido');  // ← Extrair string
}

// Render
{errorMsg && <p className="text-red-600">{errorMsg}</p>}  {/* ✅ String */}
```

---

## 🧪 TESTES SEQUENCIAIS

Rode cada um, se falhar, pule para seção correspondente:

### ✅ TESTE 1: Preflight (expect 204)
```bash
curl -i -X OPTIONS https://facerec.alwaysdata.net/api/auth/register \
  -H "Access-Control-Request-Method: POST" \
  -H "Origin: https://seu-app.vercel.app"
```

**Se falha**:
- Section: "405 Method Not Allowed"
- Verificar se OPTIONS está exportado

### ✅ TESTE 2: POST válido (expect 201)
```bash
curl -i -X POST https://facerec.alwaysdata.net/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://seu-app.vercel.app" \
  -d '{"name":"Teste","email":"novo@ex.com","password":"Senha123!"}'
```

**Se falha com 500**:
- Section: "🔴 Problema: 500 + ..."
- Ver logs AlwaysData

**Se falha com 422**:
- Section: "🔴 Problema: 422 validation retorna 500"
- Dados inválidos

### ✅ TESTE 3: Email duplicado (expect 409)
```bash
# Executar TESTE 2 novamente
curl -i -X POST https://facerec.alwaysdata.net/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://seu-app.vercel.app" \
  -d '{"name":"Teste","email":"novo@ex.com","password":"Senha123!"}'
```

**If returns 500 (not 409)**:
- Section: "🔴 Problema: 409 email duplicado retorna 500"
- Adicionar tratamento P2002

### ✅ TESTE 4: DevTools Frontend
1. Abrir site em `https://seu-app.vercel.app`
2. F12 → Network
3. Preencher e submeter form
4. Verificar:
   - Request URL: `https://facerec.alwaysdata.net/api/auth/register`? ✓
   - Response status: 201/409/422? ✓
   - Response headers: `Access-Control-Allow-Origin`? ✓
   - Console: Sem "Objects are not valid"? ✓

---

## 📋 CHECKLIST: 80% DOS ERROS

Para cada erro, marque conforme resolver:

**Backend (AlwaysData)**:
- [ ] DATABASE_URL está em `.env`
- [ ] Prisma migrou: `npx prisma migrate deploy`
- [ ] `express.json()` middleware ativo
- [ ] CORS middleware em TODAS respostas
- [ ] OPTIONS handler exportado
- [ ] POST handler exportado
- [ ] P2002 tratada (email duplicado)
- [ ] Validação usa try/catch (não throw)
- [ ] Node.js runtime configurado (bcryptjs)
- [ ] Logs acessíveis (AlwaysData console)

**Frontend (Vercel)**:
- [ ] VITE_API_URL apontando para backend correto
- [ ] Fetch/axios usando URL absoluta
- [ ] Estados são strings (não objetos)
- [ ] Tratamento de erro extrai `.message`
- [ ] Render não usa objetos (React #31)
- [ ] DevTools Network mostra Request URL correto

**Deployment**:
- [ ] vercel.json tem `runtime: nodejs20.x`
- [ ] .env em AlwaysData com DATABASE_URL e CORS_ORIGINS
- [ ] Git push dispara Vercel auto-deploy

---

## 🎯 ORDEM DE INVESTIGAÇÃO (quando 500)

1. **DevTools Network** (F12): Qual URL foi chamada? Request/Response headers estão?
2. **AlwaysData Logs** (console real-time): Qual erro específico?
3. **Curl test**: OPTIONS retorna 204? POST retorna 201?
4. **Checklist**: Falta algum item dos 15?

---

## 🚀 PRÓXIMOS PASSOS

1. **Imediato** (hoje):
   - Executar TESTE 1-4 acima
   - Ver qual falha
   - Ir para seção correspondente

2. **Curto prazo** (esta semana):
   - Deploy em produção (Vercel + AlwaysData)
   - Teste com usuários reais
   - Monitoring (logs)

3. **Longo prazo** (melhorias):
   - Rate-limiting
   - Email verification
   - Refresh tokens
   - Error tracking (Sentry)

---

## 📞 REFERÊNCIAS RÁPIDAS

| Problema | Arquivo | Linha |
|----------|---------|-------|
| 500 error | DEBUG_500_ERROR.md | PASSO 1-3 |
| React #31 | FIX_REACT_ERROR_31.md | Seção "Solução" |
| URL absoluta | FETCH_EXAMPLES.md | Cenário 2 |
| CORS middleware | CORS_MIDDLEWARE_CHECKLIST.md | Template |
| Node runtime | VERCEL_CONFIG_NODEJS.md | Solução 1 |

---

**Status**: ✅ Completo  
**Tempo estimado**: 15-30 min para resolver  
**Garantia**: 90% dos erros cobertos aqui
