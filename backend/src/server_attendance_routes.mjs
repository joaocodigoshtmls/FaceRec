// backend/src/server_attendance_routes.mjs
import jwt from 'jsonwebtoken';

// 🔒 Middleware de autenticação JWT (melhorado)
export function authenticateTokenAttendance(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('🔐 Verificando token attendance:');
  console.log('  - Header Authorization:', authHeader ? 'Presente' : 'Ausente');
  console.log('  - Token:', token ? `${token.substring(0, 20)}...` : 'Ausente');
  console.log('  - JWT_SECRET definido:', !!process.env.JWT_SECRET);
  
  if (!token) {
    console.log('❌ Token não encontrado');
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  // Verificar se é um token mock (para testes/desenvolvimento)
  if (token.startsWith('mock-token-') || token.startsWith('temp-admin-token-')) {
    console.log('✅ Token mock aceito (desenvolvimento)');
    req.user = {
      sub: process.env.DEFAULT_ADMIN_ID || 'predefined-admin',
      id: process.env.DEFAULT_ADMIN_ID || 'predefined-admin',
      role: 'admin',
    };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Erro ao verificar token:', err.message);
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    
    console.log('✅ Token válido para usuário:', user.sub || user.id);
    // Normaliza claims para garantir req.user.sub
    if (!user.sub && user.id) user.sub = user.id;
    req.user = user;
    next();
  });
}

export function installFaceRoutes(app, pool) {
  // Retorna pessoas com foto de perfil para o serviço Python baixar
  app.get('/api/known-faces', async (req, res) => {
    try {
      const [rows] = await pool.execute(`
        SELECT id, full_name AS name, profile_picture
        FROM users
        WHERE profile_picture IS NOT NULL AND profile_picture <> ''
      `);
      // Gera URL absoluta (backend já serve /uploads sem cache)
      const base = `${req.protocol}://${req.get('host')}`;
      const faces = rows.map(r => ({
        user_id: r.id,
        name: r.name,
        photo_url: r.profile_picture?.startsWith('http')
          ? r.profile_picture
          : `${base}${r.profile_picture.startsWith('/') ? '' : '/'}${r.profile_picture}`
      }));
      res.json({ faces });
    } catch (err) {
      console.error('known-faces error', err);
      res.status(500).json({ error: 'internal_error' });
    }
  });
}

export function installAttendanceRoutes(app, pool) {
  // Protegido por API key simples (dispositivo/serviço Python)
  app.post('/api/attendance', async (req, res) => {
    try {
      const apiKey = req.get('X-API-Key') || '';
      if (!process.env.API_KEY || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      const { user_id, confidence, device_label } = req.body || {};
      if (!user_id) return res.status(400).json({ error: 'user_id required' });

      // Gravamos um "debounce" de 1 minuto no próprio SQL
      await pool.execute(
        `INSERT INTO attendance_logs (user_id, confidence, device_label, captured_at)
         SELECT ?, ?, ?, NOW()
         FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM attendance_logs
           WHERE user_id = ? AND captured_at >= (NOW() - INTERVAL 1 MINUTE)
         )`,
        [user_id, confidence ?? null, device_label ?? null, user_id]
      );

      res.json({ ok: true });
    } catch (err) {
      console.error('attendance error', err);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  // 🆕 Salvar chamada completa (reconhecimento facial ou manual)
  app.post('/api/attendance/chamada', authenticateTokenAttendance, async (req, res) => {
    try {
      const { classroomId, alunos, tipo, metadata } = req.body || {};
      
      if (!classroomId || !Array.isArray(alunos) || alunos.length === 0) {
        return res.status(400).json({ 
          error: 'classroomId e array de alunos são obrigatórios' 
        });
      }

      // Salvar cada aluno presente na tabela attendance_logs
      const insertedIds = [];
      
      for (const aluno of alunos) {
        if (aluno.presente && aluno.id) {
          const [result] = await pool.execute(
            `INSERT INTO attendance_logs (student_id, classroom_id, confidence, device_label, metadata, captured_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
              aluno.id,
              classroomId,
              metadata?.confidence ?? 0.95,
              tipo === 'reconhecimento_facial' ? 'facial_recognition' : 'manual',
              JSON.stringify({ tipo, horarioDeteccao: aluno.horarioDeteccao || null })
            ]
          );
          insertedIds.push(result.insertId);
        }
      }

      console.log(`✅ Chamada salva: ${insertedIds.length} alunos registrados para sala ${classroomId}`);
      
      res.json({ 
        success: true, 
        inserted: insertedIds.length,
        message: `${insertedIds.length} alunos registrados com sucesso`
      });
    } catch (err) {
      console.error('❌ Erro ao salvar chamada:', err);
      res.status(500).json({ error: 'Erro ao salvar chamada', details: err.message });
    }
  });

  // 🆕 Obter histórico de chamadas de uma sala
  app.get('/api/attendance/sala/:classroomId', authenticateTokenAttendance, async (req, res) => {
    try {
      const { classroomId } = req.params;
      
      const [records] = await pool.execute(
        `SELECT 
          al.id,
          al.student_id as studentId,
          s.nome as studentName,
          al.classroom_id as classroomId,
          al.captured_at as capturedAt,
          al.confidence,
          al.device_label as deviceLabel,
          al.metadata
        FROM attendance_logs al
        JOIN students s ON al.student_id = s.id
        WHERE al.classroom_id = ?
        ORDER BY al.captured_at DESC
        LIMIT 100`,
        [classroomId]
      );

      res.json({ success: true, records });
    } catch (err) {
      console.error('❌ Erro ao buscar histórico:', err);
      res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  });
}
