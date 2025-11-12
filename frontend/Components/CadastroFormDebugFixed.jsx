/**
 * frontend/Components/CadastroFormDebugFixed.jsx
 * 
 * ✅ Corrige React #31: Nunca renderize objeto no JSX
 * ✅ Usa URL absoluta para backend em AlwaysData
 * ✅ Tratamento de erro seguro (string only)
 * 
 * .jsx (JavaScript, não TypeScript)
 */

import { useState } from 'react';
import { registerUser } from '../lib/api-absolute-url.js';

export default function CadastroFormDebugFixed() {
  // Estados para formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  // Estados para erro/sucesso
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ===== Handler: Mudança de input =====
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro deste campo quando usuário corrige
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }

  // ===== Handler: Submit =====
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setLoading(true);

    try {
      // Validação básica front
      if (formData.password !== formData.passwordConfirm) {
        setErrorMessage('As senhas não coincidem');
        setLoading(false);
        return;
      }

      // Chamar API (com URL absoluta se configurada)
      console.log('📝 Enviando formulário:', {
        url: 'registerUser()',
        data: { name: formData.name, email: formData.email, password: '***' },
      });

      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // ✅ Sucesso (201)
      if (result.ok) {
        console.log('✅ Cadastro sucesso:', result.user);
        setSuccessMessage(
          `Bem-vindo, ${result.user?.name || 'usuário'}! Redirecionando para login...`
        );
        setFormData({
          name: '',
          email: '',
          password: '',
          passwordConfirm: '',
        });
        // TODO: Redirecionar para /login após 2s
        // setTimeout(() => router.push('/login'), 2000);
        return;
      }

      // ⚠️ Email duplicado (409)
      if (result.code === 'EMAIL_CONFLICT') {
        setErrorMessage(result.message || 'Este e-mail já está cadastrado');
        return;
      }

      // ⚠️ Validação falhou (422)
      if (result.code === 'VALIDATION_ERROR') {
        if (result.issues && Array.isArray(result.issues)) {
          // Mapear erros por campo
          const fieldErrs = {};
          result.issues.forEach((issue) => {
            fieldErrs[issue.field] = issue.message;
          });
          setFieldErrors(fieldErrs);
          setErrorMessage('Corrija os erros abaixo');
        } else {
          setErrorMessage(result.message || 'Dados inválidos');
        }
        return;
      }

      // 🔴 Outro erro
      setErrorMessage(
        result.message || 'Erro desconhecido. Tente novamente mais tarde.'
      );
    } catch (error) {
      // 🔴 Erro de catch (não deve acontecer, mas por segurança)
      console.error('❌ Erro no catch:', error);
      setErrorMessage(
        typeof error === 'string'
          ? error
          : error?.message || 'Erro inesperado'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Cadastrar</h2>

      {/* ✅ Mensagem de SUCESSO (string only) */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded text-green-700 text-sm">
          ✓ {successMessage}
        </div>
      )}

      {/* ✅ Mensagem de ERRO (string only) */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
          ✗ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo: Nome */}
        <div>
          <label className="block text-sm font-medium mb-1">Nome Completo</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="João da Silva"
            className={`w-full px-3 py-2 border rounded focus:outline-none ${
              fieldErrors.name
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            disabled={loading}
          />
          {/* Erro específico do campo (string only) */}
          {fieldErrors.name && (
            <p className="text-red-600 text-xs mt-1">⚠ {fieldErrors.name}</p>
          )}
        </div>

        {/* Campo: Email */}
        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="joao@example.com"
            className={`w-full px-3 py-2 border rounded focus:outline-none ${
              fieldErrors.email
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            disabled={loading}
          />
          {fieldErrors.email && (
            <p className="text-red-600 text-xs mt-1">⚠ {fieldErrors.email}</p>
          )}
        </div>

        {/* Campo: Senha */}
        <div>
          <label className="block text-sm font-medium mb-1">Senha</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            className={`w-full px-3 py-2 border rounded focus:outline-none ${
              fieldErrors.password
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            disabled={loading}
          />
          {fieldErrors.password && (
            <p className="text-red-600 text-xs mt-1">
              ⚠ {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Campo: Confirmação Senha */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Confirmar Senha
          </label>
          <input
            type="password"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleInputChange}
            placeholder="••••••••"
            className={`w-full px-3 py-2 border rounded focus:outline-none ${
              formData.passwordConfirm && formData.password !== formData.passwordConfirm
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            disabled={loading}
          />
          {formData.passwordConfirm &&
            formData.password !== formData.passwordConfirm && (
              <p className="text-red-600 text-xs mt-1">
                ⚠ As senhas não coincidem
              </p>
            )}
        </div>

        {/* Botão Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded font-medium transition ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? '⏳ Enviando...' : '📝 Cadastrar'}
        </button>
      </form>

      {/* Debug: Mostrar estado (opcional) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-500">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(
              {
                formData: { ...formData, password: '***' },
                errorMessage,
                fieldErrors,
                loading,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
