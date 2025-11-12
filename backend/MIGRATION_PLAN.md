# 📋 Plano de Migração para Prisma ORM

## 🎯 Objetivo

Migrar gradualmente o sistema de reconhecimento facial de queries SQL raw (mysql2) para Prisma ORM, mantendo o sistema funcional durante todo o processo.

---

## 📁 Estrutura do Projeto Organizada

```
backend/
├── prisma/
│   ├── schema.prisma          # ✅ Schema do banco (criado)
│   └── migrations/            # 📁 Futuras migrations
│
├── src/
│   ├── db.mjs                 # 🔄 Pool MySQL (manter temporariamente)
│   ├── prisma.js              # ✅ Cliente Prisma (criado)
│   ├── migration-examples.js  # ✅ Exemplos de conversão (criado)
│   ├── server.js              # 📝 Servidor principal
│   └── lib/                   # 📁 NOVA PASTA
│       ├── validators.js      # ⭐ Validações de dados
│       └── helpers.js         # ⭐ Funções utilitárias
│
├── routes/                    # 📝 Rotas a migrar
│   ├── auth.js               # 🔄 Autenticação
│   └── profilePicture.js     # 🔄 Fotos de perfil
│
├── tests/                     # 📁 NOVA PASTA
│   ├── prisma-connection.test.js  # ⭐ Teste de conexão
│   ├── student.test.js            # ⭐ Testes de alunos
│   └── attendance.test.js         # ⭐ Testes de presença
│
├── scripts/                   # 📁 NOVA PASTA
│   ├── validate-schema.js     # ⭐ Validar schema
│   ├── test-migrations.js     # ⭐ Testar conversões
│   └── backup-db.js           # ⭐ Backup do banco
│
└── docs/                      # 📁 NOVA PASTA (opcional)
    ├── API.md                 # 📝 Documentação da API
    └── DATABASE.md            # 📝 Estrutura do banco

✅ = Já criado
⭐ = A criar agora
🔄 = A migrar
📁 = Pasta nova
📝 = Existente (atualizar)
```

---

## 🔄 Fases da Migração (Detalhado)

### ✅ Fase 0: Setup Inicial (CONCLUÍDA)

- [x] Branch `feature/migrate-to-prisma` criado
- [x] Prisma instalado (`@prisma/client`, `prisma`)
- [x] Schema criado (`prisma/schema.prisma`)
- [x] Cliente Prisma configurado (`src/prisma.js`)
- [x] Exemplos de conversão criados (`src/migration-examples.js`)

---

### 🔄 Fase 1: Organização e Validação (ATUAL)

**Objetivos:**

1. Criar estrutura de pastas organizadas
2. Adicionar testes de conexão
3. Validar schema com banco existente
4. Criar scripts de backup e validação

**Tarefas:**

- [ ] Criar pasta `src/lib/` com helpers e validators
- [ ] Criar pasta `tests/` com testes básicos
- [ ] Criar pasta `scripts/` com utilitários
- [ ] Gerar Prisma Client (`npx prisma generate`)
- [ ] Validar schema com banco (`npx prisma db pull`)
- [ ] Executar teste de conexão
- [ ] Fazer backup do banco de dados

**Arquivos a criar:**

1. `scripts/validate-schema.js` - Valida schema
2. `scripts/test-migrations.js` - Testa conversões
3. `scripts/backup-db.js` - Backup automático
4. `tests/prisma-connection.test.js` - Teste de conexão
5. `src/lib/validators.js` - Validações reutilizáveis
6. `src/lib/helpers.js` - Funções auxiliares

---

### 📝 Fase 2: Migração de Students (1ª rota)

**Por que Students primeiro?**

- Menos dependências
- CRUD simples
- Boa base para aprender o padrão

**Rotas a migrar:**

- [ ] `GET /api/students` - Listar todos
- [ ] `GET /api/students/:id` - Buscar por ID
- [ ] `POST /api/students` - Criar novo
- [ ] `PUT /api/students/:id` - Atualizar
- [ ] `DELETE /api/students/:id` - Deletar

**Checklist por rota:**

1. ✏️ Converter query SQL → Prisma
2. ✅ Testar rota individualmente
3. 📊 Comparar resultados (SQL vs Prisma)
4. 💾 Commit mudanças
5. 📝 Atualizar documentação

---

### 📝 Fase 3: Migração de Classrooms

**Rotas a migrar:**

- [ ] `GET /api/classrooms`
- [ ] `GET /api/classrooms/:id`
- [ ] `POST /api/classrooms`
- [ ] `PUT /api/classrooms/:id`
- [ ] `DELETE /api/classrooms/:id`
- [ ] `GET /api/classrooms/:id/students` (com relacionamento)

---

### 📝 Fase 4: Migração de Attendance

**Rotas a migrar:**

- [ ] `GET /api/attendance` - Listar logs
- [ ] `POST /api/attendance` - Registrar presença
- [ ] `GET /api/attendance/student/:id` - Por aluno
- [ ] `GET /api/attendance/classroom/:id` - Por sala
- [ ] `POST /api/_internal/consolidate` - Consolidar logs

**⚠️ Atenção especial:**

- Campo `student_id` (não `user_id`)
- Relacionamentos com Student e Classroom
- Performance (muitos logs)
- Timezone das datas

---

### 📝 Fase 5: Migração de Auth

**Rotas a migrar:**

- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login`
- [ ] `GET /api/auth/me`
- [ ] `POST /api/auth/refresh`

**⚠️ Cuidados:**

- Verificação de senhas (bcrypt)
- Geração de tokens JWT
- Validação de roles
- Tratamento de erros

---

### 📝 Fase 6: Rotas Restantes

**Migrar:**

- [ ] Profile pictures
  <!-- itens de migração de profile_picture removidos (decisão: tratar em solução futura diferente) -->
- [ ] Teacher classes
- [ ] Enrollments
- [ ] Qualquer outra rota customizada

---

### 🧹 Fase 7: Limpeza e Otimização

**Tarefas:**

- [ ] Remover imports de `pool` (mysql2)
- [ ] Remover arquivo `src/db.mjs`
- [ ] Atualizar `package.json` (remover mysql2?)
- [ ] Adicionar indexes no Prisma (performance)
- [ ] Revisar logs e error handling
- [ ] Documentar API atualizada
- [ ] Code review final

---

### 🚀 Fase 8: Deploy e Merge

**Checklist final:**

- [ ] Todos os testes passando
- [ ] Performance validada
- [ ] Backup do banco feito
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Merge para `main`
- [ ] Deploy em produção
- [ ] Monitorar logs por 24h

---

## 📊 Métricas de Sucesso

| Métrica                        | Antes (SQL) | Depois (Prisma) | Objetivo |
| ------------------------------ | ----------- | --------------- | -------- |
| Linhas de código (routes)      | ~800        | ~500            | Reduzir  |
| Tempo médio de query (ms)      | ?           | ?               | Manter/↓ |
| Erros de tipo                  | Frequentes  | 0               | Eliminar |
| Tempo para adicionar nova rota | 30min       | 10min           | Reduzir  |
| Coverage de testes             | 0%          | 60%+            | Aumentar |

---

## 🛡️ Estratégias de Segurança

### 1. **Sempre fazer backup antes de mudanças**

```bash
node scripts/backup-db.js
```

### 2. **Testar em ambiente local primeiro**

- Usar banco de desenvolvimento
- Nunca testar direto em produção

### 3. **Commits incrementais**

```bash
git commit -m "feat(prisma): Migrate Students GET route"
git commit -m "feat(prisma): Migrate Students POST route"
# etc...
```

### 4. **Rollback plan**

Se algo der errado:

```bash
git revert HEAD
git push
```

### 5. **Validar cada conversão**

- Comparar resultados SQL vs Prisma
- Verificar tipos de dados
- Conferir relacionamentos

---

## 🔍 Validações Importantes

### 1. **BigInt vs Number**

```javascript
// ❌ ERRADO
const student = await prisma.student.findUnique({
  where: { id: req.params.id } // String!
});

// ✅ CORRETO
const student = await prisma.student.findUnique({
  where: { id: BigInt(req.params.id) }
});
```

### 2. **Relacionamentos**

```javascript
// ❌ PODE GERAR N+1 QUERIES
const students = await prisma.student.findMany();
for (const student of students) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: student.classroomId }
  });
}

// ✅ USAR INCLUDE
const students = await prisma.student.findMany({
  include: { classroom: true }
});
```

### 3. **Tratamento de NULL**

```javascript
// ❌ CRASH se não existir
const student = await prisma.student.findUnique({
  where: { id: BigInt(id) }
});
console.log(student.nome); // TypeError!

// ✅ SEMPRE VERIFICAR
const student = await prisma.student.findUnique({
  where: { id: BigInt(id) }
});

if (!student) {
  return res.status(404).json({ error: "Student not found" });
}
```

---

## 📚 Recursos e Links

### Documentação Oficial

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

### Guias Específicos

- [MySQL com Prisma](https://www.prisma.io/docs/orm/overview/databases/mysql)
- [Migrações](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Error Handling](https://www.prisma.io/docs/concepts/components/prisma-client/handling-exceptions-and-errors)

### Exemplos de Código

- Ver `src/migration-examples.js` (10 exemplos práticos)
- Ver `PRISMA_MIGRATION.md` (guia detalhado)

---

## 🎯 Próximos Passos IMEDIATOS

### 1. Gerar Prisma Client

```bash
cd backend
npx prisma generate
```

### 2. Validar Schema

```bash
npx prisma db pull
```

(Vai gerar schema do banco existente - comparar com o manual)

### 3. Testar Conexão

```bash
node tests/prisma-connection.test.js
```

### 4. Fazer Backup

```bash
node scripts/backup-db.js
```

### 5. Começar com Students

Editar a primeira rota: `GET /api/students`

---

## 📝 Notas Importantes

1. **Não apagar código antigo imediatamente**

   - Comentar código SQL antigo
   - Manter por algumas semanas
   - Facilita comparação e rollback

2. **Usar branch separado**

   - Nunca migrar direto na `main`
   - Facilita testes e revisões
   - Permite trabalhar em paralelo

3. **Documentar descobertas**

   - Anotar problemas encontrados
   - Documentar soluções
   - Ajuda equipe e você no futuro

4. **Performance é importante**
   - Medir tempo das queries
   - Adicionar indexes quando necessário
   - Prisma pode ser mais lento que SQL otimizado

<!-- notas de deprecação específicas de profile_picture removidas -->

---

**Data de criação:** 4 de novembro de 2025  
**Última atualização:** 4 de novembro de 2025  
**Status:** 🟡 Fase 1 - Organização e Validação  
**Branch:** `feature/migrate-to-prisma`
