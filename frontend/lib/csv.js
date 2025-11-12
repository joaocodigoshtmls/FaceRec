import Papa from 'papaparse';

const HEADERS = {
  sala: ['sala', 'turma', 'classroom', 'classe'],
  nome: ['nome', 'aluno', 'name'],
  email: ['email', 'e-mail'],
  telefone: ['telefone', 'phone', 'celular'],
  ativo: ['ativo', 'status'],
};

export function guessDelimiter(sample) {
  if (!sample) return ',';
  const sc = (sample.match(/;/g) || []).length;
  const cm = (sample.match(/,/g) || []).length;
  return sc > cm ? ';' : ',';
}

function normalizeHeader(h) {
  return String(h || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .trim().toLowerCase();
}

function mapHeaders(fields) {
  const norm = fields.map(normalizeHeader);
  const take = (key) => {
    const idx = norm.findIndex((header) => HEADERS[key].includes(header));
    return idx >= 0 ? fields[idx] : null;
  };

  return {
    sala: take('sala'),
    nome: take('nome'),
    email: take('email'),
    telefone: take('telefone'),
    ativo: take('ativo'),
  };
}

function toBool(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return true; // default: ativo
  return ['1', 'true', 'sim', 'yes', 'y', 'ativo', 'ok'].includes(s);
}

function stableIdFromName(name) {
  const base = String(name || '').trim().toLowerCase();
  const slug = base
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }

  return `${slug || 'sala'}-${hash}`;
}

export async function parseCSV(file) {
  const text = await file.text();
  const delimiter = guessDelimiter(text.slice(0, 2000));

  const { data, meta, errors } = Papa.parse(text, {
    header: true,
    delimiter,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h,
  });

  if (errors?.length) {
    const fatal = errors.find((e) => e.type === 'Delimiter' || e.code === 'TooFewFields');
    if (fatal) {
      throw new Error(`Erro ao ler CSV: ${fatal.message || fatal.code}`);
    }
  }

  const headerMap = mapHeaders(meta.fields || []);
  if (!headerMap.nome) throw new Error('Cabeçalho de NOME não encontrado (ex.: Nome, Aluno).');
  if (!headerMap.sala) throw new Error('Cabeçalho de SALA/TURMA não encontrado (ex.: Sala, Turma).');

  const salasByNome = new Map();
  const alunos = [];
  let skipped = 0;

  for (const row of data) {
    const salaNome = String(row[headerMap.sala] || '').trim();
    const nome = String(row[headerMap.nome] || '').trim();
    if (!salaNome || !nome) {
      skipped += 1;
      continue;
    }

    if (!salasByNome.has(salaNome)) {
      salasByNome.set(salaNome, {
        id: stableIdFromName(salaNome),
        nome: salaNome,
        periodo: null,
      });
    }

    alunos.push({
      nome,
      email: headerMap.email && row[headerMap.email] ? String(row[headerMap.email]).trim() : null,
      telefone: headerMap.telefone && row[headerMap.telefone] ? String(row[headerMap.telefone]).trim() : null,
      ativo: toBool(headerMap.ativo ? row[headerMap.ativo] : true),
      salaId: stableIdFromName(salaNome),
    });
  }

  const salas = Array.from(salasByNome.values());
  const salaMap = salas.reduce((acc, sala) => {
    acc[sala.id] = sala.nome;
    return acc;
  }, {});

  return {
    salas,
    alunos,
    delimiter,
    headers: meta.fields || [],
    totalRows: data.length,
    skipped,
    salaMap,
  };
}

export function createTemplateCSV() {
  return [
    'Sala;Nome;Email;Telefone;Ativo',
    '1A;Paula Rodrigues;paula@exemplo.com;11988887777;1',
    '1A;Nicole Costa;;;',
    '1A;Natália Souza;;;',
  ].join('\n');
}
