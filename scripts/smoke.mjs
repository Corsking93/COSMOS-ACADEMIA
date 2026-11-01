import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = path.resolve(import.meta.dirname, '..');
const reservation = net.createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
// Explicit allowlist: never pass this session's real DB or LLM credentials.
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  env: { PATH: process.env.PATH || '', HOME: process.env.HOME || '', PORT: String(port), COSMOS_RELEASE_SHA: 'smoke-test' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
const exited = new Promise(resolve => child.once('exit', resolve));
const origin = `http://127.0.0.1:${port}`;
try {
  let health;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Smoke server stopped: ${output}`);
    try {
      const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) { health = await response.json(); break; }
    } catch { /* Waiting for this isolated server to listen. */ }
    await delay(100);
  }
  assert.ok(health?.ok, `Smoke server did not start: ${output}`);
  assert.equal(health.database, 'unconfigured', 'Smoke tests must not connect to a real database');
  assert.equal(health.llm, 'unconfigured', 'Smoke tests must not access an LLM provider');
  for (const route of ['/', '/manus-routes.json', '/src/main.js', '/src/record-data.js', '/src/styles.css', '/assets/avatar/luma-avatar-vector.svg']) {
    const response = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(2000) });
    assert.equal(response.status, 200, `HTTP smoke failure: ${route}`);
  }
  const response = await fetch(`${origin}/api/cosmos/state?accountId=ci-demo`, { signal: AbortSignal.timeout(2000) });
  const payload = await response.json();
  assert.equal(payload.persistent, false);
  assert.deepEqual(payload.accounts, []);
  console.log('Credential-free server, static assets and local-fallback API smoke checks passed.');
} finally {
  child.kill('SIGTERM');
  await exited;
}
