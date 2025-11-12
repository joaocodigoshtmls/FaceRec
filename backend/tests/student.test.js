// tests/student.test.js
// Testes completos de CRUD para Students

import prisma from "../src/prisma.js";

console.log("🧪 Testando operações CRUD de Students\n");

let createdStudentId = null;

async function testStudentCRUD() {
  try {
    await prisma.$connect();
    console.log("✅ Conectado ao banco\n");

    // CREATE
    console.log("1️⃣ Testando CREATE...");
    const newStudent = await prisma.student.create({
      data: {
        nome: "Teste Aluno Migração",
        email: "teste.migracao@example.com",
        matricula: `TEST${Date.now()}`,
        ativo: true
      }
    });

    createdStudentId = newStudent.id;
    console.log(`   ✅ Aluno criado com ID: ${createdStudentId}`);
    console.log(`      Nome: ${newStudent.nome}`);
    console.log();

    // READ (findUnique)
    console.log("2️⃣ Testando READ (findUnique)...");
    const foundStudent = await prisma.student.findUnique({
      where: { id: createdStudentId }
    });

    if (foundStudent && foundStudent.nome === newStudent.nome) {
      console.log("   ✅ Aluno encontrado corretamente");
      console.log(`      ID: ${foundStudent.id}`);
      console.log(`      Nome: ${foundStudent.nome}`);
    } else {
      throw new Error("Aluno não encontrado ou dados diferentes");
    }
    console.log();

    // READ (findMany)
    console.log("3️⃣ Testando READ (findMany)...");
    const students = await prisma.student.findMany({
      where: { ativo: true },
      take: 5
    });

    console.log(`   ✅ Encontrados ${students.length} alunos ativos`);
    console.log();

    // UPDATE
    console.log("4️⃣ Testando UPDATE...");
    const updatedStudent = await prisma.student.update({
      where: { id: createdStudentId },
      data: {
        telefone: "(11) 98765-4321",
        email: "teste.atualizado@example.com"
      }
    });

    if (updatedStudent.telefone === "(11) 98765-4321") {
      console.log("   ✅ Aluno atualizado com sucesso");
      console.log(`      Novo telefone: ${updatedStudent.telefone}`);
      console.log(`      Novo email: ${updatedStudent.email}`);
    } else {
      throw new Error("Atualização falhou");
    }
    console.log();

    // READ com filtro
    console.log("5️⃣ Testando busca com filtro...");
    const searchResult = await prisma.student.findMany({
      where: {
        OR: [{ nome: { contains: "Teste" } }, { email: { contains: "teste" } }]
      }
    });

    console.log(
      `   ✅ Encontrados ${searchResult.length} alunos com filtro "Teste"`
    );
    console.log();

    // Paginação
    console.log("6️⃣ Testando paginação...");
    const page1 = await prisma.student.findMany({
      skip: 0,
      take: 2,
      orderBy: { nome: "asc" }
    });

    console.log(`   ✅ Página 1: ${page1.length} resultados`);
    if (page1.length > 0) {
      console.log(`      Primeiro: ${page1[0].nome}`);
    }
    console.log();

    // Relacionamento
    console.log("7️⃣ Testando relacionamento (com classroom)...");
    const studentWithRelation = await prisma.student.findFirst({
      where: { classroomId: { not: null } },
      include: {
        classroom: true,
        owner: { select: { fullName: true, email: true } }
      }
    });

    if (studentWithRelation) {
      console.log("   ✅ Relacionamento funcionando:");
      console.log(`      Aluno: ${studentWithRelation.nome}`);
      console.log(
        `      Sala: ${studentWithRelation.classroom?.name || "N/A"}`
      );
      console.log(
        `      Dono: ${studentWithRelation.owner?.fullName || "N/A"}`
      );
    } else {
      console.log("   ⚠️  Nenhum aluno com sala para testar");
    }
    console.log();

    // DELETE
    console.log("8️⃣ Testando DELETE...");
    await prisma.student.delete({
      where: { id: createdStudentId }
    });

    // Verificar se foi deletado
    const deletedStudent = await prisma.student.findUnique({
      where: { id: createdStudentId }
    });

    if (deletedStudent === null) {
      console.log("   ✅ Aluno deletado com sucesso");
    } else {
      throw new Error("Aluno ainda existe após delete");
    }
    console.log();

    console.log("🎉 Todos os testes de Student passaram!\n");
    return true;
  } catch (error) {
    console.error("\n❌ Erro no teste:");
    console.error("   Mensagem:", error.message);
    console.error("   Stack:", error.stack);

    // Cleanup em caso de erro
    if (createdStudentId) {
      try {
        await prisma.student.delete({
          where: { id: createdStudentId }
        });
        console.log("\n🧹 Cleanup: Aluno de teste deletado");
      } catch (cleanupError) {
        console.error("   ⚠️  Erro no cleanup:", cleanupError.message);
      }
    }

    return false;
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Desconectado do banco\n");
  }
}

testStudentCRUD()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });
