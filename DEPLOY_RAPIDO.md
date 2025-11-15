# ⚡ GUIA RÁPIDO DE DEPLOY

> Para o guia completo e detalhado, veja [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md)

## 🎯 3 Passos para Deploy

### 1️⃣ ALWAYSDATA (Banco de Dados) - 5 minutos

```bash
# Anote suas credenciais:
Host: mysql-facerec.alwaysdata.net
Port: 3306
Database: facerec_1
User: facerec
Password: iqmi8j55PDpHQ

# Monte a connection string:
DATABASE_URL="mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1"
```

✅ **Checklist:**
- [ ] Banco criado no painel AlwaysData
- [ ] Connection string anotada

---

### 2️⃣ RAILWAY (Backend) - 10 minutos

1. **Criar projeto:**
   - Acesse https://railway.app/
   - New Project → Deploy from GitHub → Selecione `FaceRec`

2. **Configurar variáveis:**
   ```bash
   DATABASE_URL=mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1
   JWT_SECRET=GERE_COM_openssl_rand_-base64_32
   JWT_EXPIRES_IN=24h
   CORS_ORIGINS=https://seu-site.netlify.app
   DEFAULT_ADMIN_PASSWORD=TROQUE_ESTA_SENHA
   NODE_ENV=production
   ```

3. **Configurar build:**
   - Build Command: `cd backend && npm install --production=false && npx prisma generate`
   - Start Command: `cd backend && node src/server.js`

4. **Deploy e anotar URL:**
   - Settings → Networking → Copiar URL pública
   - Exemplo: `https://facerec-backend.up.railway.app`

✅ **Checklist:**
- [ ] Deploy bem-sucedido
- [ ] `/health` retorna `{"ok":true}`
- [ ] URL anotada

---

### 3️⃣ NETLIFY (Frontend) - 10 minutos

1. **Criar site:**
   - Acesse https://www.netlify.com/
   - Add new site → Import from GitHub → Selecione `FaceRec`

2. **Configurar build:**
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`

3. **Configurar variáveis:**
   ```bash
   VITE_API_URL=https://facerec-backend.up.railway.app/api
   VITE_CAM_BASE=https://facerec-backend.up.railway.app
   VITE_SOCKET_BASE=https://facerec-backend.up.railway.app
   VITE_CLASSROOM_CODE=3AT.I
   ```

4. **Redesenhar:**
   - Deploys → Trigger deploy → Clear cache and deploy

5. **Atualizar CORS no Railway:**
   - Volte ao Railway
   - Variables → Edite `CORS_ORIGINS`
   - Adicione a URL do Netlify: `https://seu-site.netlify.app`

✅ **Checklist:**
- [ ] Deploy bem-sucedido
- [ ] Site abre sem erros
- [ ] Login funciona
- [ ] CORS atualizado no Railway

---

## 🧪 Testar

1. **Backend:**
   ```bash
   curl https://seu-backend.railway.app/health
   ```

2. **Frontend:**
   - Abra: `https://seu-site.netlify.app`
   - Faça login
   - Verifique se dados aparecem

---

## 🚨 Problemas Comuns

| Erro | Solução |
|------|---------|
| CORS Error | Atualize `CORS_ORIGINS` no Railway com URL do Netlify |
| 500 Error | Verifique `DATABASE_URL` e logs do Railway |
| Build falha | Limpe cache e redesenhe |
| 404 após refresh | Certifique-se de que `netlify.toml` existe |

---

## 🔑 Comandos Essenciais

```bash
# Gerar JWT_SECRET
openssl rand -base64 32

# Testar API
curl https://backend.railway.app/health

# Forçar redeploy (commit vazio)
git commit --allow-empty -m "redeploy" && git push
```

---

## 📚 Documentação Completa

Para detalhes, troubleshooting avançado e configurações opcionais, consulte:

**→ [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md)**

---

## ✅ Checklist Final

- [ ] Banco de dados acessível no AlwaysData
- [ ] Backend rodando no Railway (`/health` OK)
- [ ] Frontend carregando no Netlify
- [ ] CORS configurado com URL do Netlify
- [ ] Login funcionando
- [ ] Dados carregando corretamente
- [ ] `JWT_SECRET` alterado
- [ ] Senhas padrão alteradas
- [ ] `.env` não commitado no git

---

**🎉 Pronto!** Seu sistema está no ar.

**Tempo estimado:** 25 minutos  
**Custo:** $0 (planos gratuitos)
