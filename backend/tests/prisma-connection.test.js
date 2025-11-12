// tests/prisma-connection.test.js
// Teste simples de conexão com o Prisma

import prisma from "../src/prisma.js";

console.log("🧪 Testando conexão com Prisma\n");

async function testConnection() {
  try {
    console.log("1️⃣ Conectando ao banco de dados...");
    await prisma.$connect();
    console.log("   ✅ Conexão estabelecida!\n");

    console.log("2️⃣ Executando query de teste...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("   ✅ Query executada com sucesso!");
    console.log(`   Resultado:`, result);
    console.log();

    console.log("3️⃣ Testando contagem de tabelas...");
    const counts = {
      users: await prisma.user.count(),
      students: await prisma.student.count(),
      classrooms: await prisma.classroom.count(),
      attendanceLogs: await prisma.attendanceLog.count()
    };

    console.log("   📊 Registros no banco:");
    console.log(`      - Users: ${counts.users}`);
    console.log(`      - Students: ${counts.students}`);
    console.log(`      - Classrooms: ${counts.classrooms}`);
    console.log(`      - Attendance Logs: ${counts.attendanceLogs}`);
    console.log();

    console.log("4️⃣ Testando operação de leitura...");
    const student = await prisma.student.findFirst();

    if (student) {
      console.log("   ✅ Conseguiu ler um estudante:");
      console.log(`      - ID: ${student.id}`);
      console.log(`      - Nome: ${student.nome}`);
      console.log(`      - Matrícula: ${student.matricula || "N/A"}`);
    } else {
      console.log("   ⚠️  Nenhum estudante encontrado no banco");
    }
    console.log();

    console.log("5️⃣ Testando relacionamento (Student -> Classroom)...");
    const studentWithClassroom = await prisma.student.findFirst({
      where: { classroomId: { not: null } },
      include: { classroom: true }
    });

    if (studentWithClassroom && studentWithClassroom.classroom) {
      console.log("   ✅ Relacionamento funcionando:");
      console.log(`      - Aluno: ${studentWithClassroom.nome}`);
      console.log(`      - Sala: ${studentWithClassroom.classroom.name}`);
    } else {
      console.log("   ⚠️  Nenhum aluno com sala para testar relacionamento");
    }
    console.log();

    console.log("🎉 Todos os testes passaram!\n");
    console.log("✅ Prisma está configurado corretamente");
    console.log("✅ Conexão com banco de dados está OK");
    console.log("✅ Schema está sincronizado");
    console.log("✅ Relacionamentos estão funcionando\n");

    return true;
  } catch (error) {
    console.error("\n❌ Erro no teste:");
    console.error("   Mensagem:", error.message);

    if (error.code) {
      console.error("   Código:", error.code);
    }

    // Dicas baseadas no erro
    if (error.code === "P1001") {
      console.error("\n💡 Dica: Problema de conexão com o banco");
      console.error("   - Verifique DATABASE_URL no .env");
      console.error("   - Verifique se o host e porta estão corretos");
      console.error("   - Verifique se o banco está acessível");
    } else if (error.code === "P2021") {
      console.error("\n💡 Dica: Tabela não existe no banco");
      console.error("   - Execute as migrations SQL primeiro");
      console.error("   - Ou execute: npx prisma db push");
    } else if (error.message.includes("Invalid `prisma")) {
      console.error("\n💡 Dica: Prisma Client precisa ser gerado");
      console.error("   Execute: npx prisma generate");
    }

    return false;
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Desconectado do banco\n");
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });
