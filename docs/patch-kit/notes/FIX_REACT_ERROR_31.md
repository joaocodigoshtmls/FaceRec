# 🔴 React Error #31: Renderizar Objeto no JSX

**Erro**: `Objects are not valid as a React child`

---

## ❌ O PROBLEMA

```jsx
// ❌ ERRADO: Renderizando objeto
const [error, setError] = useState({ code: 'EMAIL_CONFLICT', message: 'Email exists' });

return (
  <div>
    {error}  {/* ← React Error #31: Objects are not valid as a React child */}
  </div>
);
```

**Saída**: React quebra com erro genérico.

---

## ✅ A SOLUÇÃO

### Opção 1: Extrair apenas string
```jsx
// ✅ CORRETO: Renderizar apenas a mensagem (string)
const [errorMessage, setErrorMessage] = useState('');

return (
  <div>
    {errorMessage}  {/* ✅ String - funciona */}
  </div>
);

// Ao tratar erro:
catch (error) {
  setErrorMessage(error.message);  // Extrair string
}
```

### Opção 2: Renderizar com JSON.stringify (para debug)
```jsx
// ⚠️ Para DEBUG apenas (nunca em produção)
return (
  <pre>
    {JSON.stringify(error, null, 2)}  {/* ✅ String (stringificada) */}
  </pre>
);
```

### Opção 3: Renderizar campos específicos
```jsx
// ✅ CORRETO: Renderizar cada campo necessário
const [error, setError] = useState({ code: '', message: '' });

return (
  <div>
    <p>Código: {error.code}</p>  {/* ✅ String */}
    <p>Mensagem: {error.message}</p>  {/* ✅ String */}
  </div>
);
```

---

## 📋 TIPOS QUE REACT NÃO ACEITA

```jsx
// ❌ Não funciona (Error #31)
{object}                // { code: 'x', message: 'y' }
{[object]}              // Array de objetos
{null}                  // null (sim, não funciona. Use falsy check)
{undefined}             // undefined (idem)
{function}              // Função
{Symbol}                // Symbol
{Promise}               // Promise (async...)
{new Date()}            // Date object

// ✅ Funciona (tipos válidos)
{string}                // "Hello"
{number}                // 42
{true}                  // boolean (renderiza "true")
{false}                 // boolean (renderiza "false")
{'content'}             // JSX
{[string, number]}      // Array de strings/números
{null}                  // null (renderiza nothing - use if)
{undefined}             // undefined (renderiza nothing - use if)
```

---

## 🛠️ PADRÃO: Estados Separados

**Melhor prática**: Separe objeto em campos renderizáveis:

```jsx
// ❌ ANTIPADRÃO
const [response, setResponse] = useState(null);

return (
  <div>
    {response}  {/* Error #31 se response for objeto */}
  </div>
);

// ✅ PADRÃO CORRETO
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
const [errorCode, setErrorCode] = useState('');
const [successMessage, setSuccessMessage] = useState('');

// Ou, se quiser um objeto, extraia strings:
const [apiResponse, setApiResponse] = useState(null);

// Renderize apenas strings
{apiResponse?.message && <p>{apiResponse.message}</p>}
{apiResponse?.code && <p>Código: {apiResponse.code}</p>}
```

---

## 🎯 CASO DE USO: Formulário de Registro

### ❌ ANTES (quebra React)
```jsx
export default function Cadastro() {
  const [error, setError] = useState(null);

  async function handleSubmit() {
    try {
      const result = await registerUser(data);
      setError(result);  // ← Error! result é objeto
    } catch (e) {
      setError(e);  // ← Error! e é objeto
    }
  }

  return (
    <div>
      {error}  {/* ← React Error #31 */}
    </div>
  );
}
```

### ✅ DEPOIS (funciona)
```jsx
export default function Cadastro() {
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit() {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await registerUser(data);

      if (result.ok) {
        setSuccessMessage('Cadastrado com sucesso!');
        return;
      }

      // Extrair mensagem de erro (string)
      setErrorMessage(result.message || 'Erro desconhecido');
    } catch (e) {
      // Extrair apenas a mensagem
      setErrorMessage(
        typeof e === 'string' ? e : e?.message || 'Erro inesperado'
      );
    }
  }

  return (
    <div>
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
      {successMessage && <p className="text-green-600">{successMessage}</p>}
    </div>
  );
}
```

---

## 🧪 TESTE: Como reproduzir o erro

```jsx
// Copie e cole em um componente React
export default function TestError() {
  return (
    <div>
      {/* ❌ Error #31 */}
      {Math.max(1, 2)}  {/* ✅ OK - retorna número */}
      {{ a: 1 }}        {/* ❌ ERRO - objeto */}
    </div>
  );
}
```

---

## 📚 REFERÊNCIA

| Tipo | Renderizável? | Exemplo | Solução |
|------|---------------|---------|---------|
| string | ✅ Sim | `"Hello"` | Use direto |
| number | ✅ Sim | `42` | Use direto |
| boolean | ✅ Sim | `true` | Use direto |
| object | ❌ Não | `{a: 1}` | Extraia campo: `obj.a` |
| array (strings) | ✅ Sim | `["a", "b"]` | Renderiza "ab" |
| array (objects) | ❌ Não | `[{a:1}]` | Map + key |
| null | ⚠️ Renderiza "" | `null` | Use condicional |
| undefined | ⚠️ Renderiza "" | `undefined` | Use condicional |
| Promise | ❌ Não | `fetch()...` | Await ou .then() |

---

## 💡 DICA: Usar TypeScript

Se usar TypeScript, tipo força renderizável:

```tsx
// ❌ TypeScript error (ajuda prevenir)
const [message, setMessage] = useState<object>({});
return <p>{message}</p>;  // ← TS erro antes de rodar

// ✅ Correto
const [message, setMessage] = useState<string>('');
return <p>{message}</p>;  // ← TS OK
```

---

## 🚀 CHECKLIST: Corrigir seu código

- [ ] Todos `setState` estão guardando **strings**, não objetos
- [ ] Todo `{variable}` no JSX é **string/number/boolean**, não objeto
- [ ] Para erros, use `setState(error.message)` não `setState(error)`
- [ ] Para API response, extraia `{response?.message}` não `{response}`
- [ ] Testes no DevTools: F12 → Console, sem "Objects are not valid"

---

**Status**: ✅ Corrigido  
**Causa**: Renderizar objeto no JSX  
**Solução**: Extrair string (`.message`, `.code`, etc.)  
**Prevenção**: TypeScript + useState<string>
