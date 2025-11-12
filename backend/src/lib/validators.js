// src/lib/validators.js
// Funções de validação reutilizáveis para o projeto

/**
 * Valida se um ID é válido (número positivo)
 */
export function validateId(id) {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;

  if (isNaN(numId) || numId <= 0) {
    throw new Error(`ID inválido: ${id}`);
  }

  return BigInt(numId);
}

/**
 * Valida email
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida dados de estudante
 */
export function validateStudentData(data) {
  const errors = [];

  if (!data.nome || data.nome.trim().length < 3) {
    errors.push("Nome deve ter pelo menos 3 caracteres");
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push("Email inválido");
  }

  if (data.classroomId) {
    try {
      validateId(data.classroomId);
    } catch {
      errors.push("classroom_id inválido");
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return true;
}

/**
 * Valida dados de sala de aula
 */
export function validateClassroomData(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Nome da sala deve ter pelo menos 2 caracteres");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return true;
}

/**
 * Valida parâmetros de paginação
 */
export function validatePagination(page, limit) {
  const numPage = parseInt(page, 10) || 1;
  const numLimit = parseInt(limit, 10) || 10;

  if (numPage < 1) {
    throw new Error("Página deve ser >= 1");
  }

  if (numLimit < 1 || numLimit > 100) {
    throw new Error("Limit deve estar entre 1 e 100");
  }

  return {
    page: numPage,
    limit: numLimit,
    skip: (numPage - 1) * numLimit
  };
}

/**
 * Valida dados de registro de presença
 */
export function validateAttendanceData(data) {
  const errors = [];

  if (!data.studentId) {
    errors.push("student_id é obrigatório");
  } else {
    try {
      validateId(data.studentId);
    } catch {
      errors.push("student_id inválido");
    }
  }

  if (data.confidence !== undefined) {
    const conf = parseFloat(data.confidence);
    if (isNaN(conf) || conf < 0 || conf > 1) {
      errors.push("confidence deve estar entre 0 e 1");
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return true;
}
