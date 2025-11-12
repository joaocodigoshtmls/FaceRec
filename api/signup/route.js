// api/signup/route.js - Alias para /api/auth/register
// Mesmos handlers, rota alternativa /api/signup
// Import dos handlers do arquivo principal

import { OPTIONS as registerOptions, POST as registerPost } from '../auth/register-v2.js';

export const OPTIONS = registerOptions;
export const POST = registerPost;
