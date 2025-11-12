# 🚀 Migração para Prisma ORM - Guia Rápido

## 📁 Estrutura Organizada

O projeto foi reorganizado para facilitar a migração segura para Prisma:

```
backend/
├── 📁 prisma/
│   └── schema.prisma          # Schema do banco de dados
│
├── 📁 src/
│   ├── prisma.js              # Cliente Prisma configurado
│   ├── migration-examples.js  # Exemplos de conversão SQL → Prisma
│   └── 📁 lib/
│       ├── validators.js      # Validações reutilizáveis
│       └── helpers.js         # Funções utilitárias
│
├── 📁 scripts/
│   ├── validate-schema.js     # Valida schema com banco
│   ├── test-migrations.js     # Testa conversões
│   └── backup-db.js           # Backup do banco
│
├── 📁 tests/
│   ├── prisma-connection.test.js  # Testa conexão
│   └── student.test.js            # Testa CRUD de students
│
└── 📁 docs/
    ├── MIGRATION_PLAN.md      # Plano detalhado de migração
    └── PRISMA_MIGRATION.md    # Guia original
```

---

## ⚡ Comandos Rápidos (npm scripts)

### Prisma

```bash
npm run prisma:generate    # Gerar Prisma Client
npm run prisma:studio      # Interface visual do banco
npm run prisma:pull        # Sincronizar com banco existente
npm run prisma:validate    # Validar schema
```

### Testes

```bash
npm run test:connection    # Testar conexão com Prisma
npm run test:student       # Testar CRUD de students
npm run test:migrations    # Comparar SQL vs Prisma
```

### Utilitários

```bash
npm run backup             # Fazer backup do banco
```

---

## 🎯 Passo a Passo (Migração)

### 1️⃣ Gerar Prisma Client

```bash
cd backend
npm run prisma:generate
```

✅ **Resultado esperado:** "Generated Prisma Client"

---

### 2️⃣ Validar Schema

```bash
npm run prisma:validate
```

✅ **Verifica:**

- Conexão com banco
- Tabelas existentes
- Relacionamentos
- Sincronização do schema

---

### 3️⃣ Testar Conexão

```bash
npm run test:connection
```

✅ **Testa:**

- Conexão com Prisma
- Queries básicas
- Contagem de registros
- Relacionamentos

---

### 4️⃣ Fazer Backup (IMPORTANTE!)

```bash
npm run backup
```

✅ **Cria:** `backups/backup_facerec_1_YYYY-MM-DD.sql`

---

### 5️⃣ Testar Migrações

```bash
npm run test:migrations
```

✅ **Compara:** Resultados SQL vs Prisma para validar conversões

---

### 6️⃣ Visualizar Banco (Opcional)

```bash
npm run prisma:studio
```

✅ **Abre:** Interface visual no navegador (http://localhost:5555)

---

## 📝 Migrar uma Rota (Exemplo)

### Antes (SQL raw):

```javascript
// routes/students.js
import { pool } from "../src/db.mjs";

app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE ativo = 1");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Depois (Prisma):

```javascript
// routes/students.js
import prisma from "../src/prisma.js";
import { handlePrismaError, bigIntToNumber } from "../src/lib/helpers.js";

app.get("/api/students", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { ativo: true }
    });

    res.json(bigIntToNumber(students));
  } catch (error) {
    handlePrismaError(error, res);
  }
});
```

---

## 🔄 Workflow de Migração

```
1. Escolher rota para migrar (ex: GET /api/students)
2. Converter SQL → Prisma (ver migration-examples.js)
3. Testar localmente
4. Comparar resultados (SQL vs Prisma)
5. Commit mudanças
6. Próxima rota
```

---

## 📊 Progresso da Migração

- [x] Setup inicial (Prisma instalado)
- [x] Schema criado
- [x] Cliente configurado
- [x] Scripts de validação criados
- [x] Testes criados
- [x] Estrutura organizada
- [ ] Gerar Prisma Client
- [ ] Validar com banco existente
- [ ] Migrar rotas de Students
- [ ] Migrar rotas de Classrooms
- [ ] Migrar rotas de Attendance
- [ ] Migrar rotas de Auth
- [ ] Limpeza e otimização
- [ ] Merge para main

---

## ⚠️ Checklist de Segurança

Antes de cada mudança:

- [ ] Backup do banco feito
- [ ] Testes passando
- [ ] Código revisado
- [ ] Commit incremental

---

## 🐛 Troubleshooting

### Erro: "Invalid Prisma Client"

```bash
npm run prisma:generate
```

### Erro: "Can't reach database"

```bash
# Verificar .env
DATABASE_URL="mysql://user:pass@host:3306/database"
```

### Erro: "Table doesn't exist"

```bash
# Sincronizar schema
npm run prisma:pull
```

---

## 📚 Documentação

- **Plano Completo:** [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
- **Guia Original:** [PRISMA_MIGRATION.md](./PRISMA_MIGRATION.md)
- **Exemplos:** [src/migration-examples.js](./src/migration-examples.js)

---

## 🎯 Próximo Passo

Execute agora:

```bash
npm run prisma:generate
```

Depois:

```bash
npm run test:connection
```

Se tudo passar, você está pronto para começar a migração! 🚀

---

**Branch:** `feature/migrate-to-prisma`  
**Data:** 4 de novembro de 2025
