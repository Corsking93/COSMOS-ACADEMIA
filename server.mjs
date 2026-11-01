import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 1500000;
const clean = (value, max = 2400) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const normalizeBase = value => String(value || '').replace(/\/+$/, '').replace(/\/v1$/, '');
const openAiKey = process.env.OPENAI_API_KEY;
const openAiBase = normalizeBase(process.env.OPENAI_API_BASE || 'https://api.openai.com/v1');
const manusBase = normalizeBase(process.env.MANUS_API_URL || process.env.BUILT_IN_FORGE_API_URL);
const manusKey = process.env.MANUS_API_KEY || process.env.BUILT_IN_FORGE_API_KEY;
const llmProvider = openAiKey ? 'openai-first-managed-fallback' : manusKey ? 'managed-cosmos' : 'unconfigured';
const llmBase = openAiKey ? openAiBase : manusBase;
const llmKey = openAiKey || manusKey;
const llmModel = process.env.OPENAI_MODEL || process.env.COSMOS_LLM_MODEL || 'gpt-5-mini';
const databaseUrl = process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL;
let dbPool = null;
let databaseStatus = databaseUrl ? 'starting' : 'unconfigured';
let databaseError = '';

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};
const readBody = req => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) { reject(new Error('Request too large')); req.destroy(); }
  });
  req.on('end', () => resolve(body));
  req.on('error', reject);
});
const safeId = value => clean(value, 64).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
const parseModelJson = text => {
  const raw = String(text || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(raw); } catch {
    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) { try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; } }
    return null;
  }
};
const list = (value, fallback) => Array.isArray(value) ? value.map(item => clean(item, 220)).filter(Boolean).slice(0, 4) : fallback;

async function initDatabase() {
  if (!databaseUrl) return;
  dbPool = mysql.createPool(databaseUrl);
  await dbPool.query('SELECT 1');
  await dbPool.query(`CREATE TABLE IF NOT EXISTS cosmos_accounts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    demo TINYINT(1) NOT NULL DEFAULT 0,
    created_at VARCHAR(80) NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  )`);
  await dbPool.query(`CREATE TABLE IF NOT EXISTS cosmos_account_state (
    account_id VARCHAR(64) PRIMARY KEY,
    payload JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT cosmos_state_account_fk FOREIGN KEY (account_id) REFERENCES cosmos_accounts(id) ON DELETE CASCADE
  )`);
  databaseStatus = 'ready';
}

async function getAccounts() {
  if (!dbPool) return [];
  const [rows] = await dbPool.query('SELECT id, name, demo, created_at AS createdAt FROM cosmos_accounts ORDER BY updated_at DESC');
  return rows.map(row => ({ id: row.id, name: row.name, demo: Boolean(row.demo), createdAt: row.createdAt }));
}
async function getAccountState(accountId) {
  if (!dbPool) return null;
  const [rows] = await dbPool.query('SELECT payload FROM cosmos_account_state WHERE account_id = ?', [safeId(accountId)]);
  if (!rows[0]) return null;
  try { return typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload; } catch { return null; }
}
async function saveRemoteState(body) {
  if (!dbPool) throw new Error('Managed database is not ready.');
  const accounts = Array.isArray(body.accounts) ? body.accounts.slice(0, 50) : [];
  for (const account of accounts) {
    const id = safeId(account.id);
    const name = clean(account.name, 120);
    if (!id || !name) continue;
    await dbPool.query(`INSERT INTO cosmos_accounts (id, name, demo, created_at) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), demo = VALUES(demo)`, [id, name, account.demo ? 1 : 0, clean(account.createdAt, 80) || new Date().toISOString()]);
  }
  const accountId = safeId(body.activeAccountId);
  if (!accountId || !body.state || !accounts.some(account => safeId(account.id) === accountId)) throw new Error('Account state is incomplete.');
  const payload = JSON.stringify(body.state);
  await dbPool.query(`INSERT INTO cosmos_account_state (account_id, payload) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE payload = VALUES(payload)`, [accountId, payload]);
  return { savedAt: new Date().toISOString(), accountId };
}
async function handleStateGet(url, res) {
  const accountId = safeId(url.searchParams.get('accountId'));
  const accounts = await getAccounts();
  return send(res, 200, { ok: true, persistent: databaseStatus === 'ready', database: databaseStatus, accounts, activeAccountId: accountId, state: accountId ? await getAccountState(accountId) : null });
}
async function handleStatePost(req, res) {
  try { const result = await saveRemoteState(JSON.parse(await readBody(req))); return send(res, 200, { ok: true, persistent: true, ...result }); }
  catch (error) { return send(res, error.message === 'Request too large' ? 413 : 503, { ok: false, persistent: false, error: error.message || 'Persistence unavailable.' }); }
}

async function formativeCompletion(input) {
  const objective = input.objective || {}; const proof = input.proof || {}; const mode = input.kind === 'dialogue' ? 'dialogue' : 'analysis';
  const system = `You are LUMA, a careful formative learning companion inside COSMOS ACADEMIA. You support a learner working on one curriculum objective. Make thinking observable and propose the next learning move. You are not an assessor and must never assign a grade, declare mastery, estimate IQ, diagnose disability, infer a permanent capability, or make a high-stakes decision. Treat rubric signals as incomplete observations, not traits. Use plain, encouraging language. Return JSON only with exactly these keys: dialogue (string), summary (string), strengths (array of strings), gaps (array of strings), nextStep (string), practiceQuestion (string), caution (string). Stay grounded in the supplied objective and evidence. If evidence is missing, say what is missing rather than inventing it. Mention human educator review when discussing mastery.`;
  const user = JSON.stringify({ mode, objective: { id: clean(objective.id, 30), domain: clean(objective.domain, 80), title: clean(objective.title, 300) }, stage: input.stage || {}, learnerPrompt: clean(input.learnerPrompt, 1200), proof: { status: clean(proof.status, 40), evidence: clean(proof.evidence, 2400), scoreSignals: Array.isArray(proof.scoreSignals) ? proof.scoreSignals.slice(0, 8) : [] } });
  const providers = [];
  if (openAiKey && openAiBase) providers.push({ name: 'openai', base: openAiBase, key: openAiKey, model: process.env.OPENAI_MODEL || llmModel });
  if (manusKey && manusBase && !(openAiKey && openAiBase === manusBase && openAiKey === manusKey)) providers.push({ name: 'managed-cosmos', base: manusBase, key: manusKey, model: process.env.COSMOS_LLM_MODEL || llmModel });
  if (!providers.length) throw new Error('No LLM provider is configured.');
  let lastError = null;
  for (const provider of providers) {
    try {
      const response = await fetch(`${provider.base}/v1/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: provider.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_completion_tokens: 6000 }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.error) throw new Error(payload.error?.message || `LLM request failed (${response.status})`);
      const text = payload.choices?.[0]?.message?.content; if (!text) throw new Error('The LLM returned no formative guidance.');
      const parsed = parseModelJson(text); if (!parsed) throw new Error('The LLM returned an unreadable formative response.');
      return { provider: provider.name, model: provider.model, formative: { dialogue: clean(parsed.dialogue, 900), summary: clean(parsed.summary, 500), strengths: list(parsed.strengths, ['Your response is now visible for reflection.']), gaps: list(parsed.gaps, ['Add one piece of evidence or explanation that another person can check.']), nextStep: clean(parsed.nextStep, 500), practiceQuestion: clean(parsed.practiceQuestion, 400), caution: clean(parsed.caution, 400) } };
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('Formative analysis unavailable.');
}
async function handleFormative(req, res) {
  try { const input = JSON.parse(await readBody(req)); if (!input?.objective?.id || !input.objective.title) return send(res, 400, { ok: false, error: 'Objective context is required.' }); const result = await formativeCompletion(input); return send(res, 200, { ok: true, formative: result.formative, provider: result.provider, model: result.model, mode: input.kind === 'dialogue' ? 'dialogue' : 'analysis' }); }
  catch (error) { return send(res, error.message === 'Request too large' ? 413 : 502, { ok: false, error: error.message || 'Formative analysis unavailable.' }); }
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.md': 'text/markdown' };
async function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname; const decoded = decodeURIComponent(requested); const candidate = path.resolve(root, `.${decoded}`);
  if (!candidate.startsWith(root) || candidate.endsWith('/server.mjs')) return send(res, 404, { ok: false, error: 'Not found' });
  try { const stat = await fs.stat(candidate); if (!stat.isFile()) throw new Error('not a file'); const content = await fs.readFile(candidate); res.writeHead(200, { 'Content-Type': `${mime[path.extname(candidate)] || 'application/octet-stream'}; charset=utf-8` }); return res.end(content); }
  catch { if (!path.extname(decoded)) return serveStatic(req, res, '/index.html'); return send(res, 404, { ok: false, error: 'Not found' }); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true, service: 'cosmos-academia', database: databaseStatus, llm: llmProvider, revision: process.env.COSMOS_RELEASE_SHA || 'unknown' });
    if (req.method === 'GET' && url.pathname === '/api/cosmos/state') return handleStateGet(url, res);
    if (req.method === 'POST' && url.pathname === '/api/cosmos/state') return handleStatePost(req, res);
    if (req.method === 'POST' && url.pathname === '/api/luma-formative') return handleFormative(req, res);
    if (req.method === 'GET') return serveStatic(req, res, url.pathname);
    return send(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) { return send(res, 500, { ok: false, error: error.message || 'Server error.' }); }
});

initDatabase().catch(error => { databaseStatus = 'error'; databaseError = error.message; console.error(`COSMOS database unavailable: ${databaseError}`); }).finally(() => server.listen(port, '0.0.0.0', () => console.log(`COSMOS server listening on ${port} · db=${databaseStatus} · llm=${llmProvider}`)));
