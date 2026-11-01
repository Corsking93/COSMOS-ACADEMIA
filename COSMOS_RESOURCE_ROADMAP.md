# COSMOS ACADEMIA Resource Roadmap

## Highest-return improvements

### 1. Make the assistant accessible, not only impressive
Start with the W3C **WCAG 2.2** success criteria and the **ARIA Authoring Practices Guide**. WCAG 2.2 is the reference for keyboard access, visible focus, focus not being obscured, target sizing, contrast, headings, and accessible authentication. The ARIA guide adds concrete keyboard and semantic patterns for controls, comboboxes, live regions, and landmarks. [1] [2]

Apply these directly to COSMOS LUMA:

- Give the chat transcript an `aria-live="polite"` region so new guidance is announced without interrupting the learner.
- Keep a visible, high-contrast focus ring on quick prompts, the account switcher, and the read-aloud controls.
- Label the assistant orb and status in text; never make the glowing sphere the only way to understand state.
- Provide a stop/pause control for speech synthesis and preserve the text transcript as the equivalent experience.
- Test the entire Assistant and COSMOS PROOF flows with keyboard-only navigation and a screen reader.

Resources: [W3C WCAG 2.2][1] and [W3C ARIA Authoring Practices Guide][2].

### 2. Use Universal Design for Learning as the product design check
CAST’s UDL Guidelines 3.0 organize inclusive learning around multiple means of engagement, representation, and action/expression. The guidance explicitly emphasizes learner agency, choice, multiple ways to perceive information, multiple media for communication, and monitoring progress. [3]

COSMOS already has a useful foundation with text, evidence, visual diagrams, accommodations, and read-aloud. The next upgrade should let a learner choose how to interact with an objective: read it, hear it, view a diagram, type an explanation, attach an artifact, or use a guided reflection. The selected mode should be stored as an accommodation preference, not treated as a lower-quality path.

Resource: [CAST UDL Guidelines 3.0][3].

### 3. Turn LUMA into a metacognitive coach
The Education Endowment Foundation’s 2025 guidance on metacognition and self-regulated learning recommends explicit support for planning, monitoring, and evaluating learning. It also points to modelling, scaffolding, and subject-embedded strategies rather than generic motivational prompts. [4]

This maps cleanly to three assistant modes:

- **Plan:** “What are you trying to make observable?”
- **Monitor:** “Which rubric dimension is still uncertain?”
- **Evaluate:** “What changed in your explanation after the evidence review?”

Add a short reflection after each proof submission and save the learner’s response with the report. This would make LUMA more educationally meaningful than a general chatbot.

Resource: [EEF Metacognition and Self-Regulated Learning][4].

### 4. Give objectives and competencies stable identifiers
1EdTech’s CASE standard is a strong long-term model for the Learning Atlas. CASE represents standards, competencies, and learning objectives as a hierarchy with stable globally unique identifiers. It can also carry rubrics, associations, and assessment results. [5]

COSMOS should keep the current IDs such as `BIO-04` and `RES-02`, then evolve them into stable records with fields such as `id`, `parentId`, `title`, `description`, `domain`, `version`, and `rubricId`. This will make portfolio exports, educator reports, pathway progress, and future integrations much more reliable.

Resource: [1EdTech CASE][5].

### 5. Treat child privacy as a product feature
The FTC’s COPPA rule applies to services directed to children under 13 and to services with actual knowledge that they collect personal information from children under 13. The ICO’s Age Appropriate Design Code recommends high-privacy defaults, data minimization, limited sharing, disabled geolocation by default, and restraint around profiling and nudges. [6] [7]

For COSMOS, keep the current prototype boundary visible and add a formal privacy checklist before real child onboarding:

- Do not collect a child’s real name, birth date, precise location, or voice by default.
- Keep assistant conversations private and account-scoped.
- Require explicit learner or guardian consent before sharing reports.
- Avoid behavioral scoring, emotion inference, streak pressure, and public rankings.
- Add retention and deletion controls before moving from local storage to a server database.

Resources: [FTC COPPA Rule][6] and [ICO Age Appropriate Design Code][7].

### 6. Replace local demo accounts with real authentication only when ready
The current local account flow is appropriate for a prototype because it is clearly labelled and does not pretend to provide security. For production accounts, use OWASP’s Authentication Cheat Sheet as the implementation baseline. It covers secure password handling, recovery, TLS, reauthentication for sensitive actions, session management, and risk events. [8]

Do not add a fake password field to the static prototype. When production authentication is introduced, use a managed identity system or a properly implemented server-side session model, then protect account export, deletion, consent changes, educator review, and report sharing with authenticated sessions.

Resource: [OWASP Authentication Cheat Sheet][8].

### 7. Keep auditory assistance transparent
MDN documents the Web Speech API as two separate capabilities: `SpeechSynthesis` for text-to-speech and `SpeechRecognition` for microphone-based input. Speech synthesis can use the device’s speech service; speech recognition may use a platform service or be configured for on-device recognition where supported. [9]

COSMOS should keep read-aloud enabled as the default auditory enhancement because it does not require microphone capture. If voice input is added later, make it opt-in, show a recording state, explain where processing occurs, provide a visible stop control, and never save raw audio by default. Use a Permissions Policy and a browser compatibility fallback.

Resource: [MDN Web Speech API][9].

## Suggested implementation order

First, add WCAG/APG checks to the existing Assistant and proof workflow. Second, add the Plan–Monitor–Evaluate reflection loop to LUMA and save the resulting reflection in reports. Third, formalize objective IDs and rubric records so portfolio exports can evolve toward CASE-style interoperability. Fourth, complete the child privacy and production-authentication design before collecting real learner data.

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines 2.2"
[2]: https://www.w3.org/WAI/ARIA/apg/ "ARIA Authoring Practices Guide"
[3]: https://udlguidelines.cast.org/ "CAST Universal Design for Learning Guidelines 3.0"
[4]: https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition "EEF Metacognition and Self-Regulated Learning"
[5]: https://www.1edtech.org/standards/case "1EdTech Competencies and Academic Standards Exchange"
[6]: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa "FTC Children’s Online Privacy Protection Rule"
[7]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "ICO Age Appropriate Design Code"
[8]: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html "OWASP Authentication Cheat Sheet"
[9]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API "MDN Web Speech API"
