# ⚠️ ARQUIVOS OBSOLETOS - PODEM SER REMOVIDOS

## MongoDB (não está mais sendo usado)

- `backend/config/db.js` - Conexão MongoDB (obsoleto)
- `backend/models/User.js` - Model Mongoose (obsoleto)

## Ação recomendada:

1. **Remover referências ao MongoDB no código**
2. **Desinstalar dependências:**

   ```bash
   npm uninstall mongoose
   ```

3. **Remover do package.json se houver**

## ✅ Banco atual: MySQL (AlwaysData)

- Usar `src/db.mjs` para conexões
- SQL schemas em `backend/sql/`
