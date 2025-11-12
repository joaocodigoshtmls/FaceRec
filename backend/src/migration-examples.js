// EXEMPLO: Migração de rotas SQL → Prisma
// Este arquivo mostra exemplos de como converter queries

import prisma from "./prisma.js";
import { pool } from "./db.mjs";

// ========================================
// EXEMPLO 1: Buscar todos os alunos
// ========================================

// ❌ ANTES (SQL Raw)
async function getStudentsOld() {
  const [rows] = await pool.query("SELECT * FROM students WHERE ativo = 1");
  return rows;
}

// ✅ DEPOIS (Prisma)
async function getStudentsNew() {
  return await prisma.student.findMany({
    where: { ativo: true }
  });
}

// ========================================
// EXEMPLO 2: Buscar aluno por ID com sala
// ========================================

// ❌ ANTES (SQL Raw)
async function getStudentWithClassroomOld(id) {
  const [rows] = await pool.query(
    `
    SELECT s.*, c.name as classroom_name, c.turma, c.periodo
    FROM students s
    LEFT JOIN classrooms c ON s.classroom_id = c.id
    WHERE s.id = ?
  `,
    [id]
  );
  return rows[0];
}

// ✅ DEPOIS (Prisma)
async function getStudentWithClassroomNew(id) {
  return await prisma.student.findUnique({
    where: { id: BigInt(id) },
    include: {
      classroom: {
        select: {
          name: true,
          turma: true,
          periodo: true
        }
      }
    }
  });
}

// ========================================
// EXEMPLO 3: Criar novo aluno
// ========================================

// ❌ ANTES (SQL Raw)
async function createStudentOld(data) {
  const [result] = await pool.query(
    `
    INSERT INTO students (nome, email, matricula, classroom_id, owner_user_id, foto)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      data.nome,
      data.email,
      data.matricula,
      data.classroomId,
      data.ownerId,
      data.foto
    ]
  );

  return result.insertId;
}

// ✅ DEPOIS (Prisma)
async function createStudentNew(data) {
  const student = await prisma.student.create({
    data: {
      nome: data.nome,
      email: data.email,
      matricula: data.matricula,
      classroomId: data.classroomId ? BigInt(data.classroomId) : null,
      ownerUserId: data.ownerId ? BigInt(data.ownerId) : null,
      foto: data.foto
    }
  });

  return student.id;
}

// ========================================
// EXEMPLO 4: Atualizar aluno
// ========================================

// ❌ ANTES (SQL Raw)
async function updateStudentOld(id, data) {
  await pool.query(
    `
    UPDATE students 
    SET nome = ?, email = ?, telefone = ?, foto = ?
    WHERE id = ?
  `,
    [data.nome, data.email, data.telefone, data.foto, id]
  );
}

// ✅ DEPOIS (Prisma)
async function updateStudentNew(id, data) {
  await prisma.student.update({
    where: { id: BigInt(id) },
    data: {
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      foto: data.foto
    }
  });
}

// ========================================
// EXEMPLO 5: Deletar aluno
// ========================================

// ❌ ANTES (SQL Raw)
async function deleteStudentOld(id) {
  await pool.query("DELETE FROM students WHERE id = ?", [id]);
}

// ✅ DEPOIS (Prisma)
async function deleteStudentNew(id) {
  await prisma.student.delete({
    where: { id: BigInt(id) }
  });
}

// ========================================
// EXEMPLO 6: Buscar com paginação
// ========================================

// ❌ ANTES (SQL Raw)
async function getStudentsPaginatedOld(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `
    SELECT * FROM students 
    ORDER BY nome 
    LIMIT ? OFFSET ?
  `,
    [limit, offset]
  );

  const [count] = await pool.query("SELECT COUNT(*) as total FROM students");

  return {
    data: rows,
    total: count[0].total,
    page,
    totalPages: Math.ceil(count[0].total / limit)
  };
}

// ✅ DEPOIS (Prisma)
async function getStudentsPaginatedNew(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      skip,
      take: limit,
      orderBy: { nome: "asc" }
    }),
    prisma.student.count()
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

// ========================================
// EXEMPLO 7: Buscar com filtros
// ========================================

// ❌ ANTES (SQL Raw)
async function searchStudentsOld(search, classroomId) {
  let query = "SELECT * FROM students WHERE 1=1";
  const params = [];

  if (search) {
    query += " AND (nome LIKE ? OR matricula LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (classroomId) {
    query += " AND classroom_id = ?";
    params.push(classroomId);
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

// ✅ DEPOIS (Prisma)
async function searchStudentsNew(search, classroomId) {
  return await prisma.student.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { nome: { contains: search } },
                { matricula: { contains: search } }
              ]
            }
          : {},
        classroomId ? { classroomId: BigInt(classroomId) } : {}
      ]
    }
  });
}

// ========================================
// EXEMPLO 8: Registrar presença
// ========================================

// ❌ ANTES (SQL Raw)
async function registerAttendanceOld(studentId, confidence, deviceLabel) {
  await pool.query(
    `
    INSERT INTO attendance_logs (student_id, confidence, device_label, captured_at)
    VALUES (?, ?, ?, NOW())
  `,
    [studentId, confidence, deviceLabel]
  );
}

// ✅ DEPOIS (Prisma)
async function registerAttendanceNew(
  studentId,
  confidence,
  deviceLabel,
  classroomId = null
) {
  await prisma.attendanceLog.create({
    data: {
      studentId: BigInt(studentId),
      confidence,
      deviceLabel,
      classroomId: classroomId ? BigInt(classroomId) : null,
      capturedAt: new Date()
    }
  });
}

// ========================================
// EXEMPLO 9: Buscar presenças com aluno e sala
// ========================================

// ❌ ANTES (SQL Raw)
async function getAttendanceLogsOld(limit = 50) {
  const [rows] = await pool.query(
    `
    SELECT 
      al.*,
      s.nome as student_name,
      s.matricula,
      c.name as classroom_name
    FROM attendance_logs al
    INNER JOIN students s ON al.student_id = s.id
    LEFT JOIN classrooms c ON al.classroom_id = c.id
    ORDER BY al.captured_at DESC
    LIMIT ?
  `,
    [limit]
  );

  return rows;
}

// ✅ DEPOIS (Prisma)
async function getAttendanceLogsNew(limit = 50) {
  return await prisma.attendanceLog.findMany({
    take: limit,
    orderBy: { capturedAt: "desc" },
    include: {
      student: {
        select: {
          nome: true,
          matricula: true
        }
      },
      classroom: {
        select: {
          name: true
        }
      }
    }
  });
}

// ========================================
// EXEMPLO 10: Transações
// ========================================

// ❌ ANTES (SQL Raw)
async function createStudentAndEnrollOld(studentData, classroomId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Inserir aluno
    const [result] = await connection.query(
      `
      INSERT INTO students (nome, email, matricula, owner_user_id)
      VALUES (?, ?, ?, ?)
    `,
      [
        studentData.nome,
        studentData.email,
        studentData.matricula,
        studentData.ownerId
      ]
    );

    const studentId = result.insertId;

    // Criar matrícula
    await connection.query(
      `
      INSERT INTO enrollments (student_id, classroom_id, status)
      VALUES (?, ?, 'active')
    `,
      [studentId, classroomId]
    );

    await connection.commit();
    return studentId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ✅ DEPOIS (Prisma) - MUITO MAIS SIMPLES!
async function createStudentAndEnrollNew(studentData, classroomId) {
  return await prisma.$transaction(async (tx) => {
    // Criar aluno
    const student = await tx.student.create({
      data: {
        nome: studentData.nome,
        email: studentData.email,
        matricula: studentData.matricula,
        ownerUserId: BigInt(studentData.ownerId)
      }
    });

    // Criar matrícula
    await tx.enrollment.create({
      data: {
        studentId: student.id,
        classroomId: BigInt(classroomId),
        status: "active"
      }
    });

    return student.id;
  });
}

// ========================================
// DICAS IMPORTANTES
// ========================================

/*
1. BigInt vs Number:
   - MySQL BIGINT UNSIGNED → JavaScript BigInt
   - Sempre usar BigInt() ao passar IDs para Prisma
   - Prisma retorna BigInt, converter para Number se necessário

2. Datas:
   - MySQL DATETIME → JavaScript Date
   - Prisma converte automaticamente

3. Booleans:
   - MySQL TINYINT(1) → JavaScript boolean
   - Prisma converte automaticamente

4. NULL values:
   - Usar nullable fields no schema (?)
   - Prisma trata null corretamente

5. Relacionamentos:
   - Use include para trazer relacionamentos
   - Use select para escolher campos específicos

6. Performance:
   - Prisma faz N+1 query prevention automaticamente
   - Use include com cuidado em listas grandes
   - Considere usar select ao invés de include

7. Erros:
   - Prisma lança erros tipados (PrismaClientKnownRequestError)
   - Tratar erros específicos (P2002 = unique constraint, etc)
*/

export {
  // Funções OLD (remover depois de migrar)
  getStudentsOld,
  getStudentWithClassroomOld,
  createStudentOld,
  updateStudentOld,
  deleteStudentOld,

  // Funções NEW (usar estas!)
  getStudentsNew,
  getStudentWithClassroomNew,
  createStudentNew,
  updateStudentNew,
  deleteStudentNew,
  getStudentsPaginatedNew,
  searchStudentsNew,
  registerAttendanceNew,
  getAttendanceLogsNew,
  createStudentAndEnrollNew
};
