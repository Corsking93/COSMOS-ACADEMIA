import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
async function checkTree(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await checkTree(file);
    else if (/\.(m?js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr || `Syntax failed: ${file}`);
    }
  }
}
for (const folder of ['src', 'scripts', 'tests']) await checkTree(path.join(root, folder));
const serverCheck = spawnSync(process.execPath, ['--check', path.join(root, 'server.mjs')], { encoding: 'utf8' });
assert.equal(serverCheck.status, 0, serverCheck.stderr);

const source = await fs.readFile(path.join(root, 'src/main.js'), 'utf8');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manus-routes.json'), 'utf8'));
const mirror = JSON.parse(await fs.readFile(path.join(root, 'public/manus-routes.json'), 'utf8'));
assert.deepEqual(manifest, mirror, 'Root and public route manifests must match');
const routeList = source.match(/if \(!\[([^\]]+)\]\.includes\(state\.route\)\)/)?.[1];
assert.ok(routeList, 'Could not identify the app route allowlist');
const expected = [...routeList.matchAll(/'([^']+)'/g)].map(([, route]) => route === 'home' ? '/' : `/${route}`).sort();
const actual = manifest.routes.map(route => route.path).sort();
assert.deepEqual(actual, expected, 'The manifest must cover the exact application route set');
assert.equal(new Set(actual).size, actual.length, 'Route entries must be unique');
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
for (const [, url] of html.matchAll(/(?:src|href)="(\/src\/[^"?]+)(?:\?[^\"]*)?"/g)) {
  await fs.access(path.join(root, url.slice(1)));
}
for (const file of ['assets/avatar/luma-avatar-vector.svg', 'assets/avatar/luma-guide-cutout.webm']) {
  assert.ok((await fs.stat(path.join(root, file))).size > 0, `Missing avatar asset: ${file}`);
}
console.log(`Syntax, ${actual.length} routes, asset references and avatar files verified.`);
