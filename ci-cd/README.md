# COSMOS CI/CD — CI definition installed, production held off

The workflow definition is installed at `.github/workflows/cosmos.yml` in `Corsking93/COSMOS-ACADEMIA`. Committing it to main triggers automated CI. The reusable template remains in `ci-cd/github-actions/`. The Manus website binding is unchanged. A remote run's result must be checked separately; installation is not proof of a successful run or deployment.

Production deployment in the active workflow is explicitly disabled with `if: ${{ false }}`. GitHub returned HTTP 403 for deployment variable and secret metadata, so the current connection cannot verify a hosting target. Merely setting `COSMOS_CD_ENABLED=true` cannot bypass this hold. COSMOS's existing Manus checkpoint-based publication remains the current deployment mechanism. No alternate hosting service or live deployment has been activated.

## What is prepared

`github-actions/cosmos.yml` defines CI for pull requests targeting main, pushes to main, and manual runs. It installs the lockfile without lifecycle scripts, checks JavaScript syntax and route/asset consistency, runs regression tests, builds the static frontend, starts a credential-free smoke server, audits runtime dependencies, and saves a short-lived build artifact. A second job builds and smoke-tests the production Docker image without database or model credentials.

The deployment job depends on both CI jobs. It only permits main-branch runs outside pull requests and requires the repository variable `COSMOS_CD_ENABLED=true`. Until that opt-in is configured, deployment is skipped. It publishes a commit-tagged image to GHCR and sends its immutable digest to a separately configured hosting adapter, then verifies the deployed commit through the health endpoint. It is not a built-in Manus publishing integration.

Actions are pinned to full immutable commit SHAs, checkout does not persist credentials, CI uses read-only repository permission, and only the deployment job receives package-write permission. These choices follow GitHub's secure-use guidance. Pull request jobs never receive deployment secrets. [1]

## Run the checks now

From the project root, use:

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run build
npm run smoke
```

`npm run smoke` starts and stops a separate local server with an explicit environment allowlist. It does not inherit this session's OpenAI or database credentials. Deployment tests use mocked HTTP responses and do not call a live host.

Docker checks require an installed Docker engine. The production image copies only runtime assets and dependencies, not `.git`, environment files, tests, or these instructions. The optional `COSMOS_RELEASE_SHA` image argument becomes health-response metadata; no key or database DSN is supplied during the build.

## Activation in a compatible repository

The current repository already has the active definition in `.github/workflows/cosmos.yml`. For another ordinary Actions-enabled repository, copy the portable template along with the package scripts, `scripts/`, tests, Dockerfile, and server health metadata. The current repository's public visibility was preserved; sensitive learner data and credentials must never be committed. Use GitHub-hosted runners rather than an untrusted persistent runner. Require the CI checks before merging where branch protection is available.

CI needs no custom secrets. Review the first CI run before enabling deployment. The template references a `production` environment; configure that environment, restrict it to main, and add reviewers where supported. A YAML environment reference does not itself install approval rules. Required reviewers and private-repository environment features have plan restrictions, so verify your plan rather than assuming a private free repository has an approval gate. Do not make learner code or assets public merely to obtain that feature. [2]

For deployment, configure the secret `DEPLOY_HOOK_URL`, the variable `DEPLOY_HEALTH_URL`, and optional secret `DEPLOY_BEARER_TOKEN` using GitHub's secure settings. These must belong to your approved hosting adapter. The adapter must understand the payload below, be able to pull the private GHCR image using its own scoped credentials, and deploy that exact digest. After the target is verified, restore the template's guarded deployment condition in the active workflow and set the repository variable `COSMOS_CD_ENABLED=true`. Keep the literal-false hold while authentication, privacy, hosting, or adapter setup is incomplete.

Do not put `OPENAI_API_KEY`, `DATABASE_URL`, camera images, or learner exports in Actions secrets or build inputs for this template. Runtime OpenAI/database credentials belong in the hosting provider's protected runtime configuration. Deployment secrets are separate from application runtime secrets.

## Required deployment adapter contract

The script sends one HTTPS POST, optionally with a bearer token, with JSON like:

```json
{
  "repository": "YOUR_OWNER/cosmos-academia",
  "commit": "FULL_40_CHARACTER_COMMIT_SHA",
  "image": "ghcr.io/YOUR_OWNER/cosmos-academia@sha256:IMAGE_DIGEST"
}
```

The hook URL must reject unauthorized callers and return a successful HTTP status only after accepting the deployment request. The script does not retry that POST. It retries only read-only health probes for up to roughly three minutes plus request timeouts. The public health URL must return `ok: true`, `service: "cosmos-academia"`, and `revision` matching the exact requested commit. A healthy old version is not treated as a successful deployment.

The payload above is an explicit adapter contract, not a claim that every hosting deploy hook accepts it. A provider that only accepts an empty POST or a different schema needs a provider-specific adapter. No such adapter or compatible URL is configured here. If the job fails after publishing an image or submitting the request, it does not delete the image, roll back, or repeat the request automatically. Inspect the hosting deployment before taking another action.

## Maintenance and current validation scope

Keep `package-lock.json` committed and review dependency audit failures rather than bypassing them. Update action SHA pins through reviewed pull requests. GitHub recommends full commit pins to reduce supply-chain risk. [1] GitHub's Node workflow tutorial provides the baseline install/test pattern used here. [3]

The workflow validator used for this package is the open-source [actionlint](https://github.com/rhysd/actionlint) project. The local environment does not include Docker, so Docker build and GitHub runner execution cannot be claimed from local JavaScript or YAML validation. No activation is complete until a compatible repository has actually executed the workflow successfully.

## References

[1]: https://docs.github.com/en/actions/reference/security/secure-use "GitHub Actions secure-use reference"
[2]: https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments "GitHub deployment environments and plan restrictions"
[3]: https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs "GitHub Node.js continuous integration tutorial"
