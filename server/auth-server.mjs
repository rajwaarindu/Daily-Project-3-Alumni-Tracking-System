import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MOCK_ALUMNI } from '../src/store/MockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDatabasePath = path.resolve(__dirname, '..', 'src', 'database', 'db.sqlite');
const alumniDatabasePath = path.resolve(__dirname, '..', 'src', 'database', 'alumni.sqlite');
const alumniLinkedDataPath = path.resolve(__dirname, '..', 'src', 'database', 'data-alumni.sqlite');
const serverPort = 3001;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || process.env.SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_ANON_KEY;

const db = new DatabaseSync(authDatabasePath);
const alumniDb = new DatabaseSync(alumniDatabasePath);
const alumniLinkedDb = new DatabaseSync(alumniLinkedDataPath);

db.exec(`
  PRAGMA journal_mode = WAL;
`);

alumniDb.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS alumni (
    id TEXT PRIMARY KEY,
    nama_lengkap TEXT NOT NULL,
    variasi_nama TEXT NOT NULL,
    afiliasi_kata_kunci TEXT NOT NULL,
    konteks_kata_kunci TEXT NOT NULL,
    status_pelacakan TEXT NOT NULL,
    last_tracked_date TEXT,
    hasil TEXT,
    ppdikti_verified INTEGER NOT NULL DEFAULT 0,
    ppdikti_checked_at TEXT,
    ppdikti_detail TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

alumniLinkedDb.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS alumni_ppdikti_data (
    alumni_id TEXT PRIMARY KEY,
    verified INTEGER NOT NULL DEFAULT 0,
    checked_at TEXT,
    detail TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const existingAlumniCount = alumniDb.prepare('SELECT COUNT(*) AS total FROM alumni').get()?.total ?? 0;

if (existingAlumniCount === 0) {
  const insertSeed = alumniDb.prepare(`
    INSERT INTO alumni (
      id,
      nama_lengkap,
      variasi_nama,
      afiliasi_kata_kunci,
      konteks_kata_kunci,
      status_pelacakan,
      last_tracked_date,
      hasil,
      ppdikti_verified,
      ppdikti_checked_at,
      ppdikti_detail,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedNow = new Date().toISOString();
  const insertMany = alumniDb.transaction((items) => {
    for (const item of items) {
      insertSeed.run(
        item.id,
        item.nama_lengkap,
        JSON.stringify(item.variasi_nama || []),
        JSON.stringify(item.afiliasi_kata_kunci || []),
        JSON.stringify(item.konteks_kata_kunci || []),
        item.status_pelacakan || 'Belum Dilacak',
        item.last_tracked_date || null,
        item.hasil ? JSON.stringify(item.hasil) : null,
        0,
        null,
        null,
        seedNow,
        seedNow
      );
    }
  });

  insertMany(MOCK_ALUMNI);
}

const readJsonBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });

  response.end(JSON.stringify(payload));
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeName = (value) => String(value || '').trim();
const now = () => new Date().toISOString();

const getTokenFromRequest = (request) => {
  const authorization = request.headers.authorization || '';

  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  const sessionToken = request.headers['x-session-token'];
  return Array.isArray(sessionToken) ? sessionToken[0] : sessionToken;
};

const mapSupabaseUser = (user) => ({
  id: user.id,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  email: user.email,
  createdAt: user.created_at,
  lastLoginAt: user.last_sign_in_at,
});

const getSupabaseHeaders = (accessToken) => {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase environment variables are missing on server runtime.');
  }

  return {
    apikey: supabasePublishableKey,
    Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${supabasePublishableKey}`,
    'Content-Type': 'application/json',
  };
};

const supabaseRequest = async (endpoint, method = 'GET', body = null, accessToken = null) => {
  const response = await fetch(`${supabaseUrl}/auth/v1${endpoint}`, {
    method,
    headers: getSupabaseHeaders(accessToken),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.msg || data?.error_description || data?.error || 'Autentikasi Supabase gagal.';
    throw new Error(message);
  }

  return data;
};

const parseJsonValue = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeAlumniRow = (row) => ({
  id: row.id,
  nama_lengkap: row.nama_lengkap,
  variasi_nama: parseJsonValue(row.variasi_nama, []),
  afiliasi_kata_kunci: parseJsonValue(row.afiliasi_kata_kunci, []),
  konteks_kata_kunci: parseJsonValue(row.konteks_kata_kunci, []),
  status_pelacakan: row.status_pelacakan,
  last_tracked_date: row.last_tracked_date,
  hasil: parseJsonValue(row.hasil, null),
  ppdikti_verified: Number(row.ppdikti_verified) === 1,
  ppdikti_checked_at: row.ppdikti_checked_at,
  ppdikti_detail: parseJsonValue(row.ppdikti_detail, null),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const getPpdiktiLinkRowsByAlumniIds = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const placeholders = ids.map(() => '?').join(', ');
  const statement = alumniLinkedDb.prepare(`
    SELECT alumni_id, verified, checked_at, detail
    FROM alumni_ppdikti_data
    WHERE alumni_id IN (${placeholders})
  `);

  return statement.all(...ids);
};

const mergeAlumniWithPpdiktiLink = (row, linkRow) => {
  if (!linkRow) {
    return normalizeAlumniRow(row);
  }

  const normalized = normalizeAlumniRow(row);
  return {
    ...normalized,
    ppdikti_verified: Number(linkRow.verified) === 1,
    ppdikti_checked_at: linkRow.checked_at,
    ppdikti_detail: parseJsonValue(linkRow.detail, null),
  };
};

const nextAlumniId = () => {
  const rows = alumniDb.prepare('SELECT id FROM alumni WHERE id LIKE ?').all('A%');
  let maxValue = 0;

  for (const row of rows) {
    const numeric = Number(String(row.id).slice(1));
    if (Number.isFinite(numeric) && numeric > maxValue) {
      maxValue = numeric;
    }
  }

  return `A${String(maxValue + 1).padStart(3, '0')}`;
};

const normalizeStringList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const requireAuthUser = async (request, response) => {
  const token = getTokenFromRequest(request);

  if (!token) {
    sendJson(response, 401, { error: 'Token autentikasi tidak ditemukan.' });
    return null;
  }

  try {
    const user = await supabaseRequest('/user', 'GET', null, token);
    return mapSupabaseUser(user);
  } catch {
    sendJson(response, 401, { error: 'Sesi tidak ditemukan atau sudah kedaluwarsa.' });
    return null;
  }
};

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url || '/', 'http://localhost');

  try {
    if (url.pathname === '/api/health' && request.method === 'GET') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (url.pathname === '/api/auth/signup' && request.method === 'POST') {
      const body = await readJsonBody(request);
      const name = normalizeName(body.name);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');

      if (!name || !email || !password) {
        sendJson(response, 400, { error: 'Nama, email, dan password wajib diisi.' });
        return;
      }

      if (password.length < 6) {
        sendJson(response, 400, { error: 'Password minimal 6 karakter.' });
        return;
      }

      const data = await supabaseRequest('/signup', 'POST', {
        email,
        password,
        data: { name },
      });

      if (!data.session || !data.user) {
        sendJson(response, 400, {
          error: 'Pendaftaran berhasil, tetapi akun perlu verifikasi email sebelum bisa login.',
        });
        return;
      }

      sendJson(response, 201, {
        token: data.session.access_token,
        user: mapSupabaseUser(data.user),
      });
      return;
    }

    if (url.pathname === '/api/auth/signin' && request.method === 'POST') {
      const body = await readJsonBody(request);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');

      if (!email || !password) {
        sendJson(response, 400, { error: 'Email dan password wajib diisi.' });
        return;
      }

      const data = await supabaseRequest('/token?grant_type=password', 'POST', {
        email,
        password,
      });

      const user = await supabaseRequest('/user', 'GET', null, data.access_token);

      sendJson(response, 200, {
        token: data.access_token,
        user: mapSupabaseUser(user),
      });
      return;
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const token = getTokenFromRequest(request);

      try {
        const user = await supabaseRequest('/user', 'GET', null, token);
        sendJson(response, 200, { user: mapSupabaseUser(user) });
      } catch {
        sendJson(response, 401, { error: 'Sesi tidak ditemukan atau sudah kedaluwarsa.' });
      }
      return;
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (url.pathname === '/api/alumni' && request.method === 'GET') {
      if (!await requireAuthUser(request, response)) {
        return;
      }

      const verifiedFilter = url.searchParams.get('verified');
      const whereClause = verifiedFilter === 'true' || verifiedFilter === 'false'
        ? 'WHERE ppdikti_verified = ?'
        : '';
      const statement = alumniDb.prepare(`
        SELECT * FROM alumni
        ${whereClause}
        ORDER BY id ASC
      `);

      const rows = whereClause
        ? statement.all(verifiedFilter === 'true' ? 1 : 0)
        : statement.all();

      const ppdiktiRows = getPpdiktiLinkRowsByAlumniIds(rows.map((row) => row.id));
      const ppdiktiMap = new Map(ppdiktiRows.map((row) => [row.alumni_id, row]));
      const merged = rows.map((row) => mergeAlumniWithPpdiktiLink(row, ppdiktiMap.get(row.id)));

      sendJson(response, 200, { alumni: merged });
      return;
    }

    if (url.pathname === '/api/alumni' && request.method === 'POST') {
      if (!await requireAuthUser(request, response)) {
        return;
      }

      const body = await readJsonBody(request);
      const namaLengkap = normalizeName(body.nama_lengkap);

      if (!namaLengkap) {
        sendJson(response, 400, { error: 'Nama lengkap wajib diisi.' });
        return;
      }

      const alumni = {
        id: nextAlumniId(),
        nama_lengkap: namaLengkap,
        variasi_nama: normalizeStringList(body.variasi_nama),
        afiliasi_kata_kunci: normalizeStringList(body.afiliasi_kata_kunci),
        konteks_kata_kunci: normalizeStringList(body.konteks_kata_kunci),
        status_pelacakan: normalizeName(body.status_pelacakan) || 'Belum Dilacak',
        last_tracked_date: body.last_tracked_date || null,
        hasil: body.hasil ?? null,
        ppdikti_verified: body.ppdikti_verified ? 1 : 0,
        ppdikti_checked_at: body.ppdikti_checked_at || null,
        ppdikti_detail: body.ppdikti_detail ?? null,
        created_at: now(),
        updated_at: now(),
      };

      alumniDb.prepare(`
        INSERT INTO alumni (
          id,
          nama_lengkap,
          variasi_nama,
          afiliasi_kata_kunci,
          konteks_kata_kunci,
          status_pelacakan,
          last_tracked_date,
          hasil,
          ppdikti_verified,
          ppdikti_checked_at,
          ppdikti_detail,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alumni.id,
        alumni.nama_lengkap,
        JSON.stringify(alumni.variasi_nama),
        JSON.stringify(alumni.afiliasi_kata_kunci),
        JSON.stringify(alumni.konteks_kata_kunci),
        alumni.status_pelacakan,
        alumni.last_tracked_date,
        alumni.hasil ? JSON.stringify(alumni.hasil) : null,
        alumni.ppdikti_verified,
        alumni.ppdikti_checked_at,
        alumni.ppdikti_detail ? JSON.stringify(alumni.ppdikti_detail) : null,
        alumni.created_at,
        alumni.updated_at
      );

      const created = alumniDb.prepare('SELECT * FROM alumni WHERE id = ?').get(alumni.id);
      sendJson(response, 201, { alumni: normalizeAlumniRow(created) });
      return;
    }

    const alumniIdMatch = url.pathname.match(/^\/api\/alumni\/([^/]+)$/);
    if (alumniIdMatch && request.method === 'GET') {
      if (!await requireAuthUser(request, response)) {
        return;
      }

      const alumniId = decodeURIComponent(alumniIdMatch[1]);
      const row = alumniDb.prepare('SELECT * FROM alumni WHERE id = ?').get(alumniId);

      if (!row) {
        sendJson(response, 404, { error: 'Data alumni tidak ditemukan.' });
        return;
      }

      const linkRow = alumniLinkedDb.prepare(`
        SELECT alumni_id, verified, checked_at, detail
        FROM alumni_ppdikti_data
        WHERE alumni_id = ?
      `).get(alumniId);

      sendJson(response, 200, { alumni: mergeAlumniWithPpdiktiLink(row, linkRow) });
      return;
    }

    if (alumniIdMatch && request.method === 'PUT') {
      if (!await requireAuthUser(request, response)) {
        return;
      }

      const alumniId = decodeURIComponent(alumniIdMatch[1]);
      const existing = alumniDb.prepare('SELECT * FROM alumni WHERE id = ?').get(alumniId);

      if (!existing) {
        sendJson(response, 404, { error: 'Data alumni tidak ditemukan.' });
        return;
      }

      const body = await readJsonBody(request);
      const updated = {
        nama_lengkap: normalizeName(body.nama_lengkap) || existing.nama_lengkap,
        variasi_nama: normalizeStringList(body.variasi_nama),
        afiliasi_kata_kunci: normalizeStringList(body.afiliasi_kata_kunci),
        konteks_kata_kunci: normalizeStringList(body.konteks_kata_kunci),
        status_pelacakan: normalizeName(body.status_pelacakan) || existing.status_pelacakan,
        last_tracked_date: body.last_tracked_date ?? existing.last_tracked_date,
        hasil: body.hasil !== undefined ? body.hasil : parseJsonValue(existing.hasil, null),
        ppdikti_verified: typeof body.ppdikti_verified === 'boolean'
          ? (body.ppdikti_verified ? 1 : 0)
          : Number(existing.ppdikti_verified),
        ppdikti_checked_at: body.ppdikti_checked_at ?? existing.ppdikti_checked_at,
        ppdikti_detail: body.ppdikti_detail !== undefined ? body.ppdikti_detail : parseJsonValue(existing.ppdikti_detail, null),
        updated_at: now(),
      };

      alumniDb.prepare(`
        UPDATE alumni
        SET
          nama_lengkap = ?,
          variasi_nama = ?,
          afiliasi_kata_kunci = ?,
          konteks_kata_kunci = ?,
          status_pelacakan = ?,
          last_tracked_date = ?,
          hasil = ?,
          ppdikti_verified = ?,
          ppdikti_checked_at = ?,
          ppdikti_detail = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        updated.nama_lengkap,
        JSON.stringify(updated.variasi_nama),
        JSON.stringify(updated.afiliasi_kata_kunci),
        JSON.stringify(updated.konteks_kata_kunci),
        updated.status_pelacakan,
        updated.last_tracked_date,
        updated.hasil ? JSON.stringify(updated.hasil) : null,
        updated.ppdikti_verified,
        updated.ppdikti_checked_at,
        updated.ppdikti_detail ? JSON.stringify(updated.ppdikti_detail) : null,
        updated.updated_at,
        alumniId
      );

      const row = alumniDb.prepare('SELECT * FROM alumni WHERE id = ?').get(alumniId);
      sendJson(response, 200, { alumni: normalizeAlumniRow(row) });
      return;
    }

    if (alumniIdMatch && request.method === 'DELETE') {
      if (!await requireAuthUser(request, response)) {
        return;
      }

      const alumniId = decodeURIComponent(alumniIdMatch[1]);
      const result = alumniDb.prepare('DELETE FROM alumni WHERE id = ?').run(alumniId);

      if (!result.changes) {
        sendJson(response, 404, { error: 'Data alumni tidak ditemukan.' });
        return;
      }

      alumniLinkedDb.prepare('DELETE FROM alumni_ppdikti_data WHERE alumni_id = ?').run(alumniId);

      sendJson(response, 200, { ok: true });
      return;
    }

    const ppdiktiVerifyMatch = url.pathname.match(/^\/api\/alumni\/([^/]+)\/ppdikti-verify$/);
    if (ppdiktiVerifyMatch && request.method === 'POST') {
      if (!await requireAuthUser(request, response)) {
        return;
      }

      const alumniId = decodeURIComponent(ppdiktiVerifyMatch[1]);
      const existing = alumniDb.prepare('SELECT * FROM alumni WHERE id = ?').get(alumniId);

      if (!existing) {
        sendJson(response, 404, { error: 'Data alumni tidak ditemukan.' });
        return;
      }

      const body = await readJsonBody(request);
      const verified = body.verified ? 1 : 0;
      const checkedAt = now();
      const detail = body.detail ?? parseJsonValue(existing.ppdikti_detail, null);

      alumniDb.prepare(`
        UPDATE alumni
        SET
          ppdikti_verified = ?,
          ppdikti_checked_at = ?,
          ppdikti_detail = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        verified,
        checkedAt,
        detail ? JSON.stringify(detail) : null,
        checkedAt,
        alumniId
      );

      alumniLinkedDb.prepare(`
        INSERT INTO alumni_ppdikti_data (
          alumni_id,
          verified,
          checked_at,
          detail,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(alumni_id) DO UPDATE SET
          verified = excluded.verified,
          checked_at = excluded.checked_at,
          detail = excluded.detail,
          updated_at = excluded.updated_at
      `).run(
        alumniId,
        verified,
        checkedAt,
        detail ? JSON.stringify(detail) : null,
        checkedAt,
        checkedAt
      );

      const row = alumniDb.prepare('SELECT * FROM alumni WHERE id = ?').get(alumniId);
      const linkRow = alumniLinkedDb.prepare(`
        SELECT alumni_id, verified, checked_at, detail
        FROM alumni_ppdikti_data
        WHERE alumni_id = ?
      `).get(alumniId);

      sendJson(response, 200, { alumni: mergeAlumniWithPpdiktiLink(row, linkRow) });
      return;
    }

    sendJson(response, 404, { error: 'Endpoint tidak ditemukan.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message || 'Terjadi kesalahan server.' });
  }
});

server.listen(serverPort, () => {
  console.log(`Auth API running at http://localhost:${serverPort}`);
  console.log(`Auth SQLite database: ${authDatabasePath}`);
  console.log(`Alumni SQLite database: ${alumniDatabasePath}`);
  console.log(`Linked alumni database: ${alumniLinkedDataPath}`);
});