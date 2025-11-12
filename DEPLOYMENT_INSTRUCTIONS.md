# 🚀 Instruções de Migração e Deploy - FaceRec Register Fix

## 📌 Resumo da Correção do 405

**Problema**: POST `/api/auth/register` retorna 405 Method Not Allowed em produção no Vercel.

**Causa Raiz**:
- ❌ Handler OPTIONS não estava respondendo ao preflight CORS
- ❌ CORS headers `Access-Control-*` faltavam ou eram incorretos
- ❌ Express.js `app.post()` não é otimizado para Vercel serverless

**Solução Implementada**:
- ✅ Arquivo `/api/auth/register.js` exporta handlers nomeados: `OPTIONS` e `POST`
- ✅ OPTIONS retorna 204 com headers CORS completos
- ✅ POST valida campos, verifica email único, hash com bcryptjs
- ✅ Respostas: 201 (sucesso), 409 (email existe), 422 (validação), 500 (erro)

---

## 🔧 Pré-requisitos

### Node.js e npm
```bash
node --version  # v18+ recomendado
npm --version   # v8+
```

### Instalar dependências (se não tiver)
```bash
cd c:\Users\Pass\FaceRec
npm install
npm install --workspace api
npm install --workspace frontend
```

### Variáveis de Ambiente

#### `.env.local` (raiz do projeto)
```env
# Banco de Dados - Escolha UMA das opções:

# OPÇÃO 1: PostgreSQL/MySQL em cloud (Vercel, Planetscale, etc):
DATABASE_URL="mysql://user:password@host.region.rds.amazonaws.com:3306/dbname?sslaccept=strict"

# OPÇÃO 2: MySQL/MariaDB local:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=facerec
DB_PORT=3306

# Autenticação
JWT_SECRET=sua_chave_super_secreta_minimo_32_caracteres_aleatorio

# Debug (apenas em development)
DEBUG_API=0
```

#### `.env.production` (no Vercel - vide abaixo)
```env
DATABASE_URL=mysql://...  (URL de produção)
JWT_SECRET=...  (valor de produção seguro)
```

---

## 📝 Passo 1: Validar Banco de Dados

### 1.1 Verificar conexão
```bash
cd backend
npm run test:connection
# Esperado: Conectado com sucesso
```

### 1.2 Tabela `users` existe?
```bash
# Verificar schema Prisma:
npm run prisma:validate

# Se erros, aplicar migração:
npm run prisma:generate
```

### 1.3 Se usando Nova DB (nunca rodou Prisma):
```bash
# Criar schema no banco:
npx prisma db push --skip-generate

# Ou fazer migração from scratch:
npx prisma migrate deploy
```

---

## 🔄 Passo 2: Atualizar Código Localmente

### 2.1 Verificar que os arquivos estão corretos:

✅ `/api/auth/register.js` deve existir com:
```javascript
export async function OPTIONS(req, res) { ... }
export async function POST(req, res) { ... }
```

✅ `/frontend/lib/authApi.js` deve ter função `register(data)`

✅ `/frontend/Components/CadastroFormCorrigido.jsx` com componente

### 2.2 Se algum arquivo falta, copiar:
```bash
# Do seu repositório local para o projeto
# (Já feito na criação deste patch)
```

---

## 🧪 Passo 3: Testar Localmente

### 3.1 Iniciar backend com Nodemon
```bash
cd backend
npm run dev
# Esperado: "Server running on port 3001" ou similar
```

### 3.2 Em outro terminal, iniciar frontend
```bash
cd frontend
npm run dev
# Esperado: "Vite está pronto em http://localhost:5173"
```

### 3.3 Testar endpoints com curl
```bash
# Terminal 3:

# Preflight:
curl -i -X OPTIONS http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173"

# POST sucesso:
curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"TestPass123"}'

# POST validação (senha curta):
curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@example.com","password":"123"}'
```

**Respostas Esperadas:**
```
OPTIONS → 204 No Content (com headers CORS)
POST sucesso → 201 Created { "ok": true, "userId": "1", ... }
POST validação → 422 { "ok": false, "issues": [...] }
```

---

## 🚀 Passo 4: Deploy no Vercel

### 4.1 Commit e Push
```bash
cd c:\Users\Pass\FaceRec

git add -A
git commit -m "fix: corrigir rota POST /api/auth/register com OPTIONS preflight e CORS"
git push origin main
```

### 4.2 Configurar Variáveis no Vercel

1. Ir para https://vercel.com/dashboard
2. Selecionar projeto **FaceRec**
3. Aba **Settings**
4. Seção **Environment Variables**
5. Adicionar:

| Chave | Valor | Encrypted? |
|-------|-------|-----------|
| `DATABASE_URL` | `mysql://user:pass@host:3306/dbname` | ✅ SIM |
| `JWT_SECRET` | `sua_chave_aleatória_de_32+_chars` | ✅ SIM |
| `DEBUG_API` | `0` | ❌ Não |

**Nota**: Valores marcados como "Encrypted" ficam privados e não aparecem nos logs.

### 4.3 Deploy
```bash
# Voltar para VS Code
# Ir em Source Control (Ctrl+Shift+G)
# Confirmar push

# OU em terminal:
git push

# Vercel verá o push e iniciará auto-deploy
# Aguardar ~1-2 min
```

### 4.4 Verificar Deploy
1. Abrir https://vercel.com/dashboard
2. Ver deployment status (deve estar ✅ READY)
3. Clicar em "Visit" para testar

---

## 🔍 Passo 5: Testar em Produção

### 5.1 Obter URL do seu projeto
```
https://facerec.vercel.app  (ou seu domínio customizado)
```

### 5.2 Testar com curl
```bash
# Preflight:
curl -i -X OPTIONS https://facerec.vercel.app/api/auth/register \
  -H "Origin: https://facerec.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# POST:
curl -i -X POST https://facerec.vercel.app/api/auth/register \
  -H "Origin: https://facerec.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Prod Test","email":"prodtest@example.com","password":"ProdPass123"}'
```

**Esperado:**
- OPTIONS → **204 No Content** (sem 405!)
- POST → **201 Created** (sucesso) ou **422/409** (validação/conflito)

### 5.3 Visualizar Logs
1. Vercel Dashboard → Project → Deployments → Deployment mais recente
2. Botão **"View Functions Logs"**
3. Filtrar por `auth/register`
4. Verificar se há erros 500 ou 405

---

## 📋 Configuração de Domínios CORS

### ⚠️ **IMPORTANTE: Editar para Seu Domínio**

Abrir arquivo: `/api/auth/register.js`

Encontrar linhas ~30 e ~88:

**ANTES:**
```javascript
if (/^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return callback(null, true);
if (/^https:\/\/(seu-dominio-aqui\.com|api\.seu-dominio\.com)$/i.test(origin)) return callback(null, true);
```

**DEPOIS (exemplo com seu domínio):**
```javascript
if (/^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return callback(null, true);
if (/^https:\/\/(facerec\.com|app\.facerec\.com)$/i.test(origin)) return callback(null, true);
```

**Variações comuns:**
```javascript
// Apenas vercel.app (padrão):
if (/^https?:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)) return callback(null, true);

// Com domínio customizado:
if (/^https:\/\/(seu-dominio\.com|app\.seu-dominio\.com|api\.seu-dominio\.com)$/i.test(origin)) return callback(null, true);

// Sub-domínios dinâmicos:
if (/^https:\/\/.+\.seu-dominio\.com$/i.test(origin)) return callback(null, true);

// Dev + prod:
if (/^https?:\/\/(localhost:5173|localhost:3000|seu-dominio\.com|.*\.vercel\.app)$/i.test(origin)) return callback(null, true);
```

Após editar:
```bash
git add api/auth/register.js
git commit -m "config: adicionar domínio CORS customizado"
git push
# Vercel faz auto-deploy
```

---

## ✅ Checklist Final de Deploy

- [ ] `.env.local` tem `DATABASE_URL` e `JWT_SECRET`
- [ ] Banco de dados está acessível (`npm run test:connection` passou)
- [ ] Tabela `users` existe com campos corretos
- [ ] `/api/auth/register.js` exporta `OPTIONS` e `POST`
- [ ] `/frontend/lib/authApi.js` tem função `register()`
- [ ] Testes locais passaram (curl de preflight e POST)
- [ ] Código commitado e pushado
- [ ] Variáveis configuradas no Vercel (Encrypted)
- [ ] Deploy está ✅ READY
- [ ] Teste de preflight em produção retorna 204 (não 405)
- [ ] POST em produção retorna 201/409/422 (não 405)
- [ ] Domínios CORS editados para seu domínio

---

## 🆘 Troubleshooting

### Erro 405 ainda aparece
```bash
# 1. Verificar logs do Vercel
# 2. Confirmar que arquivo está no repo:
git ls-files | grep api/auth/register

# 3. Se falta, fazer commit:
git add api/auth/register.js
git push

# 4. Forçar rebuild no Vercel:
# Dashboard → Deployments → Redeploy OU
git commit --allow-empty -m "rebuild"
git push
```

### Erro 500 no banco
```bash
# 1. Verificar se DATABASE_URL está correto no Vercel
# 2. Testar localmente:
cd backend && npm run test:connection

# 3. Verificar se tabela users existe:
# Acessar banco → query: SELECT * FROM users LIMIT 1;

# 4. Ver logs do Vercel para mensagem de erro específica
```

### CORS error no navegador
```bash
# Verificar headers da resposta:
# F12 (DevTools) → Network → Clique na requisição
# Procurar por "Access-Control-Allow-Origin"

# Se não existe, voltar a `/api/auth/register.js` e garantir que
# os headers estão sendo setados em OPTIONS e POST
```

### Banco não configurado (erro "Variáveis de banco não configuradas")
```bash
# Verificar que UMA das opções está no .env:

# Opção 1 (DATABASE_URL):
DATABASE_URL="mysql://user:password@host:3306/database"

# Opção 2 (DB_HOST etc):
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=senha
DB_NAME=facerec

# Se no Vercel, confirmar em:
# Settings → Environment Variables
```

---

## 📚 Referências

- [Vercel Docs - Serverless Functions](https://vercel.com/docs/functions)
- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [bcryptjs NPM](https://www.npmjs.com/package/bcryptjs)
- [Prisma Migration](https://www.prisma.io/docs/orm/prisma-migrate/migrate)

---

## 💬 Dúvidas?

Se algo não funcionar:

1. Verificar logs: Vercel Dashboard → Functions Logs
2. Testar localmente primeiro
3. Verificar se arquivo está no git: `git status`
4. Confirmar variáveis .env: `echo $DATABASE_URL`
5. Listar testes: `/ANTI_405_CHECKLIST.md`

