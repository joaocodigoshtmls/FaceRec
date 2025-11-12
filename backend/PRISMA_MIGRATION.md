## Migração: trocar role `admin` por `supervisor`

A aplicação passou a usar o papel "supervisor" no lugar de "admin". Siga estes passos no MySQL antes de aplicar o client Prisma em produção.

1) Atualize registros existentes:

```sql
UPDATE users SET role = 'supervisor' WHERE role = 'admin';
```

2) Altere o tipo da coluna `role` para refletir o novo enum:

```sql
ALTER TABLE users MODIFY COLUMN role ENUM('supervisor','professor') NOT NULL DEFAULT 'professor';
```

3) Gere e aplique a migration do Prisma (ambiente local):

```bash
npx prisma migrate dev --name rename-admin-to-supervisor
```

Notas:
- O backend contém compatibilidade temporária: se um usuário vier com `role = 'admin'`, ele é interpretado como `supervisor` no JSON e no token, para evitar quebra até a migração.
- Endpoints de autenticação passam a emitir tokens com `role: 'supervisor'` quando apropriado.
# 🚀 Guia de Migração para Prisma ORM

## ✅ Status: Branch `feature/migrate-to-prisma` criado

---

## 📋 Checklist de Migração

### Fase 1: Setup Inicial ✅

- [x] Criar branch `feature/migrate-to-prisma`
- [x] Instalar `prisma` e `@prisma/client`
- [x] Criar `prisma/schema.prisma`
- [ ] Gerar Prisma Client
- [ ] Testar conexão

### Fase 2: Sincronizar com BD Existente

- [ ] Executar `npx prisma db pull` (introspection)
- [ ] Comparar schema gerado com schema manual
- [ ] Ajustar diferenças
- [ ] Executar `npx prisma generate`

### Fase 3: Criar Wrapper/Adaptador

- [ ] Criar `src/prisma.js` (cliente Prisma)
- [ ] Manter `src/db.mjs` (pool MySQL) temporariamente
- [ ] Criar funções helper para queries comuns

### Fase 4: Refatorar Rotas (Incremental)

- [ ] **Rotas de Students** (`/api/students/*`)
- [ ] **Rotas de Classrooms** (`/api/classrooms/*`)
- [ ] **Rotas de Attendance** (`/api/attendance/*`)
- [ ] **Rotas de Auth** (`/api/auth/*`)
- [ ] **Rotas de Users** (`/api/users/*`)

### Fase 5: Testes

- [ ] Testar CRUD de alunos
- [ ] Testar CRUD de salas
- [ ] Testar registro de presença
- [ ] Testar login/autenticação
- [ ] Testar relacionamentos

### Fase 6: Limpeza

- [ ] Remover queries SQL raw antigas
- [ ] Remover `mysql2` se não for mais necessário
- [ ] Atualizar documentação
- [ ] Commit final

### Fase 7: Merge

- [ ] Code review
- [ ] Merge para `main`
- [ ] Deploy

---

## 🔧 Comandos Úteis

### Gerar Prisma Client

```bash
cd backend
npx prisma generate
```

### Sincronizar com banco existente

```bash
npx prisma db pull
```

### Ver banco de dados visualmente

```bash
npx prisma studio
```

### Criar migration

```bash
npx prisma migrate dev --name nome_da_migration
```

### Aplicar migrations em produção

```bash
npx prisma migrate deploy
```

### Resetar banco (CUIDADO!)

```bash
npx prisma migrate reset
```

---

## 📝 Próximos Passos

1. **Aguardar instalação do npm** (em andamento)
2. **Gerar Prisma Client:**
   ```bash
   npx prisma generate
   ```
3. **Testar schema:**
   ```bash
   npx prisma db pull
   npx prisma studio
   ```
4. **Criar arquivo `src/prisma.js`:**

   ```javascript
   import { PrismaClient } from "@prisma/client";

   const prisma = new PrismaClient({
     log: ["query", "error", "warn"]
   });

   export default prisma;
   ```

5. **Começar refatoração incremental** das rotas

---

## 🎯 Estratégia de Migração

### Abordagem: **INCREMENTAL**

Não vamos reescrever tudo de uma vez! Vamos migrar rota por rota:

```javascript
// Exemplo: Migrar GET /api/students

// ANTES (SQL raw)
app.get("/api/students", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM students");
  res.json(rows);
});

// DEPOIS (Prisma)
import prisma from "./prisma.js";

app.get("/api/students", async (req, res) => {
  const students = await prisma.student.findMany();
  res.json(students);
});
```

### Ordem de Migração (recomendada):

1. **Students** (mais simples, menos dependências)
2. **Classrooms** (relaciona com students)
3. **Attendance** (depende de students e classrooms)
4. **Users/Auth** (mais complexo, deixar por último)

---

## ⚠️ Cuidados Importantes

1. **Não delete o `db.mjs` ainda!**

   - Manter pool MySQL funcionando
   - Migrar incrementalmente
   - Só remover quando tudo estiver migrado

2. **Testar cada rota após migrar**

   - Não migrar tudo de uma vez
   - Commit após cada grupo de rotas migradas

3. **Backup do banco antes de migrations**

   ```bash
   mysqldump -h mysql-facerec.alwaysdata.net -u facerec -p facerec_1 > backup.sql
   ```

4. **Cuidado com campos:**
   - `attendance_logs.user_id` → deve ser `student_id`
   - Verificar se schema.prisma está correto

---

## 📚 Recursos

- **Documentação Prisma:** https://www.prisma.io/docs
- **Prisma com Express:** https://www.prisma.io/docs/guides/other/integrating-prisma-with-express
- **Prisma MySQL:** https://www.prisma.io/docs/orm/overview/databases/mysql

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

```bash
# Verificar DATABASE_URL no .env
# Deve estar: mysql://facerec:senha@mysql-facerec.alwaysdata.net:3306/facerec_1
```

### Erro: "Table already exists"

```bash
# Usar db pull ao invés de migrate dev
npx prisma db pull
```

### Erro: "Invalid Prisma Client"

```bash
# Regenerar client
npx prisma generate
```

---

## ✅ Quando Considerar Migração Completa

- [ ] Todas as rotas migradas
- [ ] Todos os testes passando
- [ ] Performance igual ou melhor
- [ ] Sem bugs reportados
- [ ] Code review aprovado

---

**Última atualização:** 4 de novembro de 2025
**Branch:** `feature/migrate-to-prisma`
**Status:** 🟡 Em Progresso (Fase 1 completa)
