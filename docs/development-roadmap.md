# Seven-Phase Development Roadmap

Status: Phase 1 approved on 2026-10-13; Phase 2.1 initialization complete on 2026-10-13. No phase duration is promised before implementation evidence exists.

## Phase status and completion notices

The user requested a clear notification when every phase completes. At each phase gate, record the deliverables, checks actually performed, known limitations and next phase. State “Phase N complete” only when all applicable acceptance criteria, including any explicit approval gate, are met. A prepared draft or passing subset of checks is not phase completion. Report blocked or pending work plainly.

| Phase | Current status | Completion evidence |
| --- | --- | --- |
| 1 — Planning Our Project | Complete, approved 2026-10-13 | Ten documents, 13-table ERD, API/security rules, structure and version baseline; user explicitly approved the plan and Phase 2.1 |
| 2 — Project Foundations and Frontend Design | Phase 2.1 complete; 2.2/2.3 pending | React and Laravel boot; checks and service connectivity pass; see local-development.md |
| 3 — Data Model, Authentication and Authorization Foundation | Not started | No migrations/auth implementation performed |
| 4 — Classrooms and Activity Authoring | Not started | No feature implementation performed |
| 5 — Editor, Isolated Execution and Automated Grading | Not started | No runner initialized or containment tested |
| 6 — Feedback, Progress and Grade Reports | Not started | No report/feedback implementation performed |
| 7 — Hardening and Local Demonstration Acceptance | Not started | Real deployment is a separate later approval |

After Phase 1 approval, update its status to complete and announce that milestone before starting the authorized next phase. Future completion notices should identify the next phase without implying authorization to publish or restructure directories. Keep status here in the repository; no recurring automation or notification service is needed.

## Phase 1 — Planning Our Project (complete)

Deliver the ten linked documents; establish MVP/future boundary, assumption register, schema relationships, REST resources, access model, grading rules, safe execution design and acceptance gates.

Acceptance criteria:

- All ten requested Markdown documents exist in docs and are internally consistent.
- Both roles and private classroom boundaries are defined, including nested IDs, reports, polling and feedback.
- Run/Submit, hidden tests, attempt accounting, deadlines, retries, immutable source and grading semantics are explicit.
- Database and API are proposals only; no React/Laravel initialization, migrations or application code.
- Unresolved requirements and security risks are presented to the project owner.
- All planning decisions are resolved or explicitly accepted as a documented constraint before code generation. ERD, folder structure, technology versions and the runner/deployment approach are part of the approval package; later phases validate implementation rather than silently choose new product policies.
- The project owner approves the plan and initialization scope. Document creation alone does not satisfy this approval gate.

## Phase 2 — Project Foundations and Frontend Design

After approval, recheck compatibility of the versions selected in Phase 1 and initialize separate frontend/backend projects. Establish local MySQL/Redis configuration, environment templates, lint/type/build checks and basic CI. Apply DESIGN.md and the installed design-taste-frontend skill to a reusable visual system and role-based screen prototypes with clearly labeled mock data. Material changes to the approved plan require a documented decision before implementation.

Prioritize login, classroom list, activity list, editor with instructions/output, instructor authoring and gradebook layouts. Represent empty/loading/error/closed/queued/system-error states. Do not connect a real untrusted-code runner yet. Implement the approved Java editor, deployment topology and DESIGN.md conflict resolution. Local development hardware may differ from the eventual Linux runner.

For unambiguous progress reporting, use these checkpoints within Phase 2:

- **2.1 — Environment and initialization:** separate React/Vite and Laravel projects boot; selected Node/PHP versions and trusted local services are documented; baseline build/type/backend checks pass. Complete on 2026-10-13; evidence and commands in [local development](local-development.md).
- **2.2 — Structure and design foundation:** required alias/naming/layer rules, route groups, shared UI and DESIGN.md tokens are verified.
- **2.3 — Screen prototypes:** required responsive student/instructor screens and states are reviewed with explicitly mocked data.

Completing 2.1 does not complete Phase 2; all three checkpoints and the phase acceptance criteria are required.

Acceptance criteria:

- Frontend and API boot independently through documented local commands; example environment files contain no real secrets.
- Version choices and compatibility are recorded; frontend type/build and backend baseline checks pass.
- Frontend structure matches the supplied PROJECT_STRUCTURE.md: route composition in pages/, feature UI in components/features/, shared primitives in components/ui/, shell in components/common/, and network calls in services/. No unapproved architecture directories are introduced.
- Cross-directory imports use @/, Vite and TypeScript resolve it consistently, frontend filenames are kebab-case, component names are PascalCase, exports follow the reference, and layer-dependency review finds no reverse imports or page-owned logic/state.
- Key screens are reviewed at 360px, 768px and 1366px; keyboard/focus checks pass and DESIGN.md conflicts are resolved explicitly.
- Run/Submit, remaining attempts, timezone and feedback placement are clear in mock UI.
- Mocked behavior is labeled; no claims of functioning auth, grading or sandbox security.

## Phase 3 — Data Model, Authentication and Authorization Foundation

Implement approved D01/D02 classroom and provisioning decisions, calendar conventions and identity policy. Implement schema foundations and migrations incrementally, account/verification/recovery flows, Sanctum sessions, policies, role-safe serialization and provisioning procedure. Use isolated fixture accounts/classes to prove scope before expanding features.

Acceptance criteria:

- Registration creates only students; instructor provisioning and password setup are protected and documented.
- Email verification, login/logout, password reset and session invalidation pass tests.
- CSRF and the selected browser-origin topology work without disabling protections.
- Core foreign keys/unique constraints and role-owned relationships are verified.
- Cross-instructor/cross-student access tests reject guessed IDs and privileged request fields.
- Test-data rebuild and migration procedures are documented without risking real academic records.

## Phase 4 — Classrooms and Activity Authoring

Implement classroom lifecycle, invitation rotation/expiry, roster management, student enrollment, automatic activity allocations, categories, draft tests/examples and publication. Connect actual API data to the Phase 2 screens. Follow the grading, late-joiner and publication rules finalized in Phase 1.

Acceptance criteria:

- Two instructors maintain private classrooms; students join multiple classrooms without access leaks.
- Duplicate joins, expired codes, removed membership and owner-only reactivation work as specified.
- Published activities have all required categories/settings and valid public/hidden tests.
- Publishing freezes non-test assessment fields; tests remain editable until the first assessed admission locks them. Concurrent edit/admission tests prove one consistent suite; permitted edits, deadline/limit increases and archival are audited.
- Student responses contain no drafts or hidden fields; tests inspect payloads rather than only UI.
- Archived classrooms block new work while preserving history; late-joiner behavior is approved and demonstrated.
- Earlier closed activities are not assigned to late joiners and excluded from their possible points; later deadline extensions do not change those allocations. Publication/join races and reactivation preserve the correct allocations.

## Phase 5 — Editor, Isolated Execution and Automated Grading

Integrate Monaco, public/custom Run, immutable assessed submissions, atomic admission, Redis dispatch, recovery, isolated runner and deterministic scoring. Use the Java runtime/provider/hosting design approved in Phase 1 and benchmark execution budgets. Use the real runner only after containment controls are verified.

Acceptance criteria:

- Supported Java programs compile and grade against known-answer fixtures, including newline normalization, equal-test partial scores and compile/runtime/resource failures.
- Infinite loops, fork/process abuse, memory/disk/output floods and network/metadata probes are contained; no cross-job files, host mounts or credentials are accessible.
- Hidden test material is absent from student-visible responses, errors and logs, including output printed deliberately by student code.
- Duplicate POSTs, simultaneous final attempts and deadline boundary cases produce correct counts and one immutable accepted record.
- Queue-publish loss, worker crash, Redis redelivery, stale runner replies and exhausted retries recover without duplicate grades or lost records.
- Public Runs never affect assessed attempts or progress; system errors release capacity without becoming a graded zero.
- Declared timeout ordering and cleanup are validated on target runner hardware. If containment cannot be demonstrated, execution remains disabled and the phase does not pass.

## Phase 6 — Feedback, Progress and Grade Reports

Implement owner feedback, student history/progress, best-score selection, period filtering and CSV exports according to the approved report policy. Reuse shared grade calculations rather than duplicate UI/export formulas.

Acceptance criteria:

- Feedback is visible only to the authoring owner and the authorized submission student; editing does not change score.
- Completed/pending/missed behavior covers graded zero, active queue, expired deadlines, terminal system errors, archived activity and late enrollment.
- Best-score ties choose the documented attempt; results remain stable under refresh and concurrent new attempts.
- CSV and on-screen values agree for the same unchanged dataset; zero, missing, removed members and provisional totals are distinguishable.
- Not-assigned work is labeled and excluded from each student's denominator; a student with no assigned activities has no percentage rather than an erroneous zero grade.
- Filters cannot cross classrooms, CSV cells are neutralized against formula injection, and exported rows contain no source/tests/feedback.

## Phase 7 — Hardening and Local Demonstration Acceptance

The currently authorized planning target is a local demonstration with synthetic data. Complete integrated security, accessibility, realistic local-load and recovery checks and rehearse the full instructor/student workflow. Record the local machine and runner VM specifications and measured limits. This closes local-demo acceptance only; production/pilot acceptance below is a separate future gate and is not implied by a successful local demonstration.

Before a later real pilot, obtain the separately approved deployment plan covering hosting, budget, TLS/secrets/private networks, capacity, retention and support ownership. Reconfirm that hosting and data handling satisfy that plan before live data, then rehearse with the pilot instructor and students and approve release.

Acceptance criteria:

- Phase-specific tests and end-to-end journeys pass in the local staging/demo environment with a real isolated runner and synthetic data.
- The local NFR workload (10 synthetic accounts, 5 concurrent sessions, one active evaluation) is measured against declared hardware; unmet targets are fixed or explicitly revised before demo acceptance.
- Accessibility and supported-browser checks are recorded; no unresolved critical authorization, grading-integrity or sandbox issue remains.
- A synthetic-data backup is restored and checked for correct records; no real academic records are introduced.
- Logs/failed jobs are checked for private data; execution kill switch, worker recovery and rollback procedures are exercised.
- Runtime images/dependencies are pinned and scanned; loopback/private-network bindings and VM cleanup are verified.
- Synthetic instructor provisioning, local mail verification/reset, explicit demo cleanup and a complete classroom-to-export rehearsal pass.

Future real-deployment gate (outside local-demo completion): approve hosting, capacity, TLS/production cookies, institutional retention, encrypted-backup lifecycle, support ownership and provider data handling; meet the future pilot workload and rehearse with the college. Real deployment requires separate authorization and is not implied by Phase 1 approval or Phase 7 local-demo completion.

## Dependency order and scope control

Use the sequence foundations/design → identity and policies → classrooms/publication → execution/grading → feedback/reports → local-demo hardening. Build small vertical slices within each phase; apply relevant tests when the feature arrives rather than postponing authorization and security testing to Phase 7. Fake runner contracts can support earlier UI development but cannot close Phase 5.

Keep future enhancements from the overview out of these gates. If a decision changes the core model (multiple sections per classroom, multiple roles, editable published tests, individual accommodations or weighted final grades), update the affected documents and acceptance criteria before implementation. Do not conceal such changes inside setup work.

## Current handoff

Phase 1 was approved and Phase 2.1 authorized by the project owner on 2026-10-13. Both checkpoints are complete. React/Vite and Laravel boot separately; MySQL, Redis, Mailpit, worker and scheduler run locally. Frontend lint/type/build, backend baseline tests, Composer validation and API proxy connectivity pass. See [local development](local-development.md) for commands, versions, checks and limitations.

Phase 2 remains in progress: next is 2.2, structure and design foundation, followed by 2.3 screen prototypes. No domain migrations, authentication features or untrusted-code runner have been implemented. No remote deployment or CI execution is claimed.
