// frontend/Components/CadastroForm.jsx - Formulário de cadastro com tratamento de erro 409/422

import { useState } from 'react';
import { register } from '../lib/authApi';

export default function CadastroForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    subject: '',
    school: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpar erro do campo ao editar
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccess(null);

    // Validação client-side básica
    if (formData.password !== formData.passwordConfirm) {
      setError('Senhas não conferem');
      setLoading(false);
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      subject: formData.subject,
      school: formData.school,
    });

    setLoading(false);

    if (!result.ok) {
      // Tratar erro 409 (email duplicado)
      if (result.code === 'CONFLICT') {
        setError(result.message);
        setFieldErrors({ email: 'Email já cadastrado' });
        return;
      }

      // Tratar erro 422 (validação)
      if (result.code === 'VALIDATION_ERROR' && result.issues?.length > 0) {
        const errors = {};
        result.issues.forEach(issue => {
          errors[issue.field] = issue.message;
        });
        setFieldErrors(errors);
        setError('Há erros no formulário');
        return;
      }

      // Outro erro
      setError(result.message || 'Erro desconhecido');
      return;
    }

    // Sucesso!
    setSuccess(result.message);
    setFormData({ name: '', email: '', password: '', passwordConfirm: '', subject: '', school: '' });
    
    if (onSuccess) {
      onSuccess(result.user);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cadastro-form">
      <h2>Cadastro</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-group">
        <label htmlFor="name">Nome *</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          className={fieldErrors.name ? 'input-error' : ''}
        />
        {fieldErrors.name && <span className="error-text">{fieldErrors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">E-mail *</label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          className={fieldErrors.email ? 'input-error' : ''}
        />
        {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Senha (min 8 caracteres) *</label>
        <input
          id="password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          className={fieldErrors.password ? 'input-error' : ''}
        />
        {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="passwordConfirm">Confirmar Senha *</label>
        <input
          id="passwordConfirm"
          type="password"
          name="passwordConfirm"
          placeholder="••••••••"
          value={formData.passwordConfirm}
          onChange={handleChange}
          disabled={loading}
          className={fieldErrors.passwordConfirm ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject">Disciplina (opcional)</label>
        <input
          id="subject"
          type="text"
          name="subject"
          placeholder="Ex: Matemática"
          value={formData.subject}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="school">Escola (opcional)</label>
        <input
          id="school"
          type="text"
          name="school"
          placeholder="Nome da escola"
          value={formData.school}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Criando conta...' : 'Cadastrar'}
      </button>
    </form>
  );
}

// Estilos sugeridos (adicionar ao CSS global ou ao arquivo styles.css)
const styleSheet = `
.cadastro-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.cadastro-form h2 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input.input-error {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.error-text {
  display: block;
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.alert {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`;
