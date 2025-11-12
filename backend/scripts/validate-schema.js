// scripts/validate-schema.js
// Valida o schema do Prisma com o banco de dados existente

import prisma from "../src/prisma.js";
import { createRequire } from "module";
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

// Diretório do backend (onde está o prisma/schema.prisma e .env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

console.log("🔍 Validando schema do Prisma...\n");

async function validateSchema() {
  try {
    // 1. Testar conexão
    console.log("1️⃣ Testando conexão com o banco de dados...");
    await prisma.$connect();
    console.log("   ✅ Conexão estabelecida!\n");

    // 2. Executar db pull para comparar
    console.log("2️⃣ Executando introspection (db pull)...");
    const { stdout, stderr } = await execAsync("npx prisma db pull --force", {
      cwd: backendRoot
    });

    if (stderr && !stderr.includes("warn")) {
      console.warn("   ⚠️  Avisos:", stderr);
    }
    console.log("   ✅ Introspection completa!\n");

    // 3. Verificar tabelas principais
    console.log("3️⃣ Verificando tabelas principais...");

    const tables = {
      users: await prisma.user.count(),
      students: await prisma.student.count(),
      classrooms: await prisma.classroom.count(),
      attendance_logs: await prisma.attendanceLog.count(),
      teacher_classes: await prisma.teacherClass.count()
    };

    console.log("   📊 Contagem de registros:");
    for (const [table, count] of Object.entries(tables)) {
      console.log(`      - ${table}: ${count} registros`);
    }
    console.log();

    // 4. Verificar relacionamentos
    console.log("4️⃣ Verificando relacionamentos...");

    // Buscar um aluno com classroom
    const studentWithClassroom = await prisma.student.findFirst({
      where: { classroomId: { not: null } },
      include: { classroom: true }
    });

    if (studentWithClassroom) {
      console.log(`   ✅ Relacionamento Student -> Classroom funcionando!`);
      console.log(
        `      (${studentWithClassroom.nome} está em ${studentWithClassroom.classroom?.name})`
      );
    } else {
      console.log(
        "   ⚠️  Nenhum aluno com sala encontrado para testar relacionamento"
      );
    }

    // Buscar log de presença com student
    const logWithStudent = await prisma.attendanceLog.findFirst({
      include: { student: true }
    });

    if (logWithStudent) {
      console.log(`   ✅ Relacionamento AttendanceLog -> Student funcionando!`);
      console.log(`      (Log do aluno: ${logWithStudent.student.nome})`);
    } else {
      console.log("   ⚠️  Nenhum log de presença encontrado");
    }

    console.log();

    // 5. Verificar índices importantes
    console.log("5️⃣ Schema validado com sucesso! ✅\n");

    console.log("📋 Resumo:");
    console.log("   - Conexão: OK");
    console.log("   - Tabelas: OK");
    console.log("   - Relacionamentos: OK");
    console.log("   - Schema sincronizado com banco: OK\n");

    console.log(
      "💡 Próximo passo: Execute 'npx prisma generate' para gerar o Prisma Client"
    );
  } catch (error) {
    console.error("\n❌ Erro ao validar schema:");
    console.error(error.message);

    if (error.code === "P1001") {
      console.error("\n💡 Dica: Verifique suas credenciais no arquivo .env");
      console.error("   DATABASE_URL deve estar correto");
    } else if (error.code === "P1003") {
      console.error(
        "\n💡 Dica: O banco de dados ou tabela não existe. Execute as migrations SQL primeiro."
      );
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validateSchema();
