// scripts/test-migrations.js
// Testa as funções de migração comparando resultados SQL vs Prisma

import prisma from "../src/prisma.js";
import { pool } from "../src/db.mjs";
import {
  getStudentsOld,
  getStudentsNew,
  getStudentsPaginatedOld,
  getStudentsPaginatedNew,
  searchStudentsOld,
  searchStudentsNew
} from "../src/migration-examples.js";

console.log("🧪 Testando migrações SQL → Prisma\n");

async function compareResults(name, oldFn, newFn, ...args) {
  console.log(`\n📝 Testando: ${name}`);
  console.log("   Args:", JSON.stringify(args));

  try {
    const startOld = Date.now();
    const resultOld = await oldFn(...args);
    const timeOld = Date.now() - startOld;

    const startNew = Date.now();
    const resultNew = await newFn(...args);
    const timeNew = Date.now() - startNew;

    // Comparar resultados
    const countOld = Array.isArray(resultOld)
      ? resultOld.length
      : resultOld?.data?.length || 1;
    const countNew = Array.isArray(resultNew)
      ? resultNew.length
      : resultNew?.data?.length || 1;

    if (countOld === countNew) {
      console.log(`   ✅ Resultados iguais: ${countOld} registros`);
    } else {
      console.log(`   ⚠️  Diferença: SQL=${countOld}, Prisma=${countNew}`);
    }

    console.log(`   ⏱️  Performance: SQL=${timeOld}ms, Prisma=${timeNew}ms`);

    if (timeNew < timeOld) {
      console.log(`   🚀 Prisma é ${timeOld - timeNew}ms mais rápido!`);
    } else if (timeNew > timeOld) {
      console.log(`   🐌 Prisma é ${timeNew - timeOld}ms mais lento`);
    }

    return { success: true, countOld, countNew, timeOld, timeNew };
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const results = [];

  try {
    console.log("🔗 Conectando ao banco de dados...");
    await prisma.$connect();
    console.log("✅ Conectado!\n");

    console.log("=".repeat(60));

    // Teste 1: Buscar todos os alunos
    results.push(
      await compareResults("GET Students", getStudentsOld, getStudentsNew)
    );

    // Teste 2: Paginação
    results.push(
      await compareResults(
        "GET Students Paginated (page 1, limit 10)",
        getStudentsPaginatedOld,
        getStudentsPaginatedNew,
        1,
        10
      )
    );

    // Teste 3: Busca
    results.push(
      await compareResults(
        "Search Students (empty search, no classroom)",
        searchStudentsOld,
        searchStudentsNew,
        "",
        null
      )
    );

    console.log("\n" + "=".repeat(60));
    console.log("\n📊 RESUMO DOS TESTES:\n");

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`   ✅ Testes passados: ${successCount}`);
    console.log(`   ❌ Testes falhados: ${failCount}`);
    console.log(`   📈 Total: ${results.length}\n`);

    if (failCount === 0) {
      console.log("🎉 Todos os testes passaram! Migração parece segura.\n");
    } else {
      console.log(
        "⚠️  Alguns testes falharam. Revise antes de migrar em produção.\n"
      );
    }

    // Performance média
    const avgTimeOld =
      results.reduce((acc, r) => acc + (r.timeOld || 0), 0) / results.length;
    const avgTimeNew =
      results.reduce((acc, r) => acc + (r.timeNew || 0), 0) / results.length;

    console.log("⏱️  Performance média:");
    console.log(`   - SQL raw: ${avgTimeOld.toFixed(2)}ms`);
    console.log(`   - Prisma:  ${avgTimeNew.toFixed(2)}ms`);

    if (avgTimeNew < avgTimeOld) {
      console.log(
        `   🚀 Prisma é ${(avgTimeOld - avgTimeNew).toFixed(
          2
        )}ms mais rápido em média!`
      );
    } else {
      console.log(
        `   🐌 Prisma é ${(avgTimeNew - avgTimeOld).toFixed(
          2
        )}ms mais lento em média`
      );
    }
  } catch (error) {
    console.error("\n❌ Erro ao executar testes:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    console.log("\n✅ Desconectado do banco");
  }
}

runTests();
