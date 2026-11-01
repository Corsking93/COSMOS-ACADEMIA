import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
for (const file of ['index.html', 'manus-routes.json']) {
  await fs.copyFile(path.join(root, file), path.join(output, file));
}
for (const folder of ['src', 'public', 'assets']) {
  await fs.cp(path.join(root, folder), path.join(output, folder), { recursive: true });
}
assert.ok((await fs.stat(path.join(output, 'index.html'))).size > 0);
assert.ok((await fs.stat(path.join(output, 'src/record-data.js'))).size > 0);
const entries = await fs.readdir(output);
assert.ok(!entries.some(name => name.startsWith('.env') || name === 'node_modules'), 'Do not publish secrets or dependencies');
console.log('Static release built in dist/; only browser assets are included.');
