// scripts/backup-db.js
// Cria backup do banco de dados MySQL

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const execAsync = promisify(exec);

// Parsing DATABASE_URL
// Formato: mysql://user:password@host:port/database
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL não encontrada no .env");
  process.exit(1);
}

const urlRegex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = dbUrl.match(urlRegex);

if (!match) {
  console.error("❌ Formato de DATABASE_URL inválido");
  console.error("   Esperado: mysql://user:password@host:port/database");
  process.exit(1);
}

const [, user, password, host, port, database] = match;

console.log("💾 Script de Backup do Banco de Dados\n");
console.log("📊 Informações do banco:");
console.log(`   Host: ${host}`);
console.log(`   Database: ${database}`);
console.log(`   User: ${user}`);
console.log();

async function createBackup() {
  try {
    // Criar pasta de backups se não existir
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`📁 Pasta de backups criada: ${backupDir}\n`);
    }

    // Nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${database}_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    console.log("🔄 Criando backup...");
    console.log(`   Arquivo: ${filename}\n`);

    // Comando mysqldump
    const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > "${filepath}"`;

    // Windows: tentar usar cmd
    const isWindows = process.platform === "win32";
    const finalCommand = isWindows ? `cmd /c "${command}"` : command;

    const { stdout, stderr } = await execAsync(finalCommand, {
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });

    if (stderr && !stderr.toLowerCase().includes("warning")) {
      console.warn("⚠️  Avisos:", stderr);
    }

    // Verificar se arquivo foi criado
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      console.log("✅ Backup criado com sucesso!");
      console.log(`   Tamanho: ${sizeMB} MB`);
      console.log(`   Local: ${filepath}\n`);

      // Listar últimos backups
      const backups = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("backup_") && f.endsWith(".sql"))
        .sort()
        .reverse();

      console.log("📋 Últimos backups:");
      backups.slice(0, 5).forEach((file, i) => {
        const stats = fs.statSync(path.join(backupDir, file));
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   ${i + 1}. ${file} (${sizeMB} MB)`);
      });

      if (backups.length > 10) {
        console.log(
          `\n💡 Você tem ${backups.length} backups. Considere deletar os mais antigos.`
        );
      }
    } else {
      console.error("❌ Arquivo de backup não foi criado!");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Erro ao criar backup:");
    console.error(error.message);

    if (error.message.includes("mysqldump")) {
      console.error(
        "\n💡 Dica: mysqldump não está instalado ou não está no PATH"
      );
      console.error("   Instale o MySQL Client ou adicione ao PATH do sistema");
      console.error("\n   Windows: Baixe MySQL Installer");
      console.error("   Linux: sudo apt install mysql-client");
      console.error("   Mac: brew install mysql-client");
    }

    process.exit(1);
  }
}

createBackup();
