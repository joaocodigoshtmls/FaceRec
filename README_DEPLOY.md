# 🚀 FaceRec - Documentação de Deploy

> Sistema de Reconhecimento Facial para Chamada Automática

## 📚 Documentação Disponível

Este repositório contém diversos guias para facilitar o deploy em produção:

### 🎯 Guias Principais

| Documento | Descrição | Tempo | Quando Usar |
|-----------|-----------|-------|-------------|
| **[DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md)** | Guia rápido em 3 etapas | 25 min | Primeira vez fazendo deploy |
| **[GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md)** | Guia detalhado com troubleshooting | 1h leitura | Referência completa |
| **[DATABASE_CONFIG.md](./DATABASE_CONFIG.md)** | Configuração do banco AlwaysData | 10 min | Problemas com conexão ao banco |
| **[CORS_CONFIG.md](./CORS_CONFIG.md)** | Configuração de CORS | 15 min | Erros de CORS no frontend |

### 📄 Arquivos de Configuração

| Arquivo | Descrição | Usado Por |
|---------|-----------|-----------|
| `netlify.toml` | Configuração do build do frontend | Netlify |
| `railway.json` | Configuração do build do backend | Railway |
| `.env.production.example` | Template de variáveis de ambiente | Você (referência) |
| `frontend/public/_redirects` | Redirects para SPA | Netlify |

---

## 🏗️ Arquitetura do Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUÇÃO                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐         ┌───────────────┐               │
│  │   NETLIFY     │   API   │   RAILWAY     │               │
│  │               │◄───────►│               │               │
│  │  React + Vite │ Requests│  Express API  │               │
│  │  (Frontend)   │         │  (Backend)    │               │
│  └───────────────┘         └───────┬───────┘               │
│                                    │                         │
│                                    │ SQL                     │
│                                    ▼                         │
│                           ┌───────────────┐                 │
│                           │  ALWAYSDATA   │                 │
│                           │     MySQL     │                 │
│                           │  (Database)   │                 │
│                           └───────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**URLs de Exemplo:**
- Frontend: `https://facerec.netlify.app`
- Backend: `https://facerec-backend.up.railway.app`
- Database: `mysql-facerec.alwaysdata.net:3306`

---

## ⚡ Quick Start (25 minutos)

### 1. AlwaysData - Banco de Dados (5 min)

```bash
# Anote sua connection string:
DATABASE_URL="mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1"
```

📖 **Detalhes:** [DATABASE_CONFIG.md](./DATABASE_CONFIG.md)

---

### 2. Railway - Backend (10 min)

1. Login em https://railway.app/
2. New Project → Deploy from GitHub → `FaceRec`
3. Adicionar variáveis:
   ```bash
   DATABASE_URL=mysql://facerec:senha@mysql-facerec.alwaysdata.net:3306/facerec_1
   JWT_SECRET=GERE_COM_openssl_rand_-base64_32
   CORS_ORIGINS=https://seu-site.netlify.app
   NODE_ENV=production
   ```
4. Anotar URL do deploy

📖 **Detalhes:** [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md#2️⃣-railway-backend---10-minutos)

---

### 3. Netlify - Frontend (10 min)

1. Login em https://www.netlify.com/
2. Add new site → Import from GitHub → `FaceRec`
3. Build settings já configurados em `netlify.toml`
4. Adicionar variáveis:
   ```bash
   VITE_API_URL=https://seu-backend.railway.app/api
   VITE_CAM_BASE=https://seu-backend.railway.app
   VITE_SOCKET_BASE=https://seu-backend.railway.app
   ```
5. Deploy!

📖 **Detalhes:** [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md#3️⃣-netlify-frontend---10-minutos)

---

### 4. Finalizar CORS

Volte ao Railway e atualize:
```bash
CORS_ORIGINS=https://seu-site.netlify.app
```

📖 **Detalhes:** [CORS_CONFIG.md](./CORS_CONFIG.md)

---

## 🔧 Stack Tecnológica

### Frontend (Netlify)
- **Framework:** React 19
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4
- **Router:** React Router 7
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client

### Backend (Railway)
- **Runtime:** Node.js 20
- **Framework:** Express 4
- **ORM:** Prisma 6
- **Auth:** JWT + bcrypt
- **Real-time:** Socket.IO
- **Upload:** Multer

### Database (AlwaysData)
- **DBMS:** MySQL 8
- **Tables:** 7 tabelas principais
- **ORM:** Prisma Client

---

## 📋 Variáveis de Ambiente

### Frontend (Netlify)

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `VITE_API_URL` | `https://backend.railway.app/api` | URL da API |
| `VITE_CAM_BASE` | `https://backend.railway.app` | Base URL da câmera |
| `VITE_SOCKET_BASE` | `https://backend.railway.app` | Base URL do WebSocket |
| `VITE_CLASSROOM_CODE` | `3AT.I` | Código da sala (opcional) |

### Backend (Railway)

| Variável | Exemplo | Obrigatória | Descrição |
|----------|---------|-------------|-----------|
| `DATABASE_URL` | `mysql://user:pass@host:3306/db` | ✅ Sim | Connection string do MySQL |
| `JWT_SECRET` | `sua_chave_32_chars` | ✅ Sim | Chave para assinar tokens |
| `CORS_ORIGINS` | `https://site.netlify.app` | ✅ Sim | Origens permitidas |
| `NODE_ENV` | `production` | ✅ Sim | Ambiente (production) |
| `JWT_EXPIRES_IN` | `24h` | ❌ Não | Validade do token (padrão: 24h) |
| `DEFAULT_ADMIN_PASSWORD` | `senha_segura` | ❌ Não | Senha do admin padrão |

> **⚠️ Segurança:** Gere `JWT_SECRET` com: `openssl rand -base64 32`

📖 **Detalhes:** [.env.production.example](./.env.production.example)

---

## ✅ Checklist de Deploy

### Pré-Deploy
- [ ] Node.js 20+ instalado localmente
- [ ] Contas criadas (Netlify, Railway, AlwaysData)
- [ ] Repositório GitHub com código atualizado
- [ ] Credenciais do banco anotadas

### Database (AlwaysData)
- [ ] Banco MySQL criado
- [ ] Connection string anotada
- [ ] Tabelas criadas (via Prisma)
- [ ] Firewall permite conexões externas

### Backend (Railway)
- [ ] Projeto criado e conectado ao GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Build command configurado
- [ ] Start command configurado
- [ ] Deploy bem-sucedido
- [ ] `/health` retorna 200 OK
- [ ] Logs sem erros de DB

### Frontend (Netlify)
- [ ] Site criado e conectado ao GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Build bem-sucedido
- [ ] Site abre sem erro 404
- [ ] Redirects para SPA funcionando

### Integração
- [ ] CORS configurado no Railway
- [ ] Frontend conecta ao backend
- [ ] Login funcionando
- [ ] Dados carregando
- [ ] WebSocket conectando (se aplicável)

### Segurança
- [ ] `JWT_SECRET` único e forte
- [ ] Senha padrão alterada
- [ ] `.env` no `.gitignore`
- [ ] CORS apenas com domínios autorizados
- [ ] Credenciais não commitadas

---

## 🚨 Troubleshooting Rápido

| Problema | Solução Rápida | Guia Detalhado |
|----------|----------------|----------------|
| **CORS Error** | Adicione URL do Netlify ao `CORS_ORIGINS` no Railway | [CORS_CONFIG.md](./CORS_CONFIG.md) |
| **500 Error** | Verifique `DATABASE_URL` e logs do Railway | [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md#problema-500-internal-server-error) |
| **404 após refresh** | Certifique-se de que `netlify.toml` ou `_redirects` existe | [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md#problema-rota-retorna-404-após-refresh) |
| **Build falha** | Limpe cache e redesenhe | [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md#problema-build-falha-no-netlify) |
| **Dados não aparecem** | Verifique ownership e logs do backend | [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md#problema-dados-não-aparecem-após-login) |

---

## 🧪 Testar Deploy

### 1. Backend (Railway)

```bash
# Health check
curl https://seu-backend.railway.app/health

# Resposta esperada:
# {"ok":true,"ts":"2025-11-15T...","port":3001}
```

### 2. Frontend (Netlify)

1. Abra: `https://seu-site.netlify.app`
2. Faça login com credenciais
3. Navegue para dashboard/salas
4. Verifique se dados aparecem

### 3. CORS

Abra console do navegador (F12) no frontend:

```javascript
fetch('https://seu-backend.railway.app/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ CORS OK:', data))
  .catch(err => console.error('❌ CORS Error:', err));
```

---

## 📊 Custos e Limites

### Planos Gratuitos

| Plataforma | Limite Grátis | Depois |
|------------|---------------|--------|
| **Netlify** | 100GB bandwidth/mês, 300 min build/mês | $19/mês (Pro) |
| **Railway** | $5 crédito/mês (~500h) | Pay-as-you-go |
| **AlwaysData** | 100MB storage | €3/mês (200MB) |

### Estimativa de Uso

Para um sistema escolar de pequeno porte:
- **Netlify:** Gratuito (suficiente)
- **Railway:** $0-5/mês (dentro dos créditos)
- **AlwaysData:** Gratuito (se < 100MB)

**Total estimado:** $0-5/mês

---

## 🔄 Atualizações e CI/CD

### Deploy Automático

Ambas plataformas fazem deploy automático:

```bash
# Fazer alterações
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Netlify e Railway farão deploy automaticamente!
```

### Deploy Manual

**Netlify:**
1. Dashboard → Deploys → Trigger deploy

**Railway:**
1. Dashboard → Deployments → Redeploy

### Forçar Redeploy

```bash
# Commit vazio para trigger
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- **Netlify Docs:** https://docs.netlify.com/
- **Railway Docs:** https://docs.railway.app/
- **AlwaysData Help:** https://help.alwaysdata.com/
- **Prisma Docs:** https://www.prisma.io/docs/
- **Vite Guide:** https://vitejs.dev/guide/

### Suporte

- **Netlify Community:** https://answers.netlify.com/
- **Railway Discord:** https://discord.gg/railway
- **Prisma Discord:** https://pris.ly/discord

---

## 🎓 Aprender Mais

### Conceitos Importantes

- **SPA (Single Page Application):** Aplicação de página única onde o roteamento é feito no cliente
- **CORS:** Mecanismo de segurança que controla acesso entre domínios
- **JWT:** Tokens de autenticação stateless
- **ORM:** Object-Relational Mapping (Prisma) para facilitar acesso ao banco
- **SSR vs CSR:** Server-Side vs Client-Side Rendering

### Otimizações Futuras

- [ ] Configurar CDN adicional
- [ ] Implementar rate limiting
- [ ] Adicionar cache de API (Redis)
- [ ] Configurar monitoramento (Sentry)
- [ ] Implementar backups automáticos
- [ ] Adicionar testes automatizados
- [ ] Configurar staging environment

---

## 🤝 Contribuindo

Se encontrar problemas ou melhorias:

1. Abra uma issue no GitHub
2. Descreva o problema/sugestão
3. Inclua logs relevantes
4. Compartilhe solução se encontrar

---

## 📄 Licença

Este projeto e documentação são fornecidos "como estão" para fins educacionais.

---

## 🎉 Conclusão

Seu sistema FaceRec está pronto para produção!

**Próximos passos:**
1. Teste todas as funcionalidades
2. Configure domínio personalizado (opcional)
3. Adicione monitoramento
4. Configure backups regulares
5. Documente processos para sua equipe

**Dúvidas?** Consulte os guias detalhados listados no início deste documento.

---

**Última atualização:** Novembro 2025  
**Versão da documentação:** 1.0
