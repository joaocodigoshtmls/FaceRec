# Configuração do Vercel para FaceRec

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis de ambiente no Vercel (Project Settings → Environment Variables):

### Para Produção (Production)

```
VITE_API_BASE=https://facerec.alwaysdata.net/api
VITE_CAM_BASE=https://facerec.alwaysdata.net
VITE_SOCKET_BASE=https://facerec.alwaysdata.net
```

**Nota:** Substitua `https://facerec.alwaysdata.net` pela URL real do seu backend em produção.

### Para Preview (Deployments de teste)

```
VITE_API_BASE=https://facerec.alwaysdata.net/api
VITE_CAM_BASE=https://facerec.alwaysdata.net
VITE_SOCKET_BASE=https://facerec.alwaysdata.net
```

## Passo a Passo

1. Acesse seu projeto no Vercel
2. Vá para **Settings** → **Environment Variables**
3. Clique em **Add New**
4. Preencha:
   - **Name:** `VITE_API_BASE`
   - **Value:** `https://facerec.alwaysdata.net/api` (ou sua URL de produção)
   - **Environments:** Selecione **Production** e **Preview**
5. Repita para as outras variáveis
6. Faça redeploy do seu projeto

## Como o Frontend Usa Essas Variáveis

No arquivo `frontend/lib/api.js`:

```javascript
const baseURL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE || '/api'  // Usa VITE_API_BASE em produção
  : import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';  // Em dev
```

## Testando Localmente

Para testar com a URL do backend remoto:

```bash
cd frontend
VITE_API_BASE=https://facerec.alwaysdata.net/api npm run dev
```

## Endpoints de Exemplo

Após configurar corretamente, as chamadas de API funcionarão assim:

- `POST /login` → `https://facerec.alwaysdata.net/api/login`
- `POST /signup` → `https://facerec.alwaysdata.net/api/signup`
- `POST /import` → `https://facerec.alwaysdata.net/api/import`
- `GET /uploads/...` → `https://facerec.alwaysdata.net/uploads/...`
