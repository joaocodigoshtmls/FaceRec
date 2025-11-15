# ⚡ QUICK INTEGRATION GUIDE - 5 Minutos

**Objetivo**: Integrar patch de registro aprimorado em 5 passos

---

## ✅ PASSO 1: Copiar Arquivos (2 min)

```bash
# Backend: Novo handler com CORS via .env
cp api/auth/register-v2.js api/auth/register.js

# Backend: Alias /api/signup
mkdir -p api/signup
cp api/signup/route.js api/signup/route.js

# Frontend: Novo authApi com URL absoluta
cp frontend/lib/authApi-hardened.js frontend/lib/authApi.js
```

---

## ✅ PASSO 2: Configurar Variáveis (1 min)

**Backend `.env`**:
```bash
# Novo: CORS configurável
CORS_ORIGINS="https://seu-projeto.vercel.app,http://localhost:8080"

# Banco de dados (já deve existir)
DATABASE_URL="mysql://user:pass@host:3306/db"

# Debug (opcional)
DEBUG_API=0
```

**Frontend `.env.local`**:
```bash
# Novo: URL do backend (deixe vazio para usar /api)
VITE_API_URL="https://seu-backend.alwaysdata.com/api"
# OU para desenvolvimento local:
# VITE_API_URL="http://localhost:3001/api"
```

---

## ✅ PASSO 3: Configurar Vercel (1 min)

**`vercel.json`** (adicionar/atualizar):
```json
{
  "functions": {
    "api/auth/register.js": {
      "runtime": "nodejs20.x"
    },
    "api/signup/route.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

---

## ✅ PASSO 4: Instalar Dependências (1 min)

```bash
# Backend
cd api
npm install bcrypt mysql2 dotenv

# Frontend
cd ../frontend
npm install
```

---

## ✅ PASSO 5: Testar (Alguns segundos)

```bash
# Localmente
npm run dev

# Curl test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@example.com","password":"SenhaSegura123!"}'

# Esperado: 201 {"ok":true,...}
```

---

## 🧪 VALIDAÇÃO RÁPIDA

### ✓ CORS com OPTIONS
```bash
curl -X OPTIONS http://localhost:3000/api/auth/register \
  -H "Access-Control-Request-Method: POST" \
  -H "Origin: http://localhost:5173" \
  -v

# Deve retornar: 204 + headers Access-Control-*
```

### ✓ Alias /api/signup
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste2@example.com","password":"SenhaSegura123!"}'

# Deve retornar: 201 (mesmo que /api/auth/register)
```

### ✓ Email duplicado
```bash
# Executar mesmo POST novamente
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@example.com","password":"SenhaSegura123!"}'

# Deve retornar: 409 {"ok":false,"code":"EMAIL_CONFLICT"}
```

### ✓ Validação
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"invalido","password":"123"}'

# Deve retornar: 422 {"ok":false,"issues":[...]}
```

---

## 📊 O QUE MUDOU RESUMO

| Item | Antes | Depois | Arquivo |
|------|-------|--------|---------|
| CORS domains | Hardcoded | Via `.env` | `register.js` |
| Rotas | `/api/auth/register` | + `/api/signup` | `api/signup/route.js` |
| URL Backend | Relativa `/api` | Absoluta (VITE_API_URL) | `authApi.js` |
| Preflight | Básico | Completo | `register-tests-enhanced.http` |
| Runtime | Default | Node.js 20.x | `vercel.json` |

---

## 🚀 DEPLOY CHECKLIST

- [ ] Arquivos copiados
- [ ] `.env` atualizado com CORS_ORIGINS
- [ ] `vercel.json` com Node.js runtime
- [ ] Dependências instaladas (`npm install`)
- [ ] Testes locais passando (201, 409, 422)
- [ ] Git commit e push
- [ ] Vercel detecta mudanças e faz deploy
- [ ] Teste em `https://seu-projeto.vercel.app/api/auth/register`

---

## ❓ FAQ

**P: Preciso alterar meu código React?**  
R: Não, `register()` em `authApi.js` continua igual. Apenas adicionamos suporte a URL absoluta.

**P: E se deixar CORS_ORIGINS vazio?**  
R: Localhost é automaticamente habilitado. Funciona para desenvolvimento.

**P: E se deixar VITE_API_URL vazio?**  
R: Usa `/api` (relativa). Vercel frontend + Vercel backend funciona assim.

**P: 405 Method Not Allowed volta?**  
R: Verificar se OPTIONS e POST estão exportados em `register.js`.

**P: Como testar CORS em produção?**  
R: DevTools (F12) → Network → XHR → expandir requisição → aba Headers.

---

## 📞 SUPORTE

**Erro: "Cannot find module 'bcrypt'"**  
→ `npm install bcrypt` no diretório `/api`

**Erro: "ENOTFOUND seu-backend.alwaysdata.com"**  
→ Verificar URL em `.env` / `VITE_API_URL`

**Erro: "CORS policy: No 'Access-Control-Allow-Origin'"**  
→ Verificar `CORS_ORIGINS` no backend `.env`

**Erro: "403 Forbidden"**  
→ Verificar credenciais do banco (DB_USER, DB_PASSWORD)

---

## ✨ NEXT STEPS (Opcional)

1. Implementar email verification
2. Adicionar rate-limiting
3. Setup logging estruturado
4. Testes automatizados (Jest)

---

**Status**: ⚡ Rápido e pronto  
**Tempo estimado**: 5 minutos  
**Dificuldade**: ⭐ Fácil  
**Suporte**: Vercel + AlwaysData + Localhost
