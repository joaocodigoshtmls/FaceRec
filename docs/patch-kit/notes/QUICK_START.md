# ⚡ Quick Start - Corrigir 405 em 5 Minutos

## 🎯 Objetivo
Corrigir erro **405 Method Not Allowed** na rota POST `/api/auth/register` em produção (Vercel).

## 📊 Status
- ✅ Arquivo `/api/auth/register.js` criado com handlers `OPTIONS` e `POST`
- ✅ Arquivo `/frontend/lib/authApi.js` criado com função `register()`
- ✅ Componente `/frontend/Components/CadastroFormCorrigido.jsx` criado
- ✅ Testes criados em `/tests/register-tests.http`
- ✅ Documentação completa em `/DEPLOYMENT_INSTRUCTIONS.md`

## 🚀 5 Passos para Deploy

### **1. Verificar .env (1 min)**
```bash
# Abrir: c:\Users\Pass\FaceRec\.env.local
# Garantir que tem:
DATABASE_URL="mysql://user:password@host:3306/database"
JWT_SECRET="sua_chave_aleatória_minimo_32_chars"
```

### **2. Testar Localmente (2 min)**
```bash
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev

# Terminal 3:
curl -i -X OPTIONS http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173"

# Esperado: 204 No Content (NÃO 405!)
```

### **3. Editar Domínios CORS (1 min)**
Abrir: `/api/auth/register.js`

Linhas ~30 e ~88, trocar:
```javascript
// ANTES:
if (/^https:\/\/(seu-dominio-aqui\.com|api\.seu-dominio\.com)$/i.test(origin))

// DEPOIS (seu domínio):
if (/^https:\/\/(facerec\.com|app\.facerec\.com)$/i.test(origin))
```

### **4. Commit e Push (1 min)**
```bash
git add -A
git commit -m "fix: corrigir 405 em /api/auth/register com OPTIONS CORS"
git push
```

### **5. Configurar Vercel (1 min)**
1. Abrir: https://vercel.com/dashboard
2. Projeto **FaceRec** → **Settings** → **Environment Variables**
3. Adicionar:
   - `DATABASE_URL` = sua URL (Encrypted: ✅)
   - `JWT_SECRET` = seu valor (Encrypted: ✅)
4. Deploy automático em ~1 min

---

## ✅ Verificar que Funcionou

### Local:
```bash
curl -i -X OPTIONS http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173"
# Esperado: 204 (não 405)

curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@example.com","password":"Pass123456"}'
# Esperado: 201 (sucesso) ou 422 (validação)
```

### Produção:
```bash
curl -i -X OPTIONS https://facerec.vercel.app/api/auth/register \
  -H "Origin: https://facerec.vercel.app"
# Esperado: 204 (não 405)
```

---

## 📂 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `/api/auth/register.js` | ✅ Handler com OPTIONS + POST corrigidos |
| `/frontend/lib/authApi.js` | ✅ Função `register()` para chamar API |
| `/frontend/Components/CadastroFormCorrigido.jsx` | ✅ Componente React com validação |
| `/backend/prisma/migrations/add_user_fields/migration.sql` | ✅ Schema User (already ok) |
| `/tests/register-tests.http` | ✅ Testes HTTP prontos para REST Client |
| `/ANTI_405_CHECKLIST.md` | 📋 Checklist detalhado + testes curl |
| `/DEPLOYMENT_INSTRUCTIONS.md` | 📖 Guia completo passo-a-passo |
| `/QUICK_START.md` | ⚡ Este arquivo! |

---

## 🔧 Se der Erro 405 Ainda

```bash
# 1. Verificar logs no Vercel
# Vercel Dashboard → Deployments → View Functions Logs

# 2. Garantir que arquivo está no repo
git ls-files | grep "api/auth/register"
# Esperado: api/auth/register.js

# 3. Se não existe, fazer commit:
git add api/auth/register.js
git push

# 4. Se ainda não funcionar:
# Forçar rebuild:
git commit --allow-empty -m "rebuild"
git push
```

---

## 💡 Resumo Técnico

**Por que o 405 acontecia:**
- Browser faz request `OPTIONS /api/auth/register` (preflight)
- Express não respondeu com 204 e headers CORS
- Browser bloqueou o POST com 405

**Como foi corrigido:**
- ✅ `export async function OPTIONS()` → 204 + headers CORS
- ✅ `export async function POST()` → validação, hash, BD
- ✅ Whitelist CORS com domínios Vercel + customizados
- ✅ Suporte a 409 (email existe), 422 (validação), 201 (sucesso)

---

## 📚 Referências Rápidas

- **Documentação Completa**: `/DEPLOYMENT_INSTRUCTIONS.md`
- **Checklist Anti-405**: `/ANTI_405_CHECKLIST.md`
- **Testes HTTP**: `/tests/register-tests.http` (REST Client)
- **Schema DB**: `/backend/prisma/schema.prisma`
- **API Frontend**: `/frontend/lib/authApi.js`

---

## ❓ FAQ Rápido

**P: Ainda tenho 405?**
A: Verificar Vercel logs. Garantir que `/api/auth/register.js` está no repo (`git ls-files`).

**P: Como testar CORS?**
A: `curl -i -X OPTIONS ... -H "Origin: ..."` ou instalar REST Client no VS Code.

**P: Qual a senha mínima?**
A: 8 caracteres (configurável em `/api/auth/register.js` linha ~40).

**P: EMAIL_JÁ_EXISTE = qual status HTTP?**
A: 409 Conflict (`{ ok: false, message: 'Email already registered' }`).

**P: Alterar domínio CORS?**
A: `/api/auth/register.js` linhas ~30 e ~88.

---

## 🎉 Pronto!

Segue o checklist rápido:
- [ ] `.env.local` configurado
- [ ] `curl -i -X OPTIONS` retorna **204** (não 405)
- [ ] `curl -i -X POST` retorna **201** (sucesso)
- [ ] Domínios CORS editados
- [ ] `git push` feito
- [ ] Vercel deployment ✅ READY
- [ ] Testes em produção OK

**Se tudo passou, 405 está corrigido!** 🚀
