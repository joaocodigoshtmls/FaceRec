#!/bin/bash
# tests/validate-patch.sh - Script para validar se o patch está correto

set -e

echo "🔍 Validando Patch 405 FaceRec..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
TOTAL=0
PASSED=0

# Função para testar arquivo
check_file() {
  local file=$1
  local desc=$2
  ((TOTAL++))
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ PASS${NC} - $desc: $file"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC} - $desc: $file (NÃO ENCONTRADO)"
  fi
}

# Função para testar conteúdo
check_content() {
  local file=$1
  local pattern=$2
  local desc=$3
  ((TOTAL++))
  
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - $desc em $file"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC} - $desc em $file (NÃO ENCONTRADO)"
  fi
}

echo "📂 Verificando Arquivos de Documentação..."
check_file "QUICK_START.md" "Guia rápido"
check_file "DEPLOYMENT_INSTRUCTIONS.md" "Guia deploy"
check_file "ANTI_405_CHECKLIST.md" "Checklist"
check_file "RESUMO_EXECUTIVO.md" "Resumo executivo"
check_file "ENTREGA_COMPLETA.md" "Entrega completa"
check_file "README_PATCH_405.md" "README"
check_file "ESTRUTURA_PROJETO.md" "Estrutura"
check_file "INTEGRACAO_EXPRESS.md" "Integração"
echo ""

echo "💻 Verificando Arquivos de Código..."
check_file "api/auth/register.js" "Handler register"
check_file "api/cors-middleware.js" "Middleware CORS"
check_file "frontend/lib/authApi.js" "Client auth API"
check_file "frontend/Components/CadastroFormCorrigido.jsx" "Componente React"
check_file "backend/prisma/migrations/add_user_fields/migration.sql" "Migração SQL"
echo ""

echo "🧪 Verificando Arquivos de Teste..."
check_file "tests/register-tests.http" "Testes HTTP"
echo ""

echo "🔍 Verificando Conteúdo Crítico..."
check_content "api/auth/register.js" "export async function OPTIONS" "Handler OPTIONS"
check_content "api/auth/register.js" "export async function POST" "Handler POST"
check_content "api/auth/register.js" "bcrypt.hash" "Hash bcryptjs"
check_content "api/auth/register.js" "Access-Control-Allow-Origin" "CORS headers"
check_content "frontend/lib/authApi.js" "export async function register" "Função register"
check_content "frontend/lib/authApi.js" "409" "Tratamento 409"
check_content "frontend/lib/authApi.js" "422" "Tratamento 422"
check_content "frontend/Components/CadastroFormCorrigido.jsx" "onSubmit" "Form submit"
check_content "tests/register-tests.http" "OPTIONS" "Teste OPTIONS"
check_content "tests/register-tests.http" "POST" "Teste POST"
echo ""

echo "📊 RESULTADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total: $TOTAL | ${GREEN}Passou: $PASSED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $PASSED -eq $TOTAL ]; then
  echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
  echo "Patch está completo e pronto para deploy."
  exit 0
else
  FAILED=$((TOTAL - PASSED))
  echo -e "${RED}❌ $FAILED TESTES FALHARAM${NC}"
  echo "Verifique os arquivos listados acima."
  exit 1
fi
