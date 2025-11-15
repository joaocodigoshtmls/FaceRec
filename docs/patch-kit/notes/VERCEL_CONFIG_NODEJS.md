# 🔧 Configuração Node.js Runtime para bcryptjs

**Importante**: O handler de registro usa `bcryptjs` que é compatível APENAS com Node.js, não com Edge Runtime do Vercel.

---

## ⚠️ POR QUE ISTO IMPORTA?

```javascript
import bcrypt from 'bcryptjs';

// ✅ Funciona: Node.js Runtime
const hash = await bcrypt.hash('senha123', 10);

// ❌ Falha: Edge Runtime
// "ReferenceError: crypto is not defined"
```

---

## ✅ SOLUÇÃO 1: Configurar `vercel.json`

```json
{
  "functions": {
    "api/auth/register-v2.js": {
      "runtime": "nodejs20.x"
    },
    "api/signup/route.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

**Resultado**:
- `/api/auth/register` → Node.js 20.x
- `/api/signup` → Node.js 20.x
- Outras rotas → padrão (Edge ou Node.js, dependendo da config)

---

## ✅ SOLUÇÃO 2: Forçar globalmente para Node.js

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

---

## ✅ SOLUÇÃO 3: Usar arquivo `.env`

Em `vercel.json`, defina via variável (menos recomendado):

```json
{
  "functions": {
    "api/auth/register-v2.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

---

## 🧪 COMO TESTAR LOCALMENTE

```bash
# 1. Desenvolvimento (Vercel CLI com Node.js)
vercel dev

# 2. Teste POST com curl
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com",
    "password": "SenhaSegura123!"
  }'

# 3. Se receber 201, bcryptjs está funcionando ✓
```

---

## ❌ SINAIS DE ERRO - Edge Runtime

Se receber estes erros, você está em Edge Runtime:

```
❌ "ReferenceError: crypto is not defined"
❌ "Error: Module not found: crypto"
❌ "bcryptjs is not compatible with Edge Runtime"
```

**Solução**: Adicionar `runtime: nodejs20.x` em `vercel.json`

---

## 📝 PACKAGE.JSON DEPENDENCIES

Certifique-se de que `api/package.json` tem:

```json
{
  "dependencies": {
    "bcrypt": "^5.1.0",
    "mysql2": "^3.6.0",
    "dotenv": "^16.0.0"
  }
}
```

---

## 🔐 COMPARAÇÃO: Node.js vs Edge

| Aspecto | Node.js | Edge |
|--------|---------|------|
| Inicialização | ~100ms | ~10ms |
| Duração máxima | 900s | 30s |
| Memória | Mais | Menos |
| Suporte: bcryptjs | ✅ Sim | ❌ Não |
| Suporte: Node.js APIs | ✅ Sim | ❌ Não |
| Suporte: crypto | ✅ Sim | ✅ Sim (Web Crypto) |

**Conclusão**: Para autenticação com bcryptjs, usar Node.js Runtime.

---

## 🚀 DEPLOY CHECKLIST

- [ ] Arquivo `vercel.json` contém seção `functions` com Node.js runtime
- [ ] `/api/auth/register-v2.js` exporta `OPTIONS` e `POST`
- [ ] `/api/signup/route.js` re-exporta de `register-v2.js`
- [ ] `.env.production` configurado com `CORS_ORIGINS`
- [ ] `npm install` instalou `bcrypt` (não `bcryptjs`)
- [ ] Teste local com `vercel dev` retorna 201 (sucesso)
- [ ] Deploy para produção
- [ ] Teste em `https://seu-projeto.vercel.app/api/auth/register` com POST

---

## 📚 REFERÊNCIAS

- [Vercel - Function Runtime](https://vercel.com/docs/concepts/functions/runtimes)
- [Vercel - Node.js Runtime](https://vercel.com/docs/concepts/functions/runtimes/node-js)
- [bcryptjs GitHub](https://github.com/dcodeIO/bcryptjs)

---

**Status**: ✅ Pronto  
**Versão**: 2.0  
**Runtime Necessário**: Node.js 20.x (mínimo)
