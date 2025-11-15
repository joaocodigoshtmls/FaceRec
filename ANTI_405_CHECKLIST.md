# 🚀 Checklist Anti-405 - FaceRec Register

## ✅ Checklist de Implementação

### 1. **Estrutura de Rota**
- [x] Rota está em `/api/auth/register.js` (não em pages/api)
- [x] Arquivo exporta `OPTIONS` e `POST` como handlers nomeados
- [x] Caminho correto: `/api/auth/register` (sem trailing slash duplicado)

### 2. **Preflight OPTIONS**
- [x] `OPTIONS` handler retorna 204 com headers CORS
- [x] Headers incluem:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE, PATCH`
  - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept`
  - `Access-Control-Allow-Credentials: true`
  - `Vary: Origin`
  - `Cache-Control: no-cache, no-store, must-revalidate`

### 3. **POST Handler**
- [x] `POST` handler recebe Request com body
- [x] Valida campos com Zod-like validator
  - `name`: min 2 caracteres
  - `email`: válido
  - `password`: min 8 caracteres
- [x] Retorna 422 com erros de validação
- [x] Valida se email existe → 409
- [x] Hash de senha com bcryptjs: `await bcrypt.hash(password, 10)`
- [x] Cria usuário no MySQL
- [x] Retorna 201 com `{ ok: true, userId, user: {...} }`

### 4. **CORS**
- [x] Whitelist inclui:
  - `http://localhost:5173` (Vite dev)
  - `http://localhost:3000`
  - `http://127.0.0.1:5173`
  - `http://127.0.0.1:3000`
- [x] **IMPORTANTE: Editar domínios Vercel** no arquivo `/api/auth/register.js` linha ~30 e ~88

### 5. **Variáveis de Ambiente**
- [ ] `.env.local` tem `DATABASE_URL` ou `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- [ ] `JWT_SECRET` está definido (ou será gerado temporariamente)
- [ ] No Vercel: todas as variáveis marcadas como "Encrypted"

### 6. **Runtime Node.js**
- [x] Função usa `bcryptjs` (requer Node runtime, não Edge)
- [x] No `api/auth/register.js` há suporte a `import` statements

### 7. **Build & Deploy**
- [ ] Arquivo está commitado no git: `git add api/auth/register.js`
- [ ] Build funciona: `npm run vercel-build` ou `npm run build`
- [ ] Deploy no Vercel sem erros
- [ ] Verificar logs: Vercel Dashboard → Project → Deployments → View Functions Logs

### 8. **Testes**
- [ ] Preflight retorna 204 (sem 405)
- [ ] POST com dados válidos retorna 201
- [ ] POST sem email retorna 422
- [ ] POST com email duplicado retorna 409
- [ ] CORS headers presentes em todas as respostas

---

## 🧪 Testes com curl/HTTPie

### **Pré-requisitos**
```bash
# Instalar curl (já vem no Windows 10+) ou HTTPie:
pip install httpie
```

### **1. Teste de Preflight (OPTIONS)**
```bash
# Testar em localhost:
curl -i -X OPTIONS http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Resposta esperada: 204 No Content com headers CORS
# Headers importantes:
#   Access-Control-Allow-Origin: http://localhost:5173
#   Access-Control-Allow-Methods: ...POST...
```

### **2. Teste de Cadastro - Sucesso (201)**
```bash
curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "MinhaSenh@123"
  }'

# Resposta esperada:
# Status: 201 Created
# Body: { "ok": true, "userId": "123", "user": { ... } }
```

### **3. Teste de Cadastro - Validação Falha (422)**
```bash
# Senha muito curta (< 8 caracteres):
curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João",
    "email": "joao@example.com",
    "password": "123"
  }'

# Resposta esperada:
# Status: 422 Unprocessable Entity
# Body: { 
#   "ok": false, 
#   "issues": [
#     { "field": "password", "message": "Senha deve ter pelo menos 8 caracteres" }
#   ] 
# }
```

### **4. Teste de Cadastro - Conflito Email (409)**
```bash
# Primeiro, cadastrar um usuário:
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"João","email":"duplicado@example.com","password":"MinhaSenh@123"}'

# Depois, tentar cadastrar com o mesmo email:
curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Outro",
    "email": "duplicado@example.com",
    "password": "OutraSen@123"
  }'

# Resposta esperada:
# Status: 409 Conflict
# Body: { "ok": false, "message": "Email already registered" }
```

### **5. Teste de CORS - Origem Não Permitida (CORS Error)**
```bash
# Tentar com origem não whitelisted:
curl -i -X POST http://localhost:3001/api/auth/register \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"João","email":"test@example.com","password":"MinhaSenh@123"}'

# Resposta esperada:
# CORS error bloqueado pelo navegador (em browsers)
# No curl, verá um erro de CORS no header
```

### **HTTPie (alternativa mais legível)**
```bash
# Preflight:
http OPTIONS localhost:3001/api/auth/register Origin:http://localhost:5173 \
  Access-Control-Request-Method:POST

# Sucesso:
http POST localhost:3001/api/auth/register Origin:http://localhost:5173 \
  fullName="João Silva" email="joao@example.com" password="MinhaSenh@123"

# Validação:
http POST localhost:3001/api/auth/register Origin:http://localhost:5173 \
  fullName="João" email="joao@example.com" password="123"

# Conflito:
http POST localhost:3001/api/auth/register Origin:http://localhost:5173 \
  fullName="Outro" email="duplicado@example.com" password="OutraSen@123"
```

---

## 🌐 Teste em Produção (Vercel)

### **Configurar domínios CORS**
1. Abrir `/api/auth/register.js`
2. Linhas ~30 e ~88: Editar para seu domínio:
   ```javascript
   // Exemplo:
   if (/^https:\/\/(seu-dominio-aqui\.com|api\.seu-dominio\.com)$/i.test(origin)) {
   ```
3. Mudar para:
   ```javascript
   if (/^https:\/\/(facerec\.com|app\.facerec\.com|facerec\.vercel\.app)$/i.test(origin)) {
   ```

### **Deploy**
```bash
git add api/auth/register.js frontend/lib/authApi.js
git commit -m "fix: corrigir rota POST /api/auth/register com OPTIONS preflight e CORS"
git push

# Vercel fará auto-deploy
# Aguardar ~1-2min
```

### **Verificar Logs**
1. Ir para: https://vercel.com/dashboard
2. Selecionar projeto FaceRec
3. Aba "Deployments"
4. Clicar no deployment mais recente
5. Clicar em "View Functions Logs"
6. Filtrar por "auth/register"

### **Teste Final em Produção**
```bash
# Preflight:
curl -i -X OPTIONS https://facerec.vercel.app/api/auth/register \
  -H "Origin: https://facerec.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# POST:
curl -i -X POST https://facerec.vercel.app/api/auth/register \
  -H "Origin: https://facerec.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"João","email":"test@facerec.com","password":"MinhaSenh@123"}'
```

---

## 🔧 Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| **405 Method Not Allowed** | OPTIONS não respondido | Verificar que `export async function OPTIONS()` existe |
| **CORS error** | Headers CORS faltando | Verificar `Access-Control-Allow-Origin` na resposta |
| **422 Validation Error** | Campos faltam validação | Verificar `validateRegister()` em `/api/auth/register.js` |
| **409 Conflict** | Email duplicado (esperado) | Usar email diferente ou deletar usuário anterior |
| **500 Internal Error** | Conexão com banco falhou | Verificar `DATABASE_URL` ou credenciais BD |
| **Preflight 204 vazio** | Cache, verificar `Vary: Origin` | Limpar cache do navegador: F12 → Network → Disable Cache |

---

## 📝 Notas Importantes

1. **HTTPS em Produção**: Alterar `http://` para `https://` nos domínios CORS
2. **Vercel Edge Runtime**: Não usar bcryptjs em Edge functions. Use Node runtime (padrão).
3. **Rate Limiting**: Considerar adicionar rate limit no Vercel para `/api/auth/register` após testes.
4. **Logs**: Se tiver erro 500, sempre verificar os logs do Vercel; não mostrar detalhes em produção.
5. **SSL/TLS**: Vercel fornece cert grátis; verificar se está ativo: https://seu-dominio.vercel.app

