# 🌗 Guia de Tema (Claro/Escuro)

A interface agora suporta alternância entre os modos claro e escuro. O botão fica na barra superior (desktop e mobile) e persiste a preferência no `localStorage`.

## Componentes principais

| Arquivo | Função |
| --- | --- |
| `frontend/contexts/ThemeContext.jsx` | Resolve o tema inicial (localStorage → sistema) e expõe `useTheme()` com `theme`, `isLight`, `isDark`, `toggleTheme()` e `setTheme()` |
| `frontend/Components/Navbar.jsx` | Exibe o botão de alternância com ícones `Sun`/`Moon` (desktop + mobile) |
| `frontend/index.css` | Usa variáveis CSS para superfícies/inputs e define overrides para `[data-theme="light"]` |

## Como funciona

1. `ThemeProvider` envolve o app em `frontend/main.jsx` e sincroniza:
   - `document.documentElement.dataset.theme = "light" | "dark"`
   - Classe `theme-holo` no `<body>` (aplica overrides existentes para fundos claros)
   - Preferência no `localStorage` (`facerec-theme`).
2. O botão chama `toggleTheme()` e atualiza instantaneamente UI + persistência.
3. As páginas/tailwind utilities usam `rgb(var(--text))`, `rgb(var(--card))`, etc., então basta alterar `:root` ou `[data-theme='light']` para ajustar a paleta.

## Customização rápida

- **Adicionar novo controle**: importe `useTheme` e chame `toggleTheme()`.
- **Ajustar cores**: edite os valores de `--bg`, `--card`, `--text`, `--input-*` em `frontend/index.css` (blocos `:root` e `[data-theme='light']`).
- **Estender estilos claros**: utilize o seletor `.theme-holo ...` para sobrescrever utilitários/tailwind específicos quando o modo claro estiver ativo.

> Dica: se quiser seguir o sistema do usuário, basta remover a chave `facerec-theme` do `localStorage` (o provider volta a obedecer `prefers-color-scheme`).
