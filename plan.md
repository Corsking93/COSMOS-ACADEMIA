# COSMOS ACADEMIA — MVP Plan

## Scope and implementation approach

Build a single-page, responsive educational workspace with client-side routing, seeded demo data, and localStorage persistence. The MVP foregrounds COSMOS PROOF instead of presenting a marketing-only site. The app will run as a static website on port 3000 with no authentication, database, or uploads service required for the first demonstrable version; file attachment is represented by a local filename and evidence note, and all demo limitations are clearly labeled.

Primary surfaces:
- **Home / dashboard**: welcome panel, continue-learning card, pathways, proof queue, evidence activity, competency progress.
- **COSMOS PROOF**: objective selection, knowledge check, evidence submission, rubric review, mastery status, next steps, and attempt history.
- **Portfolio**: demo evidence, competency tags, assessment history, export/share preview with explicit consent controls.
- **Learning Atlas**: subject → discipline → concept → objective hierarchy seeded with the requested domains.
- **Pathways**: age-flexible prerequisite progression, accommodations, and exploratory advanced-topic notes.
- **Educator view**: review queue, feedback, rubric calibration, and audit trail.
- **Settings & About**: privacy-by-default controls, local data controls, clear MVP limitations, and philosophy.

The frontend is organized into data, routing/state, shared shell, page views, components, and styling. Proof records contain learner alias, objective ID, submission type, evidence description, rubric scores, assessor, feedback, created date, status, and audit events. The mastery rule is explicit: a record can reach Mastered only when all relevant dimensions are at least Proficient, evidence is submitted, and a human assessor has reviewed it; otherwise it remains Reviewed, Revision needed, or In progress. The demo never describes itself as accredited or cryptographically verified.

## Project structure

- `index.html` — app shell and semantic root.
- `src/main.js` — seeded data, client state, route handling, interactions, and rendering.
- `src/styles.css` — responsive visual system, orbital motifs, accessible states, reduced-motion rules.
- `public/manus-routes.json` — route manifest for `/`, `/proof`, `/portfolio`, `/atlas`, `/pathways`, `/educator`, `/settings`, `/about`.
- `app.config.ts` — project logo metadata.
- `TODO.md` — outcome-based acceptance clauses and progress.

## Design direction

### Considered styles
- Precision observatory console — probability 0.08.
- Editorial learning laboratory — probability 0.06.
- Quiet civic archive — probability 0.05.

### Chosen style: Precision observatory console

**Design Movement:** Cosmic observatory meets precision research instrument, translated into an evidence-first learning console.

**Core Principles:** Evidence before decoration; calm confidence over gamification; high signal-to-noise hierarchy; human-readable trust cues.

**Color Philosophy:** Near-black navy establishes focus and seriousness. Deep indigo panels create instrument-like depth. Electric cyan is reserved for active evidence, progress, and links; warm amber marks attention, pending review, and human judgment. Muted lavender and slate support long reading without competing with the core signal colors.

**Layout Paradigm:** A left instrument rail anchors navigation while the main workspace behaves like a horizontal observatory bench: one primary task surface, flanked by small evidence/status instruments. Dense content is grouped into readable panels rather than centered marketing cards.

**Signature Elements:** A geometric orbit mark around the central knowledge point; fine starfield/graticule textures; small “signal” rails, dots, and arc progress indicators.

**Interaction Philosophy:** Actions reveal state. Rubric changes immediately update mastery posture, but do not auto-claim mastery without human review. Every meaningful action gets a visible status message. Forms are keyboard-first, labels are explicit, and demo data is unmistakable.

**Animation:** Subtle orbit drift and panel reveal only where it clarifies context. Motion uses short fades and restrained transforms; all nonessential motion is disabled under `prefers-reduced-motion`.

**Typography System:** Use `Inter`-like system sans for interface copy with tight uppercase micro-labels, and a high-contrast serif fallback for major page headings to evoke research notes. Large headlines are compact and left-aligned; body copy stays at comfortable reading width.

**Brand Essence:** A universal learning observatory where progress is demonstrated with evidence, reviewed with care, and carried forward. Personality: rigorous, curious, humane.

**Brand Voice:** Headings are direct and invitational; CTAs describe the next observable action. Example lines: “Make the learning visible.” and “Review the evidence, not the clock.”

**Wordmark & Logo:** COSMOS is a tracked uppercase wordmark paired with a four-node orbit ring around a cyan core. The ring is used as both favicon-like identity and status motif.

**Signature Brand Color:** Electric cyan `#53E0FF`, used sparingly as the brand’s unmistakable evidence signal.

## Delivery

Implement the static app, start port 3000, verify route manifest and HTTP readiness, run lightweight syntax/build checks, inspect diagnostics, then commit to the managed `main` branch for checkpointing. Do not publish automatically; the app is delivered in Preview unless an explicit publish action is requested.


## Visual refinement — COSMOS signal layer

The interface keeps the precision observatory direction but increases its unmistakable COSMOS character: layered nebula gradients sit behind a calibrated starfield, panels gain instrument-like inner highlights, the topbar receives a cyan signal trace, the brand core pulses gently, and orbital diagrams gain slow geometric drift. Motion remains decorative only and is disabled by both the in-app reduced-motion setting and the OS preference.


## Local account and report persistence

The MVP now supports browser-local accounts identified by a display name or alias. Each account has its own local record namespace, can be switched from the shell, and receives a Saved Reports & Grades view. Report grade bands are derived transparently from rubric averages and review status, clearly labeled as prototype signals rather than accreditation. No passwords, email collection, cloud sync, or cross-device authentication are introduced without a backend.


## Orbital Assistant extension

The Student workspace now includes an account-gated Orbital Assistant named LUMA. Its visual language is a Jarvis-inspired but COSMOS-native spectrum-of-light sphere: layered rings, colored particles, a luminous core, and restrained orbital motion. Interaction is text-first with contextual guidance from account-scoped proof records; browser speech synthesis provides read-aloud responses locally. Demo identities see the locked state, while created local accounts receive a private persisted conversation. The assistant is explicitly non-surveillant and non-determinative.


## Digital ID and account bridge extension

Add a Student-only Digital ID workspace. A created local account can choose an alias and a picture captured through an explicit browser camera permission or selected from a file. The image is downscaled and stored under the account’s local browser key. Students can create a consented bridge to another created Student account in the same browser; only Digital ID summary fields are shared. Demo, Parent, and Educator contexts remain blocked. The UI states that the MVP is not legal identity, public sharing, accreditation, or cross-device authentication.

## Managed persistence and AI provider extension

The server now uses the managed MySQL capability when `DATABASE_URL` is available. Startup creates additive `cosmos_accounts` and `cosmos_account_state` tables, then exposes `/api/cosmos/state` for account-scoped hydration and upsert persistence. The browser keeps its localStorage namespace as a fallback and displays the current persistence state; this remains prototype storage rather than authenticated multi-tenant identity.

LUMA’s formative endpoint is server-only. It prefers the protected `OPENAI_API_KEY` through an OpenAI-compatible chat-completions endpoint, then falls back to the managed COSMOS model when the OpenAI credential or provider is unavailable. Only objective context, selected proof evidence, and the learner prompt are sent. The response is constrained to formative strengths, gaps, next practice, and dialogue; it cannot assign mastery, grade, diagnose ability, or make a high-stakes decision. The key is never included in client code or repository files.

## Partial-record compatibility repair

`src/record-data.js` normalizes proof records at local loading, remote hydration, save, and render boundaries. Absent or invalid rubric dimensions remain null (unassessed), assessor and audit fields receive safe display defaults, and valid evidence and extension fields are preserved. Reports average only assessed records and export null for absent averages. A stored Mastered status without a complete human-reviewed rubric displays Review needed; its original value remains in recordedStatus. Empty or incomplete rubrics cannot satisfy mastery confirmation. Regression tests exercise the actual page renderers and navigation in an isolated in-memory environment, with no shared database writes. The event-driven LUMA avatar changes are retained.

## Portable CI/CD preparation

Use GitHub's native Actions mechanism for the requested CI/CD when a normal Actions-enabled repository is available. The current managed connection does not support Actions and the GitHub transfer still awaits confirmation, so retain workflow drafts in `ci-cd/github-actions/` rather than activate them. Reusable local commands perform syntax/route checks, isolated tests, static builds and credential-free server smoke tests. Docker copies an explicit runtime allowlist and exposes optional release revision metadata. The deployment template depends on CI and an explicit enablement variable, publishes an immutable image digest, calls a separately configured HTTPS adapter once, and verifies the exact revision through health probes. Do not copy development credentials, provision another host, or change Manus deployment to work around the unsupported integration.

## Existing GitHub repository code sync

The user selected a separate source-code sync into the existing `Corsking93/COSMOS-ACADEMIA` repository instead of creating a new canonical repository. The unused transfer was aborted. Clone and update the existing main branch through the authorized GitHub connector, preserve the initial README description and commit history, and copy only versioned application files plus the prepared CI/CD scripts and tests. Do not copy secrets, database state, learner exports, dependencies, or build output. Manus continues to use its original canonical repository and hosting. CI/CD drafts stay outside the active workflow directory.
