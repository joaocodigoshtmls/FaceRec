# 🔐 GUIA DE CONFIGURAÇÃO DE CORS

## 📋 O que é CORS?

CORS (Cross-Origin Resource Sharing) é um mecanismo de segurança que controla quais domínios podem acessar sua API.

**Cenário do FaceRec:**
- **Frontend (Netlify):** `https://facerec.netlify.app`
- **Backend (Railway):** `https://facerec-backend.railway.app`
- **Problema:** Por padrão, browsers bloqueiam requisições entre domínios diferentes

---

## ⚙️ Como Funciona no FaceRec

O backend (Express) usa a biblioteca `cors` para permitir requisições do frontend:

```javascript
// backend/src/server.js (linhas 256-294)

const parseOrigins = (val) => String(val || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const envOrigins = parseOrigins(process.env.CORS_ORIGINS);
const defaultOrigins = [
  'http://localhost:5173',   // Desenvolvimento local
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// Permite também domínios *.vercel.app e *.alwaysdata.net
const regexOrigins = [
  /https?:\/\/([a-z0-9-]+)\.vercel\.app$/i,
  /https?:\/\/([a-z0-9-]+)\.alwaysdata\.net$/i,
  /https?:\/\/([a-z0-9-]+)\.netlify\.app$/i,
];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // requests server-to-server
  if (envOrigins.includes(origin)) return true;
  if (defaultOrigins.includes(origin)) return true;
  return regexOrigins.some((re) => re.test(origin));
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept'],
  exposedHeaders: ['Content-Length']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
```

---

## 🔧 Configuração em Produção

### 1. Obter URL do Frontend (Netlify)

Após fazer deploy no Netlify:

1. Acesse o dashboard do seu site
2. Copie a URL (ex: `https://facerec.netlify.app`)
3. **NÃO inclua trailing slash:** ✅ `https://site.netlify.app` ❌ `https://site.netlify.app/`

### 2. Configurar CORS_ORIGINS no Railway

1. **Acesse Railway:**
   - Login → Seu projeto → Clique no serviço

2. **Adicione/Edite variável:**
   - Clique em **Variables**
   - Encontre ou crie `CORS_ORIGINS`
   - Valor: `https://facerec.netlify.app`

3. **Múltiplos domínios (opcional):**
   ```bash
   CORS_ORIGINS=https://facerec.netlify.app,https://meudominio.com,https://app.meudominio.com
   ```
   
   > **Importante:** Separe por vírgula **sem espaços**

4. **Redesenhar:**
   - Railway redesenhará automaticamente
   - Aguarde o deploy finalizar (~2 minutos)

---

## 🧪 Testar CORS

### Teste 1: Preflight (OPTIONS)

```bash
curl -I -X OPTIONS https://seu-backend.railway.app/api/login \
  -H "Origin: https://seu-site.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

**Resposta esperada:**
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://seu-site.netlify.app
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept
Access-Control-Allow-Credentials: true
```

### Teste 2: Requisição Real (POST)

```bash
curl -X POST https://seu-backend.railway.app/api/login \
  -H "Origin: https://seu-site.netlify.app" \
  -H "Content-Type: application/json" \
  -d '{"email":"@administrador","password":"senha"}' \
  -i
```

**Verifique no response:**
```
Access-Control-Allow-Origin: https://seu-site.netlify.app
```

### Teste 3: No Frontend

Abra o console do navegador (F12) no seu site Netlify:

```javascript
// Teste manual no console
fetch('https://seu-backend.railway.app/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ CORS OK:', data))
  .catch(err => console.error('❌ CORS Error:', err));
```

---

## 🚨 Problemas Comuns

### Erro: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa:** Backend não reconheceu o origin do frontend

**Soluções:**

1. **Verificar URL exata:**
   ```bash
   # No frontend (Netlify), abra console e execute:
   console.log(window.location.origin)
   ```
   
   Use essa URL **exata** no `CORS_ORIGINS` do Railway

2. **Verificar se redesenhou:**
   - Railway > Deployments
   - Deve haver deploy **depois** de adicionar CORS_ORIGINS
   - Se não, faça redeploy manual

3. **Verificar formato:**
   ```bash
   # ✅ Correto
   CORS_ORIGINS=https://site.netlify.app

   # ❌ Errado (com trailing slash)
   CORS_ORIGINS=https://site.netlify.app/

   # ❌ Errado (com espaços)
   CORS_ORIGINS=https://site1.netlify.app, https://site2.netlify.app

   # ✅ Correto (múltiplos)
   CORS_ORIGINS=https://site1.netlify.app,https://site2.netlify.app
   ```

### Erro: "CORS policy: Credentials flag is 'true', but 'Access-Control-Allow-Credentials' is missing"

**Causa:** Frontend está enviando cookies/credenciais, mas backend não configurou `credentials: true`

**Solução:**
- O código já tem `credentials: true` em `corsOptions`
- Verifique se o frontend está usando `credentials: 'include'` no fetch:
  
  ```javascript
  fetch('https://api.com/endpoint', {
    credentials: 'include', // Se necessário
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  ```

### Erro: "Not allowed by CORS" mesmo com CORS_ORIGINS configurado

**Causa:** Origin não está sendo reconhecido pela regex ou lista

**Diagnóstico:**

1. **Verificar logs do Railway:**
   - Deployments > View logs
   - Procure por: `Not allowed by CORS`
   - O log mostrará qual origin foi rejeitado

2. **Adicionar log temporário:**
   ```javascript
   const isOriginAllowed = (origin) => {
     console.log('🔍 Checking origin:', origin);
     // ... resto do código
   };
   ```

**Solução:**
- Certifique-se de que o domínio está exatamente como `window.location.origin` no frontend
- Se usar domínio customizado, adicione ao `CORS_ORIGINS`

---

## 🎯 Boas Práticas

### ✅ FAZER

1. **Especificar origins exatas:**
   ```bash
   CORS_ORIGINS=https://facerec.netlify.app,https://www.meudominio.com
   ```

2. **Usar HTTPS em produção:**
   - Netlify e Railway já fornecem SSL automaticamente

3. **Separar ambientes:**
   ```bash
   # Desenvolvimento
   CORS_ORIGINS=http://localhost:5173

   # Produção
   CORS_ORIGINS=https://facerec.netlify.app
   ```

4. **Incluir domínio customizado:**
   ```bash
   CORS_ORIGINS=https://facerec.netlify.app,https://app.facerec.com
   ```

### ❌ EVITAR

1. **NUNCA use `*` em produção:**
   ```javascript
   // ❌ INSEGURO!
   app.use(cors({ origin: '*' }));
   ```

2. **Não inclua subpaths:**
   ```bash
   # ❌ Errado
   CORS_ORIGINS=https://site.netlify.app/admin

   # ✅ Correto
   CORS_ORIGINS=https://site.netlify.app
   ```

3. **Não misture http e https:**
   ```bash
   # ❌ Inconsistente
   CORS_ORIGINS=http://site.netlify.app

   # ✅ Use HTTPS
   CORS_ORIGINS=https://site.netlify.app
   ```

---

## 🔍 Debug Avançado

### Verificar Headers CORS no Browser

1. Abra DevTools (F12)
2. Vá em **Network**
3. Faça uma requisição para a API
4. Clique na requisição
5. Vá em **Headers**
6. Procure por:
   - **Request Headers:**
     - `Origin: https://...`
   - **Response Headers:**
     - `Access-Control-Allow-Origin: https://...`
     - `Access-Control-Allow-Credentials: true`

### Script de Teste Completo

```bash
#!/bin/bash
# test-cors.sh

BACKEND="https://seu-backend.railway.app"
FRONTEND="https://seu-site.netlify.app"

echo "🧪 Testando CORS..."

echo "\n1️⃣ Preflight (OPTIONS):"
curl -s -X OPTIONS "$BACKEND/api/login" \
  -H "Origin: $FRONTEND" \
  -H "Access-Control-Request-Method: POST" \
  -i | grep -i "access-control"

echo "\n2️⃣ Requisição real (POST):"
curl -s -X POST "$BACKEND/api/login" \
  -H "Origin: $FRONTEND" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' \
  -i | grep -i "access-control"

echo "\n✅ Se viu 'Access-Control-Allow-Origin' nas respostas, CORS está OK!"
```

---

## 📚 Referências

- **MDN - CORS:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Express CORS:** https://expressjs.com/en/resources/middleware/cors.html
- **Railway Docs:** https://docs.railway.app/

---

## 💡 Dicas Finais

1. **Desenvolvimento local:**
   - Não precisa configurar CORS_ORIGINS
   - `defaultOrigins` já inclui `localhost:5173`

2. **Deploy preview no Netlify:**
   - URLs de preview têm formato: `deploy-preview-123--site.netlify.app`
   - Considere adicionar regex para permitir todos os previews:
     ```javascript
     /https?:\/\/deploy-preview-\d+--([a-z0-9-]+)\.netlify\.app$/i
     ```

3. **Múltiplos frontends:**
   - Se tiver admin e app separados, adicione ambos ao CORS_ORIGINS

4. **Monitoramento:**
   - Configure alertas para erros de CORS (Sentry, LogRocket, etc)

---

**✅ CORS configurado!** Seu frontend pode se comunicar com o backend sem restrições de origem.

Para mais detalhes sobre o deploy completo, veja [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md)
