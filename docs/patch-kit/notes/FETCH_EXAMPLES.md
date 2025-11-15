# 🌐 Exemplos de Fetch - Vercel Frontend + AlwaysData Backend

---

## 📋 CENÁRIOS

### 1. **Desenvolvimento Local** (Frontend + Backend no localhost)
### 2. **Frontend em Vercel, Backend em AlwaysData**
### 3. **Frontend e Backend em localhost, Backend remoto**

---

## 🏠 CENÁRIO 1: Desenvolvimento Local

**Setup**:
- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:3000` (Express local ou Vercel CLI)

**Arquivo: `frontend/.env.local`**
```bash
VITE_API_URL="http://localhost:3000/api"
```

**Arquivo: `frontend/lib/authApi.js`**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

export async function register(data) {
  try {
    const response = await api.post('/auth/register', data);
    
    if (response.status === 201) {
      localStorage.setItem('authToken', response.data.token);
      return { success: true, user: response.data.user };
    }
  } catch (error) {
    // Tratamento de erros...
  }
}
```

**Teste**:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Teste
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@local.com","password":"SenhaSegura123!"}'
```

---

## 🚀 CENÁRIO 2: Frontend Vercel + Backend AlwaysData

**Setup**:
- Frontend: `https://seu-projeto.vercel.app` (Vercel)
- Backend: `https://seu-backend.alwaysdata.com` (AlwaysData Node.js)

### 🔹 Passo 1: Configurar Backend AlwaysData

**AlwaysData Dashboard**:
1. Acesse [console.alwaysdata.com](https://console.alwaysdata.com)
2. Crie um novo "Site" Node.js
3. Obtenha a URL: `https://seu-backend.alwaysdata.com`
4. Deploy do backend:
   ```bash
   git push alwaysdata main
   # ou use upload SFTP
   ```

### 🔹 Passo 2: Configurar Variáveis Vercel

**Vercel Dashboard** → Settings → Environment Variables:
```
VITE_API_URL=https://seu-backend.alwaysdata.com/api
```

**Arquivo: `frontend/.env.production`** (local)
```bash
VITE_API_URL=https://seu-backend.alwaysdata.com/api
```

### 🔹 Passo 3: Configurar CORS no Backend

**Backend: `/api/auth/register-v2.js`**

Já vem com suporte! Apenas configure `.env`:

```bash
# AlwaysData .env
CORS_ORIGINS="https://seu-projeto.vercel.app,http://localhost:5173"
```

### 🔹 Passo 4: Frontend - Usar URL Absoluta

**`frontend/lib/authApi.js`**:
```javascript
import axios from 'axios';

// Detecta automaticamente
const apiUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  withCredentials: true,  // CORS com credentials
});

export async function register(data) {
  try {
    // Se VITE_API_URL="https://seu-backend.alwaysdata.com/api"
    // Requisição será: POST https://seu-backend.alwaysdata.com/api/auth/register
    const response = await api.post('/auth/register', data);
    
    if (response.status === 201) {
      localStorage.setItem('authToken', response.data.token);
      return { success: true, user: response.data.user };
    }
  } catch (error) {
    // ...
  }
}
```

**Component React: `frontend/Components/Cadastro.jsx`**:
```jsx
import { register } from '../lib/authApi.js';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register({
      name: 'Usuário',
      email,
      password,
    });

    if (result.success) {
      alert('Cadastro realizado!');
      // Redirecionar para login
    } else {
      alert('Erro: ' + result.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
      <button disabled={loading}>{loading ? 'Enviando...' : 'Cadastrar'}</button>
    </form>
  );
}
```

### 🧪 Teste End-to-End:

```bash
# 1. Frontend em desenvolvimento apontando para backend AlwaysData
VITE_API_URL=https://seu-backend.alwaysdata.com/api npm run dev

# 2. Abrir browser em http://localhost:5173
# 3. Preencher formulário de cadastro
# 4. Verificar no console: requisição vai para https://seu-backend.alwaysdata.com/api/auth/register

# 5. Verificar resposta no DevTools Network:
# - Status: 201 (sucesso) ou 409 (email existente)
# - Headers: Access-Control-Allow-Origin: http://localhost:5173
```

---

## 🌍 CENÁRIO 3: Tudo Remoto + Desenvolvimento Local

**Setup**:
- Frontend: `https://seu-projeto.vercel.app` (prod)
- Backend: `https://seu-backend.alwaysdata.com` (prod)
- Dev Local: `http://localhost:5173` (Vite local)

### Desenvolvimento:
```bash
# .env.development
VITE_API_URL=https://seu-backend.alwaysdata.com/api

npm run dev
# Agora http://localhost:5173 aponta para backend remoto
```

### Produção:
```bash
# .env.production
VITE_API_URL=https://seu-backend.alwaysdata.com/api

npm run build
# Build pronto para Vercel
```

### Deploy Vercel:
1. Push para GitHub
2. Vercel reconhece e faz build automático
3. Variável de ambiente `VITE_API_URL` é usada no build

---

## 🔍 VERIFICAR REQUISIÇÕES

**Browser DevTools** (F12 → Network):

**Preflight (OPTIONS)**:
```
OPTIONS https://seu-backend.alwaysdata.com/api/auth/register
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type

Response Headers:
Access-Control-Allow-Origin: https://seu-projeto.vercel.app
Access-Control-Allow-Methods: POST, OPTIONS
Vary: Origin
```

**Registro (POST)**:
```
POST https://seu-backend.alwaysdata.com/api/auth/register
Content-Type: application/json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "SenhaSegura123!"
}

Response Status: 201
Response Body:
{
  "ok": true,
  "userId": "123",
  "user": {
    "id": "123",
    "email": "joao@example.com",
    "name": "João Silva"
  }
}
```

---

## 🛠️ TROUBLESHOOTING

### Erro: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa**: Backend não retornou header CORS correto

**Solução**:
1. Verificar `.env` no backend: `CORS_ORIGINS="https://seu-projeto.vercel.app"`
2. Verificar que header `Origin` está sendo enviado pelo frontend
3. Testar com curl:
   ```bash
   curl -X OPTIONS https://seu-backend.alwaysdata.com/api/auth/register \
     -H "Origin: https://seu-projeto.vercel.app" \
     -v
   ```

### Erro: "Failed to fetch: ERR_NAME_NOT_RESOLVED"

**Causa**: URL do backend está incorreta ou domínio não existe

**Solução**:
1. Verificar `VITE_API_URL` está correto
2. Testar URL no browser: `https://seu-backend.alwaysdata.com/api/auth/register`
3. Confirmar que backend está rodando em AlwaysData

### Erro: "ERR_CERT_COMMON_NAME_INVALID" (HTTPS)

**Causa**: Certificado SSL inválido no AlwaysData

**Solução**:
1. Aguardar AlwaysData propagar certificado (geralmente 24h)
2. Ou usar URL com certificado válido

### Erro: 409 (Email duplicado)

**Normal!** Email já cadastrado. Testar com email diferente.

### Erro: 422 (Validação)

**Normal!** Dados inválidos. Verificar:
- `name` ≥ 2 caracteres
- `email` em formato válido
- `password` ≥ 8 caracteres

---

## 📚 ARQUIVOS REFERÊNCIA

- Frontend authApi: `/frontend/lib/authApi-hardened.js`
- Backend handler: `/api/auth/register-v2.js`
- Testes HTTP: `/tests/register-tests-enhanced.http`
- Variáveis env: `.env.example`

---

**Status**: ✅ Pronto para produção  
**Testado**: ✓ Vercel + AlwaysData  
**Runtime**: Node.js 20.x
