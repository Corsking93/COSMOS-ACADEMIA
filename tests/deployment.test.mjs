import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDeployment, deployAndVerify } from '../scripts/deploy.mjs';

const commit = 'a'.repeat(40);
const env = { GITHUB_SHA: commit, DEPLOY_HOOK_URL: 'https://example.invalid/deploy', DEPLOY_HEALTH_URL: 'https://example.invalid/health', DEPLOY_IMAGE_DIGEST: `ghcr.io/example/cosmos@sha256:${'b'.repeat(64)}` };

test('deployment fails closed on missing target, unsafe URL or mutable image tag', () => {
  assert.throws(() => validateDeployment({}), /commit SHA/);
  assert.throws(() => validateDeployment({ ...env, DEPLOY_HOOK_URL: '' }), /configured/);
  assert.throws(() => validateDeployment({ ...env, DEPLOY_HOOK_URL: 'http://example.invalid/deploy' }), /HTTPS/);
  assert.throws(() => validateDeployment({ ...env, DEPLOY_HOOK_URL: 'https://user:pass@example.invalid/deploy' }), /userinfo/);
  assert.throws(() => validateDeployment({ ...env, DEPLOY_IMAGE_DIGEST: 'ghcr.io/example/cosmos:latest' }), /immutable/);
  assert.equal(validateDeployment(env).commit, commit);
});

test('one deployment request and exact healthy revision are required', async () => {
  const calls = [];
  await deployAndVerify(validateDeployment(env), {
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (options.method === 'POST') return { ok: true };
      return { ok: true, json: async () => ({ ok: true, service: 'cosmos-academia', revision: commit }) };
    }, wait: async () => {}, attempts: 2
  });
  assert.equal(calls.filter(call => call.options.method === 'POST').length, 1);
  assert.equal(JSON.parse(calls[0].options.body).image, env.DEPLOY_IMAGE_DIGEST);
  assert.equal(calls[0].options.redirect, 'error');
});

test('an old healthy release does not count as deployment success', async () => {
  let posts = 0;
  await assert.rejects(deployAndVerify(validateDeployment(env), {
    fetchImpl: async (_url, options) => {
      if (options.method === 'POST') { posts += 1; return { ok: true }; }
      return { ok: true, json: async () => ({ ok: true, service: 'cosmos-academia', revision: 'c'.repeat(40) }) };
    }, wait: async () => {}, attempts: 2
  }), /exact release revision/);
  assert.equal(posts, 1);
});
