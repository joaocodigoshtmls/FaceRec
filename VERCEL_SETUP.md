# Configuração do Vercel para FaceRec

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis de ambiente **diretamente** no Vercel (Project Settings → Environment Variables):

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

## Passo a Passo no Vercel

1. Acesse seu projeto no Vercel
2. Vá para **Settings** → **Environment Variables**
3. Clique em **Add New**
4. Para cada variável, preencha:
   - **Name:** (ex: `VITE_API_BASE`)
   - **Value:** (ex: `https://facerec.alwaysdata.net/api`)
   - **Environments:** Selecione **Production** E **Preview**
5. Após adicionar todas, clique em **Save**
6. Vá para **Deployments** e clique em **Redeploy** no deployment mais recente
7. O build deve passar agora

## ⚠️ IMPORTANTE: Não use "@" para Secrets

O arquivo `vercel.json` **NÃO** deve ter:
```json
"env": {
  "VITE_API_BASE": "@vite_api_base"  // ❌ ERRADO
}
```

Isso causa erro: `Environment Variable "VITE_API_BASE" references Secret "vite_api_base", which does not exist.`

Use apenas o `vercel.json` simples sem `env`, e adicione as variáveis direto no painel do Vercel.

## Como o Frontend Usa Essas Variáveis

No arquivo `frontend/lib/api.js`:

```javascript
const baseURL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE || '/api'  // Usa VITE_API_BASE em produção
  : import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';  // Em dev
```

Se `VITE_API_BASE` não estiver definido em produção, usará `/api` como fallback (que não funcionará sem rewrite).

## Testando Localmente

Para testar com a URL do backend remoto:

```bash
cd frontend
VITE_API_BASE=https://seu-backend.com/api npm run dev
```

## Endpoints de Exemplo

Após configurar corretamente, as chamadas de API funcionarão assim:

- `POST /login` → `https://facerec.alwaysdata.net/api/login`
- `POST /signup` → `https://facerec.alwaysdata.net/api/signup`
- `POST /import` → `https://facerec.alwaysdata.net/api/import`
- `GET /uploads/...` → `https://facerec.alwaysdata.net/uploads/...`

## Troubleshooting

### Build falha dizendo "dist" não foi encontrado
- Certifique-se de que `npm install` funcionou
- Verifique se há erros na aba **Build Logs**

### APIs retornam 404
- Adicione as variáveis `VITE_API_BASE`, `VITE_CAM_BASE`, `VITE_SOCKET_BASE` no Vercel
- Certifique-se de que a URL do backend está correta e acessível

### CORS errors
- O backend deve ter CORS habilitado para `https://seu-dominio-vercel.app`
- Verifique o arquivo de configuração CORS do backend
