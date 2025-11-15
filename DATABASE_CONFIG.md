# 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS (ALWAYSDATA)

## 📋 Informações do Banco

**Dados do seu banco FaceRec:**

```
Host: mysql-facerec.alwaysdata.net
Port: 3306
Database: facerec_1
User: facerec
Password: iqmi8j55PDpHQ
```

---

## 🔗 Connection String (DATABASE_URL)

### Formato Geral

```
mysql://USUARIO:SENHA@HOST:PORTA/BANCO_DE_DADOS
```

### Para o FaceRec

```bash
DATABASE_URL="mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1"
```

> **⚠️ IMPORTANTE:** Esta connection string já está correta. Use exatamente como está acima!

---

## 📍 Onde Usar

### 1. Railway (Backend)

1. Acesse seu projeto no Railway
2. Clique no serviço do backend
3. Vá em **Variables**
4. Adicione:
   ```
   DATABASE_URL=mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1
   ```

### 2. Desenvolvimento Local

Crie arquivo `backend/.env`:

```bash
DATABASE_URL="mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1"
```

> **Nunca commite este arquivo no git!** Ele já está no `.gitignore`

---

## 🔧 Configuração do Prisma

O arquivo `backend/prisma/schema.prisma` já está configurado:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

O Prisma lê a `DATABASE_URL` do ambiente automaticamente.

---

## 🧪 Testar Conexão

### Teste 1: Prisma (Local)

```bash
cd backend
echo 'DATABASE_URL="mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1"' > .env
npx prisma db pull
```

Se funcionar, você verá:
```
✔ Introspected 7 models and wrote them into prisma/schema.prisma
```

### Teste 2: Node.js (Local)

```bash
cd backend
npm install
DATABASE_URL="mysql://facerec:iqmi8j55PDpHQ@mysql-facerec.alwaysdata.net:3306/facerec_1" node src/server.js
```

Se funcionar, você verá:
```
✅ Banco de dados conectado com sucesso!
```

### Teste 3: MySQL CLI

```bash
mysql -h mysql-facerec.alwaysdata.net -P 3306 -u facerec -p facerec_1
# Senha quando solicitado: iqmi8j55PDpHQ
```

---

## 🔐 Segurança

### ✅ Boas Práticas

1. **Nunca commite credenciais:**
   ```bash
   # Adicione no .gitignore (já está)
   .env
   backend/.env
   ```

2. **Use variáveis de ambiente:**
   ```javascript
   // ✅ Correto
   const url = process.env.DATABASE_URL;

   // ❌ Errado (hardcoded)
   const url = "mysql://user:pass@host/db";
   ```

3. **Diferentes ambientes:**
   ```bash
   # Desenvolvimento (local)
   DATABASE_URL="mysql://facerec:senha@mysql-facerec.alwaysdata.net:3306/facerec_1"

   # Produção (Railway) - mesma string
   DATABASE_URL="mysql://facerec:senha@mysql-facerec.alwaysdata.net:3306/facerec_1"
   ```

### ⚠️ Aviso de Segurança

A senha `iqmi8j55PDpHQ` está sendo usada neste guia porque:
1. É fornecida pelo usuário no problema
2. Já está na documentação existente (.env.example)

**Recomendações:**
- Considere alterar a senha no painel do AlwaysData
- Use uma senha forte e única
- Não compartilhe credenciais publicamente

---

## 🔄 Migrações do Prisma

### Criar Tabelas no Banco

```bash
cd backend
npx prisma db push
```

Isso criará/atualizará as tabelas baseado no schema.prisma.

### Gerar Prisma Client

```bash
npx prisma generate
```

Necessário após alterar `schema.prisma` ou antes do primeiro uso.

### Ver Dados (Prisma Studio)

```bash
npx prisma studio
```

Abre interface web em `http://localhost:5555` para visualizar/editar dados.

---

## 🚨 Problemas Comuns

### Erro: "Can't connect to MySQL server"

**Possíveis causas:**

1. **Credenciais incorretas:**
   - Verifique usuário, senha, host, porta, banco
   - Copie e cole exatamente da connection string

2. **Firewall do AlwaysData:**
   - Acesse: AlwaysData > Advanced > Firewall
   - Certifique-se de que conexões externas estão permitidas

3. **Servidor MySQL offline:**
   - Verifique status no painel do AlwaysData
   - Tente acessar o phpMyAdmin

### Erro: "Access denied for user 'facerec'@'...'"

**Solução:**

1. Confirme a senha no painel do AlwaysData:
   - Databases > MySQL > Clique no banco
   - Veja/redefina a senha se necessário

2. Teste com phpMyAdmin:
   - Se funcionar lá, o problema é na connection string
   - Verifique encoding de caracteres especiais na senha

### Erro: "Unknown database 'facerec_1'"

**Solução:**

1. Verifique o nome exato do banco:
   - AlwaysData > Databases > MySQL
   - Copie o nome exato (pode ser case-sensitive)

2. Crie o banco se não existir:
   - AlwaysData > Databases > MySQL > + Install a database

### Erro no Prisma: "P1001: Can't reach database server"

**Solução:**

1. Verifique se a connection string está entre aspas:
   ```bash
   # ✅ Correto
   DATABASE_URL="mysql://..."

   # ❌ Errado (sem aspas)
   DATABASE_URL=mysql://...
   ```

2. Teste conexão manual (MySQL CLI) primeiro

3. Verifique logs do Railway para erros mais detalhados

---

## 📊 Estrutura do Banco

O schema do FaceRec inclui:

### Tabelas Principais

- **users** - Usuários (professores, supervisores)
- **students** - Alunos cadastrados
- **classrooms** - Salas de aula
- **enrollments** - Matrículas (aluno ↔ sala)
- **attendance_logs** - Registros de presença
- **teacher_classes** - Turmas atribuídas a professores

### Relacionamentos

```
users (1) ─────< (N) classrooms
              └────< (N) students

classrooms (1) ─< (N) students
               └─< (N) enrollments

students (1) ──< (N) attendance_logs
             └─< (N) enrollments
```

---

## 🛠️ Comandos Úteis

```bash
# Verificar schema atual do banco
npx prisma db pull

# Aplicar schema no banco
npx prisma db push

# Criar migração (desenvolvimento)
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações (produção)
npx prisma migrate deploy

# Resetar banco (CUIDADO! Apaga dados)
npx prisma migrate reset

# Ver dados
npx prisma studio
```

---

## 📚 Referências

- **Prisma Docs:** https://www.prisma.io/docs/
- **AlwaysData Help:** https://help.alwaysdata.com/
- **MySQL Docs:** https://dev.mysql.com/doc/

---

## 📝 Checklist de Configuração

- [ ] Banco criado no AlwaysData
- [ ] Connection string anotada
- [ ] `DATABASE_URL` configurada no Railway
- [ ] `DATABASE_URL` configurada no `.env` local (se desenvolver)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Tabelas criadas (`npx prisma db push`)
- [ ] Conexão testada (endpoint `/health` do backend)
- [ ] Dados de teste inseridos (opcional)

---

**✅ Banco configurado!** Seu backend pode se conectar ao MySQL no AlwaysData.

Para continuar o deploy, veja [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md) ou [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md)
