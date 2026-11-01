# COSMOS ACADEMIA — Delivery TODO

## Outcome 1 — Learner dashboard and navigation
- [x] Provide functional navigation between Home, COSMOS PROOF, Portfolio, Learning Atlas, Pathways, Educator, Settings, and About.
- [x] Home shows a welcoming overview, continue learning, current pathways, proof tasks due, recent evidence, and progress by competency.
- [x] The layout is responsive for desktop and mobile, keyboard navigable, readable at high contrast, and supports reduced motion.

## Outcome 2 — COSMOS PROOF workflow
- [x] COSMOS PROOF lets the learner create/select a learning objective, attempt a knowledge check, submit a practical artifact or explanation, attach evidence notes/files, record rubric scores, and view feedback, mastery status, and next steps.
- [x] Include a safe demo learner and sample submissions so the workflow is immediately testable.
- [x] Each proof record includes learner alias, objective ID, submission type, evidence description, rubric dimension scores, assessor, feedback, created date, status, and audit events.
- [x] Allow multiple attempts and revisions, with explicit statuses for draft, submitted, reviewed, mastered, and revision-needed.
- [x] Include the sample objective “Explain how photosynthesis transforms light energy into chemical energy,” a short knowledge check, and a practical evidence task.

## Outcome 3 — Transparent rubric and mastery rule
- [x] Score conceptual understanding, reasoning, application, experimentation, verification/source quality, communication, creativity, and collaboration separately.
- [x] Use a transparent four-level scale: Emerging, Developing, Proficient, Advanced, each with observable criteria and learner-friendly explanations.
- [x] Show the mastery rule clearly: mastery requires evidence across relevant dimensions, relevant dimensions at least Proficient, and explicit human assessor review; time-on-task and attendance never count as mastery.
- [x] Show uncertainty and human review where appropriate; do not claim external accreditation or cryptographic verification.

## Outcome 4 — Portfolio and consent
- [x] Portfolio shows evidence items, competencies demonstrated, assessment history, and clearly labels demo data.
- [x] Provide export/share preview controls with explicit consent before sharing and privacy-by-default copy.

## Outcome 5 — Learning Atlas and pathways
- [x] Seed the Atlas with Mathematics, Language & Communication, Natural Sciences, Humanities & Society, Computing & AI, Engineering & Design, Arts & Expression, Health & Wellbeing, and Research Methods.
- [x] Show subject → discipline → concept → learning objective hierarchy with sample entries.
- [x] Show age-flexible progression, recommended prerequisites, advanced-topic exploration without age gates, and accessibility/accommodation notes.

## Outcome 6 — Educator view
- [x] Educator view supports creating objectives, reviewing submissions, providing feedback, calibrating rubric ratings, and maintaining an audit trail.
- [x] Keep human educator oversight visible in the interface and never present an automated high-stakes decision.

## Outcome 7 — Settings, privacy, and About
- [x] Settings clearly distinguishes learner and educator roles and provides data export, delete controls, consent-before-sharing, minimal collection, and local/demo persistence controls.
- [x] State no advertising, no sale of learner data, no sensitive child data collection, and no real child account onboarding/public sharing in this MVP.
- [x] About page explains COSMOS Academia’s philosophy: Observe → Understand → Connect → Experiment → Create → Contribute.

## Outcome 8 — Trustworthy MVP delivery
- [x] Use local/demo persistence when authentication/database is not available and communicate those limitations.
- [x] Do not add payment processing, ads, public leaderboards, facial/voice emotion inference, or automated high-stakes decisions.
- [x] Serve a synchronized `/manus-routes.json` route manifest and keep the static app healthy on the configured port.

## Outcome 9 — Student, Educator, and Parent role switching
- [x] Add a persistent local prototype role switcher with Student, Educator, and Parent options.
- [x] Student view foregrounds COSMOS PROOF, evidence capture, portfolio, pathways, and Atlas navigation.
- [x] Educator view foregrounds review queue, calibration, feedback, audit trail, and educator commitments.
- [x] Parent view foregrounds a consented progress summary and shared portfolio while hiding private drafts, raw notes, file contents, attendance, time-on-task, and sensitive child data.
- [x] Role boundaries are explicit when a user reaches a protected view from another role; switching returns to the role’s home surface.

## Outcome 10 — Stronger COSMOS visual identity
- [x] Deepen the interface with layered nebula lighting, a calibrated starfield/grid, orbital geometry, cyan signal traces, and instrument-like panel surfaces.
- [x] Keep the visual refinement readable, high-contrast, responsive, and compatible with reduced-motion support.

## Outcome 11 — Visual asset delivery repair
- [x] Link the published HTML to the versioned COSMOS stylesheet and script so the designed background, color system, typography, and orbital UI are rendered instead of default browser styling.

## Outcome 12 — Role-specific analytics and progress tracking
- [x] Educator view shows cohort-level evidence distribution, review throughput, rubric signal map, pathway coverage, and a concrete next review action while excluding attendance and time-on-task.
- [x] Parent view shows consented learning arc milestones, shared competency signals, evidence trajectory, and supportive conversation prompts while hiding private drafts, raw notes, attendance, and surveillance metrics.

## Outcome 13 — Local accounts and saved reports
- [x] Let users create a local account with a display name or alias; save each account’s proof records separately in this browser and provide account switching.
- [x] Add a Saved Reports & Grades section showing saved evidence, rubric averages, human-review status, assessor context, transparent prototype grade bands, and local JSON export.
- [x] Keep the limitation explicit: this MVP has no password, email collection, production authentication, or secure cross-device identity; managed persistence is available only through the prototype account boundary with browser-local fallback.

## Outcome 14 — Account-gated visual and auditory assistant
- [x] Add a Student-only Orbital Assistant workspace that remains locked for the seeded demo identity until the user creates a local account.
- [x] Provide a visual spectrum-of-light sphere, contextual conversation prompts, account-scoped conversation persistence, and browser-local read-aloud controls.
- [x] Keep the assistant supportive rather than high-stakes: it does not assign mastery, infer emotion, record microphone input, or upload voice data.

## Outcome 15 — Privacy-first Digital ID and student bridges
- [x] Students with a created local account can create a Digital ID with a chosen alias, stable local handle, and a picture captured from the camera or selected from an image file.
- [x] The picture is resized and stored under the current account’s browser namespace and managed account state when persistence is available; camera access is requested only after an explicit Start camera action, with a stop control and a file fallback.
- [x] Students can bridge their Digital ID to another created Student account in the same browser only after explicit consent; bridges expose only alias, chosen picture, handle, and bridge date, not proof drafts, grades, raw notes, or camera data.
- [x] Demo identities, Educator views, and Parent views cannot create or manage Digital IDs; the interface clearly states that this is not legal identity, accreditation, public sharing, or cross-device authentication.

## Outcome 16 — Managed database persistence
- [x] Enable the shared managed MySQL capability and create deterministic `cosmos_accounts` and `cosmos_account_state` tables at server startup.
- [x] Persist account profiles, proof records, assistant conversations, curriculum quest selection, formative AI consent/results, and Digital ID state through `/api/cosmos/state`.
- [x] Hydrate the active account from managed persistence on startup and account switching; retain browser-local storage as a visible fallback when the database is unavailable.
- [x] Keep the prototype boundary explicit: account identity is not production authentication, and database writes are shared between Preview and the published site.

## Outcome 17 — OpenAI-connected LUMA with fallback
- [x] Securely connect the configured `OPENAI_API_KEY` server-side without exposing it to the browser or repository.
- [x] Prefer the OpenAI-compatible provider for formative curriculum dialogue and analysis, falling back to the managed COSMOS model if the OpenAI credential/provider is unavailable.
- [x] Preserve guardrails: LUMA gives formative strengths, gaps, next practice, and dialogue; it never assigns mastery, grades, diagnoses ability, or makes a high-stakes decision.

## Outcome 18 — Safe rendering of incomplete saved records
- [x] Normalize proof records loaded from local storage or managed persistence so missing or malformed scores, assessor, and audit fields cannot crash Portfolio, Reports, review, or navigation.
- [x] Preserve existing evidence and valid scores; show missing ratings as unassessed, never as invented grades, and block mastery confirmation without all eight valid ratings. Export null for missing averages; incomplete stored mastery displays Review needed with recordedStatus retained.
- [x] Keep Settings reachable after viewing a partial portfolio record and retain the event-driven LUMA avatar feature. Eight isolated regression tests pass without writes to shared data.

## Outcome 19 — Portable GitHub Actions CI/CD templates
- [x] Provide CI templates for pull requests and main: reproducible install, syntax and route checks, isolated regression tests, static build artifacts, credential-free smoke tests, dependency audit, and a Docker build job. Docker execution was not possible locally.
- [x] Provide a deployment template that depends on successful CI, uses least-privilege permissions and immutable action pins, and remains disabled until an ordinary Actions-enabled repository and a compatible deployment target are configured.
- [x] Keep production credentials and learner records out of builds and CI. Support a separately configured HTTPS deployment adapter with immutable image digest and revision health verification; preserve Manus hosting.
- [x] Validate the runnable local checks and provide setup documentation. Eleven tests, local syntax/route/build/smoke checks, dependency audit, and actionlint validation passed. No remote workflow run or deployment was claimed.
- [ ] Activate a compatible GitHub Actions workflow and confirm a live deployment. Not activated: the website remains Manus-managed, GitHub code sync alone does not enable workflow templates, and no approved compatible deployment adapter is configured.
