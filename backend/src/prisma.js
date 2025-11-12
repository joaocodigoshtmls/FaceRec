// src/prisma.js
// Cliente Prisma configurado para o projeto

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Carrega .env explicitamente do diretório do backend (um nível acima de src/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// Configuração do Prisma Client
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  errorFormat: "pretty"
});

// Middleware removido temporariamente (versão do Prisma sem $use compatível)
// Caso precise de logging, usar event emitter via query logs (já habilitado em log: ["query"]).

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("✅ Prisma disconnected");
});

export default prisma;
