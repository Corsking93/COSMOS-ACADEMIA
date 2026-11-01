import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

function httpsUrl(value, field) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${field} must be configured.`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error(`${field} must be HTTPS without userinfo or a fragment.`);
  }
  return url.href;
}

export function validateDeployment(env, requireImage = true) {
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '')) throw new Error('A full release commit SHA is required.');
  const config = {
    hook: httpsUrl(env.DEPLOY_HOOK_URL, 'DEPLOY_HOOK_URL'),
    health: httpsUrl(env.DEPLOY_HEALTH_URL, 'DEPLOY_HEALTH_URL'),
    commit: env.GITHUB_SHA,
    image: env.DEPLOY_IMAGE_DIGEST || '',
    bearer: env.DEPLOY_BEARER_TOKEN || ''
  };
  if (requireImage && !/^ghcr\.io\/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$/.test(config.image)) {
    throw new Error('An immutable GHCR image digest is required.');
  }
  return config;
}

export async function deployAndVerify(config, { fetchImpl = fetch, wait = delay, attempts = 36 } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (config.bearer) headers.Authorization = `Bearer ${config.bearer}`;
  // One POST only: do not retry a possibly accepted deployment request.
  const accepted = await fetchImpl(config.hook, {
    method: 'POST', headers, redirect: 'error', signal: AbortSignal.timeout(30000),
    body: JSON.stringify({ repository: process.env.GITHUB_REPOSITORY || '', commit: config.commit, image: config.image })
  });
  if (!accepted.ok) throw new Error('The configured host rejected the deployment request.');
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(config.health, { redirect: 'error', signal: AbortSignal.timeout(5000), cache: 'no-store' });
      const health = await response.json();
      if (response.ok && health.ok && health.service === 'cosmos-academia' && health.revision === config.commit) return;
    } catch { /* Retry only the read-only health probe. */ }
    if (attempt + 1 < attempts) await wait(5000);
  }
  throw new Error('The exact release revision was not verified; inspect your hosting provider.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const validationOnly = process.argv.includes('--validate');
    const config = validateDeployment(process.env, !validationOnly);
    if (validationOnly) console.log('Deployment target configuration is valid; no request was sent.');
    else { await deployAndVerify(config); console.log('Configured host reports the exact COSMOS release revision.'); }
  } catch {
    // Do not print fetch error URLs, bearer tokens, provider responses or secret hooks.
    console.error('Deployment validation/request failed, or the exact revision is not healthy. See CI/CD setup documentation.');
    process.exitCode = 1;
  }
}
