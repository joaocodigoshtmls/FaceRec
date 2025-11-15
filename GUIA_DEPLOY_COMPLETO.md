# 🚀 GUIA COMPLETO DE DEPLOY - NETLIFY + RAILWAY + ALWAYSDATA

> **Projeto:** FaceRec - Sistema de Reconhecimento Facial para Chamada Automática
> 
> **Stack:**
> - **Frontend:** React + Vite (Netlify)
> - **Backend:** Node.js + Express + Prisma (Railway)
> - **Banco de Dados:** MySQL (AlwaysData)

---

## 📋 ÍNDICE

1. [Visão Geral](#-visão-geral)
2. [Pré-requisitos](#-pré-requisitos)
3. [Fase 1: Banco de Dados (AlwaysData)](#-fase-1-banco-de-dados-alwaysdata)
4. [Fase 2: Backend (Railway)](#-fase-2-backend-railway)
5. [Fase 3: Frontend (Netlify)](#-fase-3-frontend-netlify)
6. [Fase 4: Configuração Final e Testes](#-fase-4-configuração-final-e-testes)
7. [Checklist de Produção](#-checklist-de-produção)
8. [Troubleshooting](#-troubleshooting)
9. [Comandos Úteis](#-comandos-úteis)

---

## 🎯 VISÃO GERAL

Este guia detalha o processo de deploy de uma aplicação full-stack em três plataformas diferentes:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   NETLIFY   │────────▶│   RAILWAY   │────────▶│ ALWAYSDATA  │
│  (Frontend) │   API   │  (Backend)  │   SQL   │  (Database) │
│ React/Vite  │ Requests│   Express   │ Queries │    MySQL    │
└─────────────┘         └─────────────┘         └─────────────┘
```

**Fluxo de dados:**
1. Usuário acessa o site no Netlify (frontend)
2. Frontend faz requisições HTTP para a API no Railway (backend)
3. Backend se conecta ao banco de dados MySQL no AlwaysData
4. Dados retornam para o frontend e são exibidos ao usuário

---

## ✅ PRÉ-REQUISITOS

Antes de começar, você precisa ter:

### Contas criadas
- [ ] Conta no [Netlify](https://www.netlify.com/) (gratuita)
- [ ] Conta no [Railway](https://railway.app/) (gratuita com $5 de crédito/mês)
- [ ] Conta no [AlwaysData](https://www.alwaysdata.com/) (gratuita até 100MB)
- [ ] Repositório GitHub com o código do projeto

### Ferramentas locais
- [ ] Node.js 20+ instalado
- [ ] Git instalado
- [ ] npm ou yarn instalado
- [ ] Acesso ao terminal/linha de comando

### Informações necessárias
- [ ] Credenciais do banco de dados AlwaysData
- [ ] Acesso ao repositório GitHub
- [ ] Chave secreta para JWT (gerar com `openssl rand -base64 32`)

---

## 🗄️ FASE 1: BANCO DE DADOS (ALWAYSDATA)

### 1.1. Configurar Banco de Dados no AlwaysData

1. **Acesse o painel do AlwaysData**
   - Faça login em https://admin.alwaysdata.com/

2. **Crie/Verifique o banco MySQL**
   - Vá em: **Databases** > **MySQL**
   - Clique em **+ Install a database** (se ainda não tiver)
   - Anote as seguintes informações:

   ```
   Host: mysql-facerec.alwaysdata.net
   Port: 3306
   Database: facerec_1
   User: facerec
   Password: [SUA_SENHA]
   ```

3. **Monte a connection string**
   
   Formato geral:
   ```
   mysql://USUARIO:SENHA@HOST:PORTA/NOME_BD
   ```
   
   Para o FaceRec:
   ```
   DATABASE_URL="mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1"
   ```

### 1.2. Verificar Schema do Banco

Você tem duas opções:

**Opção A: Usar Prisma para criar as tabelas (Recomendado)**

1. Configure o arquivo `backend/prisma/schema.prisma` (já configurado)
2. Crie um arquivo `.env` temporário no diretório `backend/`:
   ```bash
   DATABASE_URL="mysql://facerec:SUA_SENHA@mysql-facerec.alwaysdata.net:3306/facerec_1"
   ```
3. Execute as migrações:
   ```bash
   cd backend
   npx prisma db push
   ```

**Opção B: Importar SQL manualmente**

1. Acesse o phpMyAdmin no AlwaysData
2. Selecione seu banco de dados
3. Importe o arquivo SQL com a estrutura das tabelas

### 1.3. Verificar Conexões Externas

1. No painel do AlwaysData, vá em **Advanced** > **Firewall**
2. Certifique-se de que conexões externas estão permitidas
3. Railway usa IPs dinâmicos, então liberar todas as conexões é necessário

> ⚠️ **IMPORTANTE:** Nunca commite o arquivo `.env` com credenciais reais!

---

## 🖥️ FASE 2: BACKEND (RAILWAY)

### 2.1. Criar Projeto no Railway

1. **Acesse Railway**
   - Faça login em https://railway.app/
   - Clique em **New Project**

2. **Conectar ao GitHub**
   - Selecione **Deploy from GitHub repo**
   - Autorize o Railway a acessar seu repositório
   - Selecione o repositório `FaceRec`

3. **Configurar serviço**
   - Railway detectará automaticamente seu projeto Node.js
   - Clique no serviço criado

### 2.2. Configurar Variáveis de Ambiente

1. **Acesse a aba Variables**
   - No dashboard do serviço, clique em **Variables**

2. **Adicione as seguintes variáveis:**

   ```bash
   # Banco de dados
   DATABASE_URL=mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1

   # JWT (GERAR UMA NOVA!)
   JWT_SECRET=sua_chave_secreta_super_segura_aqui
   JWT_EXPIRES_IN=24h

   # CORS - Adicionar URL do Netlify depois do deploy
   CORS_ORIGINS=https://seu-site.netlify.app

   # Admin padrão (ALTERAR EM PRODUÇÃO!)
   DEFAULT_ADMIN_LOGIN=@administrador
   DEFAULT_ADMIN_PASSWORD=SUA_SENHA_SEGURA
   DEFAULT_ADMIN_ID=predefined-admin
   DEFAULT_ADMIN_NAME=Administrador do Sistema

   # Node
   NODE_ENV=production
   ```

   > 🔑 **Gerar JWT_SECRET seguro:**
   > ```bash
   > openssl rand -base64 32
   > ```

3. **Variável PORT**
   - ❗ **NÃO configure a variável PORT**
   - O Railway injeta automaticamente

### 2.3. Configurar Build e Start

O Railway usará os arquivos de configuração do projeto:

**Arquivo `railway.json` (já criado):**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install --production=false && npx prisma generate"
  },
  "deploy": {
    "startCommand": "cd backend && node src/server.js"
  }
}
```

**OU configurar manualmente no painel:**

1. Vá em **Settings**
2. Em **Build Command**, adicione:
   ```bash
   cd backend && npm install --production=false && npx prisma generate
   ```
3. Em **Start Command**, adicione:
   ```bash
   cd backend && node src/server.js
   ```

### 2.4. Fazer Deploy

1. **Trigger deploy**
   - Clique em **Deploy** no canto superior direito
   - Ou faça push para a branch principal (auto-deploy)

2. **Acompanhar logs**
   - Vá em **Deployments** > Último deploy
   - Clique para ver os logs em tempo real
   - Aguarde mensagem: `✅ Banco de dados conectado com sucesso!`

3. **Anotar URL pública**
   - Após deploy bem-sucedido, clique em **Settings**
   - Em **Networking**, você verá uma URL como:
     ```
     https://facerec-backend-production.up.railway.app
     ```
   - **ANOTE ESTA URL** - você precisará para configurar o frontend!

### 2.5. Testar Backend

1. **Teste de saúde**
   ```bash
   curl https://sua-url.up.railway.app/health
   ```
   
   Resposta esperada:
   ```json
   {"ok":true,"ts":"2025-11-15T...", "port":3001}
   ```

2. **Teste de login (opcional)**
   ```bash
   curl -X POST https://sua-url.up.railway.app/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"@administrador","password":"SUA_SENHA"}'
   ```

---

## 🌐 FASE 3: FRONTEND (NETLIFY)

### 3.1. Criar Site no Netlify

1. **Acesse Netlify**
   - Faça login em https://www.netlify.com/
   - Clique em **Add new site** > **Import an existing project**

2. **Conectar ao GitHub**
   - Selecione **GitHub**
   - Autorize o Netlify
   - Selecione o repositório `FaceRec`

3. **Configurar Build Settings**

   O Netlify usará o arquivo `netlify.toml` (já criado):
   
   ```toml
   [build]
     command = "cd frontend && npm install && npm run build"
     publish = "frontend/dist"
     base = "/"
   
   [build.environment]
     NODE_VERSION = "20"
   ```

   **OU configurar manualmente:**
   - **Base directory:** (deixe vazio)
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/dist`

4. **Fazer primeiro deploy**
   - Clique em **Deploy site**
   - Aguarde o build finalizar (pode levar 2-5 minutos)

### 3.2. Configurar Variáveis de Ambiente

1. **Acesse configurações do site**
   - No dashboard do site, vá em **Site settings**
   - Clique em **Environment variables**

2. **Adicionar variáveis:**
   
   ```bash
   # URL do backend no Railway (SUBSTITUIR PELA SUA!)
   VITE_API_URL=https://facerec-backend-production.up.railway.app/api

   # Base URLs
   VITE_CAM_BASE=https://facerec-backend-production.up.railway.app
   VITE_SOCKET_BASE=https://facerec-backend-production.up.railway.app

   # Configurações específicas (ajustar se necessário)
   VITE_CLASSROOM_CODE=3AT.I
   VITE_CAM_STREAM_URL=http://localhost:8080/stream
   ```

3. **Salvar e redesenhar**
   - Clique em **Save**
   - Vá em **Deploys** > **Trigger deploy** > **Clear cache and deploy site**

### 3.3. Configurar Domínio Customizado (Opcional)

1. **Acesse Domain settings**
   - Vá em **Domain management**
   
2. **Opção A: Usar domínio do Netlify**
   - URL padrão: `https://seu-site-123456.netlify.app`
   - Clique em **Options** > **Edit site name**
   - Escolha um nome: `facerec.netlify.app`

3. **Opção B: Usar domínio próprio**
   - Clique em **Add custom domain**
   - Digite seu domínio: `www.seudominio.com`
   - Siga as instruções para configurar DNS

### 3.4. Verificar Deploy

1. **Acesse o site**
   - Clique na URL do site no dashboard
   - Deve abrir a página inicial do FaceRec

2. **Testar funcionalidades**
   - Login funciona?
   - Dados são carregados?
   - Abra o console do navegador (F12) e verifique se não há erros

---

## 🔗 FASE 4: CONFIGURAÇÃO FINAL E TESTES

### 4.1. Atualizar CORS no Backend

Agora que você tem a URL do Netlify, precisa adicionar ao CORS:

1. **Volte ao Railway**
   - Acesse seu projeto no Railway
   - Clique em **Variables**

2. **Atualizar CORS_ORIGINS**
   ```bash
   CORS_ORIGINS=https://facerec.netlify.app,https://seudominio.com
   ```
   
   > Se tiver múltiplos domínios, separe por vírgula (sem espaços)

3. **Redesenhar**
   - Railway fará redeploy automaticamente
   - Aguarde o redeploy finalizar

### 4.2. Testar Fluxo Completo

**Teste 1: Login**
1. Acesse seu site no Netlify
2. Tente fazer login com credenciais do admin
3. Verifique se o token é gerado e salvo

**Teste 2: Carregar dados**
1. Após login, navegue para salas/alunos
2. Verifique se os dados são carregados do banco
3. Tente criar/editar/deletar registros

**Teste 3: CORS**
1. Abra o console do navegador (F12)
2. Vá em **Network**
3. Faça uma requisição (ex: carregar salas)
4. Verifique se não há erros de CORS

**Teste 4: WebSocket (se aplicável)**
1. Teste funcionalidades em tempo real
2. Verifique conexão Socket.IO nos logs

### 4.3. Configurar Redirects para SPA

O arquivo `netlify.toml` já inclui:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Isso garante que todas as rotas do React Router funcionem corretamente.

**Verificar:**
1. Navegue para uma rota interna (ex: `/dashboard`)
2. Dê refresh (F5)
3. A página deve carregar corretamente (não dar 404)

---

## ✅ CHECKLIST DE PRODUÇÃO

### Banco de Dados (AlwaysData)
- [ ] Banco de dados criado e acessível
- [ ] Tabelas criadas via Prisma ou SQL
- [ ] Conexões externas permitidas no firewall
- [ ] Backup configurado (recomendado)

### Backend (Railway)
- [ ] Variável `DATABASE_URL` configurada
- [ ] Variável `JWT_SECRET` gerada e configurada (única e segura!)
- [ ] Variável `CORS_ORIGINS` com URL do Netlify
- [ ] Senha do `DEFAULT_ADMIN_PASSWORD` alterada
- [ ] Build e deploy bem-sucedidos
- [ ] Logs não mostram erros de conexão com DB
- [ ] Endpoint `/health` respondendo 200 OK
- [ ] Endpoint `/api/login` funcionando

### Frontend (Netlify)
- [ ] Variável `VITE_API_URL` aponta para Railway
- [ ] Build e deploy bem-sucedidos
- [ ] Redirects para SPA configurados
- [ ] Site abre sem erros 404
- [ ] Console do navegador sem erros de CORS
- [ ] Login funcionando
- [ ] Dados sendo carregados do backend

### Segurança
- [ ] Arquivo `.env` no `.gitignore`
- [ ] `JWT_SECRET` forte (32+ caracteres aleatórios)
- [ ] Senhas padrão alteradas
- [ ] CORS configurado apenas com domínios autorizados
- [ ] HTTPS habilitado (Netlify e Railway fazem automaticamente)
- [ ] Credenciais não commitadas no repositório

### Monitoramento
- [ ] Logs do Railway sem erros críticos
- [ ] Netlify Analytics configurado (opcional)
- [ ] Alertas de uptime configurados (opcional)

---

## 🔧 TROUBLESHOOTING

### Problema: CORS Error no Frontend

**Sintoma:**
```
Access to fetch at 'https://...railway.app/api/...' from origin 'https://...netlify.app' 
has been blocked by CORS policy
```

**Solução:**
1. Verifique se `CORS_ORIGINS` no Railway contém a URL exata do Netlify
2. Não inclua trailing slash: ✅ `https://site.netlify.app` ❌ `https://site.netlify.app/`
3. Verifique se o backend foi redesenhado após alterar variáveis
4. Teste com `curl` para verificar headers CORS:
   ```bash
   curl -I -X OPTIONS https://seu-backend.up.railway.app/api/login \
     -H "Origin: https://seu-site.netlify.app"
   ```

### Problema: 500 Internal Server Error

**Sintoma:**
Backend retorna erro 500 nas requisições

**Diagnóstico:**
1. **Verifique logs no Railway:**
   - Dashboard > Deployments > Clique no deploy > View Logs
   - Procure por stack traces de erro

2. **Erros comuns:**
   
   **a) Erro de conexão com banco:**
   ```
   ER_ACCESS_DENIED_ERROR: Access denied for user 'facerec'@'...'
   ```
   - Verifique `DATABASE_URL` no Railway
   - Confirme credenciais no AlwaysData
   - Teste conexão local com a mesma string

   **b) Prisma não gerado:**
   ```
   Error: @prisma/client did not initialize yet
   ```
   - Adicione ao build command: `npx prisma generate`
   - Redesenhar no Railway

   **c) JWT_SECRET ausente:**
   ```
   JWT_SECRET não definido
   ```
   - Configure variável `JWT_SECRET` no Railway

### Problema: Frontend não conecta ao Backend

**Sintoma:**
Requisições falham com erro de rede

**Soluções:**
1. **Verificar `VITE_API_URL`:**
   - Deve terminar com `/api` (sem trailing slash extra)
   - Exemplo correto: `https://backend.railway.app/api`

2. **Verificar URL do Railway:**
   - A URL pode mudar após redesenhar
   - Acesse Railway > Settings > Networking
   - Copie a URL exata

3. **Redesenhar o Netlify:**
   - Após alterar `VITE_API_URL`, faça novo deploy
   - Netlify > Deploys > Trigger deploy

4. **Testar backend diretamente:**
   ```bash
   curl https://seu-backend.up.railway.app/health
   ```

### Problema: Rota retorna 404 após refresh

**Sintoma:**
Ao dar F5 numa rota interna (ex: `/dashboard`), retorna 404

**Solução:**
1. Verifique se `netlify.toml` existe e contém:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Alternativamente, crie arquivo `public/_redirects`:
   ```
   /*  /index.html  200
   ```

3. Redesenhar no Netlify

### Problema: Build falha no Netlify

**Sintoma:**
```
Command failed with exit code 1: cd frontend && npm install && npm run build
```

**Soluções:**
1. **Verificar Node version:**
   - Certifique-se de usar Node 20:
   ```toml
   [build.environment]
     NODE_VERSION = "20"
   ```

2. **Limpar cache e redesenhar:**
   - Netlify > Deploys > Trigger deploy > Clear cache and deploy site

3. **Verificar erros de build localmente:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

### Problema: Dados não aparecem após login

**Sintoma:**
Login funciona, mas lista de salas/alunos está vazia

**Diagnóstico:**
1. **Verificar banco de dados:**
   - Acesse phpMyAdmin no AlwaysData
   - Execute: `SELECT * FROM users;`
   - Execute: `SELECT * FROM classrooms;`
   - Confirme que há dados

2. **Verificar ownership:**
   - O sistema usa `owner_user_id` para filtrar dados
   - Verifique se os registros têm `owner_user_id` correto:
     ```sql
     SELECT id, name, owner_user_id FROM classrooms;
     ```

3. **Verificar logs do backend:**
   - Procure por queries SQL nos logs
   - Verifique se há erros de permissão

4. **Testar endpoint diretamente:**
   ```bash
   # Fazer login e pegar o token
   TOKEN=$(curl -X POST https://backend.railway.app/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"@administrador","password":"SENHA"}' \
     | jq -r '.token')

   # Usar token para listar salas
   curl https://backend.railway.app/api/classrooms \
     -H "Authorization: Bearer $TOKEN"
   ```

### Problema: Railway fora do ar ou timeout

**Sintoma:**
```
503 Service Unavailable
```

**Soluções:**
1. **Verificar status do Railway:**
   - Acesse https://railway.app/status

2. **Verificar deploy ativo:**
   - Railway > Deployments
   - Deve haver um deploy com status "Active"

3. **Verificar logs de crash:**
   - Se o serviço está crashando, veja os logs
   - Procure por `process.exit(1)` ou erros não tratados

4. **Restart manual:**
   - Railway > Service > Settings > Restart

### Problema: Variáveis de ambiente não aplicadas

**Sintoma:**
Backend ou frontend usa valores padrão em vez das variáveis configuradas

**Solução:**
1. **Variáveis no Railway:**
   - Após adicionar/editar, o Railway **não redesenhar automaticamente**
   - Você precisa fazer redeploy manual:
     - Clique em "Redeploy" OU
     - Faça um commit vazio: `git commit --allow-empty -m "trigger deploy"`

2. **Variáveis no Netlify:**
   - Após adicionar/editar variáveis, **sempre redesenhar**:
     - Netlify > Deploys > Trigger deploy > Clear cache and deploy site

3. **Verificar escopo das variáveis:**
   - Railway: Variáveis são por service
   - Netlify: Variáveis são por site

---

## 📚 COMANDOS ÚTEIS

### Banco de Dados (Local)

```bash
# Testar conexão com AlwaysData
cd backend
echo 'DATABASE_URL="mysql://user:pass@host:3306/db"' > .env
npx prisma db pull

# Criar/Atualizar schema no banco
npx prisma db push

# Abrir Prisma Studio (interface gráfica)
npx prisma studio

# Gerar Prisma Client
npx prisma generate
```

### Backend (Local)

```bash
# Instalar dependências
cd backend
npm install

# Rodar em desenvolvimento
npm run dev

# Rodar em produção (simular Railway)
DATABASE_URL="mysql://..." \
JWT_SECRET="test" \
PORT=3001 \
node src/server.js

# Testar endpoint
curl http://localhost:3001/health
```

### Frontend (Local)

```bash
# Instalar dependências
cd frontend
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção (simular Netlify)
npm run build

# Preview do build
npm run preview
```

### Git

```bash
# Fazer commit e push (trigger deploy)
git add .
git commit -m "Deploy: atualizar configurações"
git push origin main

# Commit vazio para forçar redeploy
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### Testes de API

```bash
# Health check
curl https://backend.railway.app/health

# Login
curl -X POST https://backend.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"@administrador","password":"senha"}'

# Listar salas (requer token)
curl https://backend.railway.app/api/classrooms \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Testar CORS
curl -I -X OPTIONS https://backend.railway.app/api/login \
  -H "Origin: https://frontend.netlify.app" \
  -H "Access-Control-Request-Method: POST"
```

### Gerar JWT_SECRET

```bash
# Gerar chave segura de 32 bytes em base64
openssl rand -base64 32

# Ou use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📖 RECURSOS ADICIONAIS

### Documentação Oficial

- **Netlify:** https://docs.netlify.com/
- **Railway:** https://docs.railway.app/
- **AlwaysData:** https://help.alwaysdata.com/
- **Prisma:** https://www.prisma.io/docs/
- **Vite:** https://vitejs.dev/guide/

### Comunidade e Suporte

- **Netlify Community:** https://answers.netlify.com/
- **Railway Discord:** https://discord.gg/railway
- **Stack Overflow:** Use tags `netlify`, `railway`, `prisma`

### Monitoramento e Analytics

- **Netlify Analytics:** Dashboard > Analytics
- **Railway Metrics:** Dashboard > Metrics
- **Sentry (Erro Tracking):** https://sentry.io/ (opcional)
- **LogTail (Logs):** https://logtail.com/ (opcional)

---

## 🎉 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. **Configurar domínio personalizado**
   - Registrar domínio (ex: Namecheap, Google Domains)
   - Configurar DNS no Netlify

2. **Configurar CI/CD**
   - Auto-deploy no push para main (já configurado)
   - Deploy previews para PRs

3. **Adicionar monitoramento**
   - Configurar alertas de uptime
   - Implementar error tracking (Sentry)

4. **Otimizações**
   - Configurar CDN (Netlify já tem)
   - Adicionar cache de API (Redis - Railway addon)
   - Implementar rate limiting

5. **Backups**
   - Configurar backups automáticos do banco (AlwaysData)
   - Exportar schema do Prisma regularmente

---

## 📝 NOTAS FINAIS

- **Custos:**
  - Netlify: Gratuito (100GB/mês)
  - Railway: $5 de crédito/mês grátis (~500h de execução)
  - AlwaysData: Gratuito até 100MB

- **Limites:**
  - Netlify: 300 minutos de build/mês (plano grátis)
  - Railway: $5/mês de uso (depois dos créditos)
  - AlwaysData: 100MB de storage (upgrade disponível)

- **Performance:**
  - Cold start no Railway: ~1-2s (primeira requisição)
  - Cache do Netlify: CDN global
  - Latência do banco: Depende da localização do AlwaysData

- **Escalabilidade:**
  - Para produção pesada, considere:
    - Railway Pro ($20/mês) ou AWS
    - Banco dedicado (não shared hosting)
    - CDN adicional para assets

---

**✅ Deploy concluído!** Seu sistema FaceRec agora está em produção com frontend no Netlify, backend no Railway e banco no AlwaysData.

Para dúvidas ou problemas não cobertos aqui, abra uma issue no GitHub ou consulte a documentação das plataformas.

**Autor:** Guia gerado para o projeto FaceRec  
**Data:** Novembro 2025  
**Versão:** 1.0
