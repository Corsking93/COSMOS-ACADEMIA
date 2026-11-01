# COSMOS ACADEMIA

Universal school language

An evidence-first education prototype with COSMOS PROOF, a Learning Atlas, portfolios, role-specific dashboards, Digital IDs, and the LUMA curriculum guide.

## Run locally

Use Node.js 22 or newer. Install dependencies with `npm ci`, start the app with `npm start`, and open `http://localhost:3000`. The server uses `PORT` when set and otherwise listens on port 3000. Run `npm test` for isolated regression checks; these do not write to the managed database or call an LLM.

When a managed `DATABASE_URL` is available, the server creates additive `cosmos_accounts` and `cosmos_account_state` tables. Local browser storage remains a fallback. Never commit environment files or API keys. LUMA reads protected provider credentials on the server, not in the frontend. GitHub stores application code and assets—not live learner database records or secrets.

## Important prototype boundary

The role switcher and alias-based accounts demonstrate workflows; they are **not production authentication or tenant authorization**. Do not use this version for private learner or child records until real authentication, authorization, consent, and retention controls are implemented. Avatar appearance is not verified identity. LUMA guidance is formative and never establishes mastery.

Incomplete saved records are normalized without fabricating ratings. Missing grades are shown as unassessed and exported with a null rubric average. A stored mastery claim with an incomplete human-reviewed rubric displays `Review needed`; `recordedStatus` retains its original value for traceability.

## Structure

| File | Responsibility |
| --- | --- |
| `src/main.js` | Application state, routes, proof workflow, role dashboards, LUMA interactions |
| `src/record-data.js` | Saved-record compatibility and rubric validation |
| `src/styles.css` | COSMOS observatory styling, responsive layouts and avatar state accents |
| `server.mjs` | Static serving, managed persistence and formative LLM endpoint |
| `assets/avatar/` | Reference-derived cutout video and vector guide assets |
| `tests/record-regression.test.mjs` | Isolated render, hydration, export and grade regressions |
| `Dockerfile` | Production Node server image |

## LUMA event-driven avatar sample

The application calls `dispatchLearningEvent` in response to actual curriculum and proof actions. These events select presentation modes; they do not assign grades or modify proof decisions.

```js
// Inside the application's workflow handlers:
dispatchLearningEvent({
  type: 'OBJECTIVE_SELECTED',
  objectiveId: 'BIO-04'
}); // explaining

dispatchLearningEvent({
  type: 'PROOF_SUBMITTED',
  objectiveId: 'BIO-04'
}); // reviewing

dispatchLearningEvent({
  type: 'HUMAN_REVIEW_RECORDED',
  objectiveId: 'BIO-04',
  status: 'Revision needed'
}); // revision
```

Modes include idle, explaining, thinking, encouraging, revision, reviewing, and celebrating. The current avatar cue is scoped to the selected account and included in its persistence snapshot. These modes currently alter the guide's visual accent and caption; they are not separate lip-synced animations or a biometric digital twin.

## CI/CD templates

The GitHub CI definition is installed at `.github/workflows/cosmos.yml` for main pushes, pull requests, and manual runs. It checks syntax/routes/assets, runs tests, builds the frontend, performs credential-free smoke checks and dependency audit, and verifies the production container. Production deployment is explicitly held off because the current integration cannot inspect deployment secrets or variables and no hosting target is verified. Manus hosting remains unchanged. See `ci-cd/README.md` for the deployment prerequisites; local commands are `npm run check`, `npm test`, `npm run build`, and `npm run smoke`.
