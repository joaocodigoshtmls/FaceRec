// tests/validate-patch.test.js - Testes unitários para validar o patch

/**
 * Execute com:
 * npm install --save-dev jest node-fetch
 * npm test -- validate-patch.test.js
 */

const fs = require('fs');
const path = require('path');

describe('Validação do Patch 405 FaceRec', () => {
  const projectRoot = path.join(__dirname, '..');

  describe('Arquivos de Documentação', () => {
    test('QUICK_START.md deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'QUICK_START.md'))).toBe(true);
    });

    test('DEPLOYMENT_INSTRUCTIONS.md deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'DEPLOYMENT_INSTRUCTIONS.md'))).toBe(true);
    });

    test('ANTI_405_CHECKLIST.md deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'ANTI_405_CHECKLIST.md'))).toBe(true);
    });

    test('README_PATCH_405.md deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'README_PATCH_405.md'))).toBe(true);
    });

    test('RESUMO_EXECUTIVO.md deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'RESUMO_EXECUTIVO.md'))).toBe(true);
    });
  });

  describe('Arquivos de Código', () => {
    test('api/auth/register.js deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'api/auth/register.js'))).toBe(true);
    });

    test('api/cors-middleware.js deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'api/cors-middleware.js'))).toBe(true);
    });

    test('frontend/lib/authApi.js deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'frontend/lib/authApi.js'))).toBe(true);
    });

    test('frontend/Components/CadastroFormCorrigido.jsx deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'frontend/Components/CadastroFormCorrigido.jsx'))).toBe(true);
    });

    test('backend/prisma/migrations/add_user_fields/migration.sql deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'backend/prisma/migrations/add_user_fields/migration.sql'))).toBe(true);
    });
  });

  describe('Conteúdo de Código', () => {
    test('register.js deve exportar função OPTIONS', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).toMatch(/export\s+async\s+function\s+OPTIONS/);
    });

    test('register.js deve exportar função POST', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).toMatch(/export\s+async\s+function\s+POST/);
    });

    test('register.js deve ter headers CORS', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).toMatch(/Access-Control-Allow-Origin/);
      expect(content).toMatch(/Access-Control-Allow-Methods/);
      expect(content).toMatch(/Access-Control-Allow-Headers/);
    });

    test('register.js deve usar bcrypt.hash', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).toMatch(/bcrypt\.hash\(password,\s*10\)/);
    });

    test('register.js deve verificar email único', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).toMatch(/SELECT.*FROM.*users.*WHERE.*email/i);
    });

    test('authApi.js deve exportar função register', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/lib/authApi.js'), 'utf8');
      expect(content).toMatch(/export\s+async\s+function\s+register/);
    });

    test('authApi.js deve tratar erro 409', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/lib/authApi.js'), 'utf8');
      expect(content).toMatch(/409.*Conflict|CONFLICT|email.*already.*registered/i);
    });

    test('authApi.js deve tratar erro 422', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/lib/authApi.js'), 'utf8');
      expect(content).toMatch(/422.*validation|VALIDATION_ERROR/i);
    });

    test('CadastroForm.jsx deve ser componente React', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/Components/CadastroFormCorrigido.jsx'), 'utf8');
      expect(content).toMatch(/export\s+default\s+function\s+\w+/);
      expect(content).toMatch(/useState/);
    });

    test('CadastroForm.jsx deve ter validação de email duplicado', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/Components/CadastroFormCorrigido.jsx'), 'utf8');
      expect(content).toMatch(/CONFLICT|409|email.*já.*cadastrado/i);
    });
  });

  describe('Arquivos de Teste', () => {
    test('register-tests.http deve existir', () => {
      expect(fs.existsSync(path.join(projectRoot, 'tests/register-tests.http'))).toBe(true);
    });

    test('register-tests.http deve ter teste de preflight OPTIONS', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'tests/register-tests.http'), 'utf8');
      expect(content).toMatch(/OPTIONS.*api\/auth\/register/);
    });

    test('register-tests.http deve ter teste de POST sucesso', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'tests/register-tests.http'), 'utf8');
      expect(content).toMatch(/POST.*api\/auth\/register.*[\s\S]*201/);
    });

    test('register-tests.http deve ter teste de validação', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'tests/register-tests.http'), 'utf8');
      expect(content).toMatch(/POST.*[\s\S]*422|validação/i);
    });

    test('register-tests.http deve ter teste de conflito 409', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'tests/register-tests.http'), 'utf8');
      expect(content).toMatch(/409.*conflict|email.*duplicado/i);
    });
  });

  describe('Validação de Migração DB', () => {
    test('migration.sql deve criar tabela users', () => {
      const content = fs.readFileSync(
        path.join(projectRoot, 'backend/prisma/migrations/add_user_fields/migration.sql'),
        'utf8'
      );
      expect(content).toMatch(/CREATE\s+TABLE.*users/i);
    });

    test('migration.sql deve ter campo email unique', () => {
      const content = fs.readFileSync(
        path.join(projectRoot, 'backend/prisma/migrations/add_user_fields/migration.sql'),
        'utf8'
      );
      expect(content).toMatch(/email.*UNIQUE|UNIQUE.*email/i);
    });

    test('migration.sql deve ter campo password_hash', () => {
      const content = fs.readFileSync(
        path.join(projectRoot, 'backend/prisma/migrations/add_user_fields/migration.sql'),
        'utf8'
      );
      expect(content).toMatch(/password_hash/i);
    });
  });

  describe('Validação de Documentação', () => {
    test('QUICK_START.md deve ter 5 passos', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'QUICK_START.md'), 'utf8');
      expect(content).toMatch(/## .*5/i);
    });

    test('DEPLOYMENT_INSTRUCTIONS.md deve ter checklist', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'DEPLOYMENT_INSTRUCTIONS.md'), 'utf8');
      expect(content).toMatch(/checklist|✓|check/i);
    });

    test('ANTI_405_CHECKLIST.md deve ter testes curl', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'ANTI_405_CHECKLIST.md'), 'utf8');
      expect(content).toMatch(/curl|httpie|test/i);
    });

    test('RESUMO_EXECUTIVO.md deve explicar o problema', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'RESUMO_EXECUTIVO.md'), 'utf8');
      expect(content).toMatch(/405|method.*not.*allowed|problema/i);
    });
  });

  describe('Linhas de Código', () => {
    test('register.js deve ter pelo menos 200 linhas', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeGreaterThanOrEqual(200);
    });

    test('authApi.js deve ter pelo menos 50 linhas', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/lib/authApi.js'), 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeGreaterThanOrEqual(50);
    });

    test('CadastroForm.jsx deve ter pelo menos 100 linhas', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/Components/CadastroFormCorrigido.jsx'), 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeGreaterThanOrEqual(100);
    });

    test('register-tests.http deve ter pelo menos 100 linhas', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'tests/register-tests.http'), 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Completude', () => {
    test('Não deve ter "..." em register.js (código incompleto)', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      // Permitir ... em comentários/strings, mas não em código
      const codeLines = content.split('\n').filter(line => !line.trim().startsWith('//'));
      const hasIncomplete = codeLines.some(line => line.match(/\.\.\.\s*$/));
      expect(hasIncomplete).toBe(false);
    });

    test('Não deve ter "..." em authApi.js (código incompleto)', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/lib/authApi.js'), 'utf8');
      const codeLines = content.split('\n').filter(line => !line.trim().startsWith('//'));
      const hasIncomplete = codeLines.some(line => line.match(/\.\.\.\s*$/));
      expect(hasIncomplete).toBe(false);
    });

    test('register.js deve ter todos os status HTTP esperados', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).toMatch(/201/); // Created
      expect(content).toMatch(/204/); // No Content (OPTIONS)
      expect(content).toMatch(/409/); // Conflict
      expect(content).toMatch(/422/); // Validation
      expect(content).toMatch(/500/); // Error
    });

    test('authApi.js deve ter todos os tratamentos de erro', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'frontend/lib/authApi.js'), 'utf8');
      expect(content).toMatch(/409/);
      expect(content).toMatch(/422/);
      expect(content).toMatch(/500/);
    });
  });

  describe('Segurança', () => {
    test('register.js não deve ter senha em texto plano', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).not.toMatch(/password_hash\s*:\s*password/i);
      expect(content).toMatch(/bcrypt\.hash/);
    });

    test('register.js deve validar entrada', () => {
      const content = fs.readFileSync(path.join(projectRoot, 'api/auth/register.js'), 'utf8');
      expect(content).toMatch(/validate|check|trim|normalize/i);
    });

    test('Não deve ter credenciais em código', () => {
      const filesToCheck = [
        'api/auth/register.js',
        'frontend/lib/authApi.js',
        'tests/register-tests.http'
      ];

      filesToCheck.forEach(file => {
        const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
        expect(content).not.toMatch(/password[=:]\s*"[^"]*"/i);
        expect(content).not.toMatch(/SECRET[=:]\s*"[^"]*"/i);
      });
    });
  });
});

describe('Integração', () => {
  test('register.js deve importar bcrypt', () => {
    const content = fs.readFileSync(path.join(__dirname, '../api/auth/register.js'), 'utf8');
    expect(content).toMatch(/import.*bcrypt|require.*bcrypt/);
  });

  test('authApi.js deve usar axios ou fetch', () => {
    const content = fs.readFileSync(path.join(__dirname, '../frontend/lib/authApi.js'), 'utf8');
    expect(content).toMatch(/api\.post|fetch|axios/);
  });

  test('CadastroForm.jsx deve importar authApi', () => {
    const content = fs.readFileSync(path.join(__dirname, '../frontend/Components/CadastroFormCorrigido.jsx'), 'utf8');
    expect(content).toMatch(/import.*authApi|register.*from/i);
  });
});
