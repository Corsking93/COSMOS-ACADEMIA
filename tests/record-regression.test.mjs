import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { normalizeRecord, normalizeRecords, assessedRatings, hasCompleteRubric } from '../src/record-data.js';

const partial = { id: 'P-098', objectiveId: 'RES-02', status: 'Mastered', demo: true };
const appSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

// Run actual application functions with an in-memory DOM/storage and stubbed API.
// No production database, browser account or external LLM is accessed.
function createApp({ stored = {}, remote = null } = {}) {
  const storage = new Map(Object.entries(stored));
  const root = { innerHTML: '' };
  const listeners = {};
  const downloads = [];
  const context = vm.createContext({
    console, Date, Intl, Map, JSON,
    Blob: class { constructor(parts) { downloads.push(JSON.parse(parts.join(''))); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    normalizeRecord, normalizeRecords, assessedRatings, hasCompleteRubric,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    location: { hash: '#settings' },
    window: { scrollTo() {}, addEventListener: (event, fn) => { listeners[event] = fn; } },
    document: {
      querySelector: selector => selector === '#app' ? root : null,
      querySelectorAll: () => [],
      createElement: () => ({ click() {} }),
      documentElement: { classList: { toggle() {} } }
    },
    setTimeout: () => 1, clearTimeout() {},
    fetch: async () => ({ ok: true, json: async () => remote || { persistent: false, accounts: [] } })
  });
  const source = appSource.replace(/^import .*;\n/m, '').replace(/\nhydrateFromServer\(\);\s*$/, '\n');
  vm.runInContext(source, context);
  return { run: code => vm.runInContext(code, context), root, listeners, storage, downloads };
}

test('partial legacy proof receives safe fields without fabricated ratings or review', () => {
  const record = normalizeRecord(partial);
  assert.equal(record.id, 'P-098');
  assert.equal(record.objectiveId, 'RES-02');
  assert.equal(record.status, 'Review needed');
  assert.equal(record.recordedStatus, 'Mastered'); // Retain history without asserting unverified mastery.
  assert.deepEqual(record.scores, Array(8).fill(null));
  assert.deepEqual(record.audit, []);
  assert.equal(record.assessor, 'Pending human review');
  assert.equal(record.reviewed, false);
  assert.deepEqual(partial, { id: 'P-098', objectiveId: 'RES-02', status: 'Mastered', demo: true });
});

test('malformed fields are contained and valid evidence, ratings and extension fields survive', () => {
  const record = normalizeRecord({ id: 'P-2', evidence: 'Keep this explanation.', scores: [3, '4', null, 9, 4, NaN, 2, 1], audit: [null, 'Review saved'], assessor: {}, attachment: 'notes.pdf' });
  assert.deepEqual(record.scores, [3, null, null, null, 4, null, 2, 1]);
  assert.deepEqual(record.audit, ['Review saved']);
  assert.equal(record.evidence, 'Keep this explanation.');
  assert.equal(record.attachment, 'notes.pdf');
  assert.equal(record.assessor, 'Pending human review');
  assert.deepEqual(normalizeRecords(null), []);
  assert.deepEqual(normalizeRecords({}), []);
  assert.equal(normalizeRecord({ status: 'Mastered', reviewed: true, scores: Array(8).fill(3) }).status, 'Mastered');
  assert.equal(normalizeRecord({ status: 'Mastered', reviewed: true, scores: [3, 3] }).status, 'Review needed');
  assert.equal(normalizeRecords([null, [], 7, partial]).length, 1);
  assert.equal(hasCompleteRubric([]), false);
  assert.equal(hasCompleteRubric([3, 3]), false);
  assert.equal(hasCompleteRubric(new Array(8)), false);
  assert.equal(hasCompleteRubric(Array(8).fill(3)), true);
});

test('portfolio regression: missing scores/assessor/audit no longer blocks Settings navigation', () => {
  const app = createApp();
  app.run(`state.records = ${JSON.stringify([partial])}; routeTo('portfolio');`);
  assert.match(app.root.innerHTML, /Pending human review/);
  assert.match(app.root.innerHTML, /No audit events recorded/);
  app.run("routeTo('settings');");
  assert.match(app.root.innerHTML, /Keep the workspace/);
  app.run("location.hash = '#portfolio';");
  app.listeners.hashchange();
  assert.match(app.root.innerHTML, /Evidence ledger/);
});

test('all role dashboards and account routes render legacy and malformed proof records safely', () => {
  const app = createApp();
  const malformed = [partial, { id: 'P-2', scores: null, audit: null, assessor: 42 }, null, { id: 'P-3', scores: 'bad', audit: {}, status: null }];
  for (const role of ['student', 'parent', 'educator']) {
    for (const route of ['home', 'portfolio', 'reports', 'proof', 'educator', 'settings', 'assistant']) {
      assert.doesNotThrow(() => app.run(`state.role = '${role}'; state.records = ${JSON.stringify(malformed)}; state.route = '${route}'; render();`), `${role}/${route}`);
      assert.doesNotMatch(app.root.innerHTML, /NaN|undefined/);
    }
  }
});

test('local, legacy and remote hydration normalize missing record fields', async () => {
  const app = createApp({ stored: { 'cosmos-records-demo-learner': JSON.stringify([partial]) }, remote: { persistent: true, accounts: [], state: { records: [partial] } } });
  assert.equal(app.run('state.records[0].scores.length'), 8);
  await app.run('hydrateFromServer();');
  assert.equal(app.run('state.records[0].assessor'), 'Pending human review');
  assert.equal(app.run('state.records[0].audit.length'), 0);
  app.run("routeTo('portfolio');");
  assert.match(app.root.innerHTML, /Evidence ledger/);
  const legacy = createApp({ stored: { 'cosmos-records': JSON.stringify([partial]) } });
  assert.equal(legacy.run('state.records[0].scores.length'), 8);
  const wrongShape = createApp({ stored: { 'cosmos-records-demo-learner': '{"not":"an array"}' } });
  assert.equal(wrongShape.run('state.records.length'), 0);
});

test('missing grades remain unassessed; empty or incomplete rubric cannot imply mastery', () => {
  const app = createApp();
  assert.equal(app.run(`gradeLabel(normalizeRecord(${JSON.stringify(partial)}))`), 'Not assessed');
  assert.equal(app.run('avg([])'), 0);
  assert.equal(app.run('avg([null, 4, null, 2])'), 3);
  assert.equal(app.run('masteryStatus([], true, true)'), 'Reviewed');
  assert.equal(app.run('masteryStatus([3,3], true, true)'), 'Reviewed');
  assert.equal(app.run('masteryStatus(Array(8).fill(3), true, true)'), 'Mastered');
  app.run(`state.records = normalizeRecords([${JSON.stringify(partial)}]); state.role = 'educator'; state.route = 'educator'; openReview('P-098');`);
  assert.match(app.root.innerHTML, /disabled>Confirm mastery/);
  app.run("state.scores = []; saveReview('Mastered');");
  assert.equal(app.run('state.records[0].reviewed'), false);
  assert.match(app.root.innerHTML, /Review incomplete/);
});

test('exports retain historical status and use null, not a zero grade, for unassessed evidence', () => {
  const app = createApp();
  app.run(`state.records = normalizeRecords([${JSON.stringify(partial)}]); handleAction('export-reports');`);
  const exported = app.downloads[0].records[0];
  assert.equal(exported.rubricAverage, null);
  assert.equal(exported.status, 'Review needed');
  assert.equal(exported.recordedStatus, 'Mastered');
  assert.equal(exported.gradeBand, 'In progress');
});

test('LUMA event-driven avatar feature survives normalization changes', () => {
  const app = createApp();
  assert.equal(app.run("nextLumaAvatarState({ type: 'PROOF_SUBMITTED', objectiveId: 'BIO-04' }).mode"), 'reviewing');
  assert.equal(app.run("nextLumaAvatarState({ type: 'KNOWLEDGE_CHECK_COMPLETED', correct: false }).mode"), 'revision');
  assert.equal(app.run("nextLumaAvatarState({ type: 'OBJECTIVE_SELECTED', objectiveId: 'RES-02' }).objectiveId"), 'RES-02');
});
