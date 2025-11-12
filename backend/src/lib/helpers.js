// src/lib/helpers.js
// Funções utilitárias reutilizáveis

/**
 * Converte BigInt para Number em um objeto
 * Útil para serializar responses do Prisma
 */
export function bigIntToNumber(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(bigIntToNumber);
  }

  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = bigIntToNumber(value);
    }
    return result;
  }

  return obj;
}

/**
 * Cria objeto de paginação padrão
 */
export function createPaginationResponse(data, total, page, limit) {
  return {
    data: bigIntToNumber(data),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

/**
 * Handler de erros do Prisma
 * Converte erros do Prisma em respostas HTTP
 */
export function handlePrismaError(error, res) {
  console.error("Prisma Error:", error);

  // Erro de violação de unique constraint
  if (error.code === "P2002") {
    const field = error.meta?.target?.[0] || "campo";
    return res.status(409).json({
      error: `Já existe um registro com este ${field}`
    });
  }

  // Erro de registro não encontrado
  if (error.code === "P2025") {
    return res.status(404).json({
      error: "Registro não encontrado"
    });
  }

  // Erro de foreign key
  if (error.code === "P2003") {
    return res.status(400).json({
      error: "Referência inválida (foreign key)"
    });
  }

  // Erro de conexão
  if (error.code === "P1001") {
    return res.status(503).json({
      error: "Erro de conexão com banco de dados"
    });
  }

  // Erro genérico
  return res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? error.message : undefined
  });
}

/**
 * Sanitiza dados de entrada (remove campos não permitidos)
 */
export function sanitizeInput(data, allowedFields) {
  const sanitized = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }

  return sanitized;
}

/**
 * Formata data para o padrão brasileiro
 */
export function formatDateBR(date) {
  if (!date) return null;

  const d = new Date(date);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Verifica se um valor está vazio (null, undefined, string vazia)
 */
export function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

/**
 * Cria resposta de sucesso padronizada
 */
export function successResponse(
  data,
  message = "Operação realizada com sucesso"
) {
  return {
    success: true,
    message,
    data: bigIntToNumber(data)
  };
}

/**
 * Cria resposta de erro padronizada
 */
export function errorResponse(message, details = null) {
  const response = {
    success: false,
    error: message
  };

  if (details && process.env.NODE_ENV === "development") {
    response.details = details;
  }

  return response;
}

/**
 * Sleep (útil para testes)
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gera matrícula aleatória (para testes)
 */
export function generateMatricula() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${year}${random}`;
}
