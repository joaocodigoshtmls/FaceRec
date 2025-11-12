# 📋 Task List - Migração Prisma

## ✅ Fase 0: Setup (CONCLUÍDO)

- [x] Criar branch `feature/migrate-to-prisma`
- [x] Instalar Prisma (`@prisma/client`, `prisma`)
- [x] Criar schema (`prisma/schema.prisma`)
- [x] Configurar cliente Prisma (`src/prisma.js`)
- [x] Criar exemplos de conversão (`src/migration-examples.js`)
- [x] Organizar estrutura de pastas
- [x] Criar scripts de validação
- [x] Criar testes
- [x] Adicionar npm scripts
- [x] Documentar processo

---

## 🔄 Fase 1: Validação (PRÓXIMA)

- [ ] **Gerar Prisma Client**
  ```bash
  npm run prisma:generate
  ```
- [ ] **Testar conexão**
  ```bash
  npm run test:connection
  ```
- [ ] **Validar schema**
  ```bash
  npm run prisma:validate
  ```
- [ ] **Fazer backup do banco**
  ```bash
  npm run backup
  ```
- [ ] **Testar conversões**
  ```bash
  npm run test:migrations
  ```

---

## 📝 Fase 2: Migrar Students

### Rotas a migrar:

- [ ] `GET /api/students` - Listar todos

  - Converter query SQL → `prisma.student.findMany()`
  - Testar resposta
  - Comparar com versão SQL
  - Commit: `feat(prisma): Migrate GET /api/students`

- [ ] `GET /api/students/:id` - Buscar por ID

  - Converter → `prisma.student.findUnique()`
  - Validar ID com `validateId()`
  - Tratar 404
  - Commit: `feat(prisma): Migrate GET /api/students/:id`

- [ ] `POST /api/students` - Criar novo

  - Converter → `prisma.student.create()`
  - Validar dados com `validateStudentData()`
  - Tratar erros (P2002 - unique)
  - Commit: `feat(prisma): Migrate POST /api/students`

- [ ] `PUT /api/students/:id` - Atualizar

  - Converter → `prisma.student.update()`
  - Validar ID e dados
  - Tratar 404 (P2025)
  - Commit: `feat(prisma): Migrate PUT /api/students/:id`

- [ ] `DELETE /api/students/:id` - Deletar
  - Converter → `prisma.student.delete()`
  - Validar ID
  - Tratar 404 e foreign key (P2003)
  - Commit: `feat(prisma): Migrate DELETE /api/students/:id`

**Checkpoint Fase 2:**

- [ ] Todos os testes de student passando
- [ ] Rotas testadas manualmente
- [ ] Commit final: `feat(prisma): Complete Students migration`

---

## 📝 Fase 3: Migrar Classrooms

### Rotas a migrar:

- [ ] `GET /api/classrooms`

  - `prisma.classroom.findMany()`
  - Incluir contagem de students?

- [ ] `GET /api/classrooms/:id`

  - `prisma.classroom.findUnique()`
  - Include students?

- [ ] `GET /api/classrooms/:id/students`

  - `prisma.classroom.findUnique({ include: { students: true } })`

- [ ] `POST /api/classrooms`

  - `prisma.classroom.create()`

- [ ] `PUT /api/classrooms/:id`

  - `prisma.classroom.update()`

- [ ] `DELETE /api/classrooms/:id`
  - `prisma.classroom.delete()`
  - Atenção: Pode ter foreign keys (students)

**Checkpoint Fase 3:**

- [ ] Testes passando
- [ ] Commit: `feat(prisma): Complete Classrooms migration`

---

## 📝 Fase 4: Migrar Attendance

### Rotas a migrar:

- [ ] `GET /api/attendance` - Listar logs

  - `prisma.attendanceLog.findMany()`
  - Include student e classroom
  - Paginação
  - Ordenar por capturedAt desc

- [ ] `GET /api/attendance/student/:id` - Por aluno

  - Filter por studentId
  - Incluir classroom?

- [ ] `GET /api/attendance/classroom/:id` - Por sala

  - Filter por classroomId
  - Incluir student

- [ ] `POST /api/attendance` - Registrar presença

  - `prisma.attendanceLog.create()`
  - Validar studentId existe
  - Validar confidence (0-1)

- [ ] `POST /api/_internal/consolidate` - Consolidar
  - Revisar lógica
  - Pode usar transaction se necessário

**Checkpoint Fase 4:**

- [ ] ⚠️ **IMPORTANTE:** Verificar campo `student_id` (não `user_id`)
- [ ] Testes passando
- [ ] Performance OK (muitos logs)
- [ ] Commit: `feat(prisma): Complete Attendance migration`

---

## 📝 Fase 5: Migrar Auth

### Rotas a migrar:

- [ ] `POST /api/auth/register`

  - `prisma.user.create()`
  - Hash de senha (bcrypt)
  - Validar email único

- [ ] `POST /api/auth/login`

  - `prisma.user.findUnique({ where: { email } })`
  - Comparar senha
  - Gerar JWT

- [ ] `GET /api/auth/me`
  - `prisma.user.findUnique({ where: { id } })`
  - Usar token JWT

**Checkpoint Fase 5:**

- [ ] Autenticação funcionando
- [ ] Tokens válidos
- [ ] Commit: `feat(prisma): Complete Auth migration`

---

## 📝 Fase 6: Rotas Restantes

- [ ] Profile pictures
- [ ] Teacher classes
- [ ] Enrollments (se existir)
- [ ] Outras rotas customizadas

**Checkpoint Fase 6:**

- [ ] Todas as rotas migradas
- [ ] Commit: `feat(prisma): Complete remaining routes migration`

---

## 🧹 Fase 7: Limpeza

- [ ] Remover imports de `pool` (mysql2)
- [ ] Comentar código SQL antigo (não deletar ainda!)
- [ ] Revisar error handling
- [ ] Adicionar logs apropriados
- [ ] Atualizar documentação da API
- [ ] Verificar performance (comparar tempos)
- [ ] Code review interno

**Checkpoint Fase 7:**

- [ ] Código limpo
- [ ] Sem código duplicado
- [ ] Commit: `refactor(prisma): Clean up old SQL code`

---

## ✅ Fase 8: Finalização

- [ ] **Testes finais:**

  - [ ] Todas as rotas funcionando
  - [ ] Relacionamentos OK
  - [ ] Performance aceitável
  - [ ] Error handling correto

- [ ] **Documentação:**

  - [ ] API documentada
  - [ ] README atualizado
  - [ ] Comentários no código

- [ ] **Backup final antes do merge**

  ```bash
  npm run backup
  ```

- [ ] **Code review:**

  - [ ] Revisar todos os commits
  - [ ] Verificar se seguiu padrões
  - [ ] Testar localmente

- [ ] **Merge para main:**

  ```bash
  git checkout main
  git merge feature/migrate-to-prisma
  git push
  ```

- [ ] **Deploy (se aplicável)**

- [ ] **Monitorar logs por 24h**

---

## 📊 Métricas de Sucesso

| Métrica                   | Antes | Depois | Status |
| ------------------------- | ----- | ------ | ------ |
| Linhas de código (routes) | ~800  | ?      | ⏳     |
| Tempo médio de query      | ?     | ?      | ⏳     |
| Erros de tipo             | Freq. | 0      | ⏳     |
| Tempo para nova rota      | 30min | 10min  | ⏳     |
| Coverage de testes        | 0%    | 60%+   | ⏳     |

---

## 🎯 PRÓXIMO PASSO IMEDIATO

Execute agora:

```bash
npm run prisma:generate
```

Se sucesso, execute:

```bash
npm run test:connection
```

✅ Se passar, você está pronto para começar a Fase 2!

---

**Última atualização:** 4 de novembro de 2025  
**Branch:** `feature/migrate-to-prisma`  
**Status:** 🟡 Fase 1 - Validação
