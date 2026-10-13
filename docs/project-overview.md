# CodeLab — Project Overview

Status: Phase 1 approved and complete on 2026-10-13. The project owner explicitly authorized Phase 2.1 initialization. Phase 1 documents remain the requirements baseline; implementation evidence is tracked in development-roadmap.md.

## Purpose and scope

CodeLab is a programming laboratory for college instructors and students. Instructors manage private classrooms, publish programming exercises, inspect attempts, give feedback, and export results. Students join by invitation code, practice in an online editor, submit solutions, and track their work.

The architecture is a separate React/TypeScript frontend and Laravel REST API, with MySQL as the authoritative store, Redis for asynchronous work, and a separately isolated execution service. The first release is a local demonstration using synthetic student data, confirmed by the project owner. A real college pilot requires a later approved deployment plan; this is not a general online judge or full learning management system.

## Documentation map and authority

| Document | Owns |
| --- | --- |
| [Functional requirements](functional-requirements.md) | Product behavior, grading and deadline rules |
| [Non-functional requirements](non-functional-requirements.md) | Measurable quality and operational targets |
| [Roles and permissions](user-roles-permissions.md) | Access boundaries |
| [Workflows](user-workflows.md) | User journeys and failure recovery |
| [Database design](database-design.md) | Entities, relationships, integrity |
| [API design](api-design.md) | Proposed resources and response contracts |
| [Authentication and security](authentication-security.md) | Identity, threat model and safeguards |
| [System architecture](system-architecture.md) | Components, trust boundaries and execution lifecycle |
| [Development roadmap](development-roadmap.md) | Seven phases and acceptance gates |

This overview owns unresolved decisions. Functional requirements own shared business rules; other documents must be updated when those rules change. These are proposed contracts, not evidence of implemented features or tested performance.

## MVP and future boundary

**MVP:** two roles; student registration and account recovery; provisioned instructor accounts; private classroom/section management; invitations and enrollment; categorized activities with examples and public/hidden tests; one initial programming language; Monaco editor; asynchronous Run and Submit; deterministic automated scores; attempt history; text feedback; grading-period progress and CSV exports; essential audit records and operational monitoring.

**Future:** dual-role accounts, co-teachers, public classroom discovery, institutional administration UI, SSO/MFA, plagiarism detection, AI assistance, file uploads or multi-file projects, interactive/network programs, arbitrary dependencies, additional languages, scheduled publication, per-student extensions/exemptions, late penalties, manual grade overrides, rubric grading, regrading/version history, weighted final course grades, XLSX/PDF exports, LMS integration, notifications beyond account email, and real-time collaboration. These are not Phase 1 commitments.

## Terms

- **Classroom:** one instructor-owned course section for one academic year and semester; a student can belong to many classrooms.
- **Section:** the classroom's section label, not a nested enrollment unit in the MVP.
- **Activity:** the resource for both `activity` and `assignment` types.
- **Run:** practice execution using public examples or custom input, never an assessed attempt.
- **Submission:** an immutable assessed source snapshot accepted by the API.
- **Graded:** evaluation finished, including compile failure or a zero score. This does not mean all tests passed.
- **Completed/pending/missed:** participation categories defined in the functional requirements, separate from correctness and execution status.

## Planning decisions and confirmation status

The project owner requires planning to be finalized before code generation. Confirmed decisions are listed below. Remaining implementation defaults have been consolidated into the architect's review baseline below, approved on 2026-10-13. Approved constraints (provisional calendar, later lab-JDK matching, and production hosting outside the local demo) are explicit and do not leave demo scope undefined. Later phase references identify implementation dependencies. Execution budgets still require empirical verification during implementation; a planning agreement is not a benchmark result.

Confirmed on 2026-10-12: D01 classroom structure; D02 instructor provisioning and one role per account; D03 Java-only first release using Temurin Java 21 and a single Main.java file; D04 highest-score selection and equal points per test; D05 strict deadlines with configurable assessed limits (default 5); D06 late joiners exclude earlier closed activities and any graded submission means completed; D07 provisional calendar; D08 hidden tests expose only the aggregate score, with public-test details visible; D09 tests editable until the first assessed submission is accepted, then locked; D10 CSV activity scores/raw period totals; D11 local demonstration with synthetic data first; D12 email login and optional unique student number. The college lab's JDK version remains unknown, but this is an accepted later compatibility check, not an unresolved demo runtime choice.

| ID | Question | Decision or proposed default | Implementation dependency |
| --- | --- | --- | --- |
| D01 | Classroom versus section hierarchy? | CONFIRMED: one classroom = one section + course + academic term, with separate roster and invitation code; no separate sections table | Phase 3 schema |
| D02 | Who may become an instructor? | CONFIRMED: operator-provisioned instructor accounts; public registration creates students; exactly one role per account | Phase 3 auth |
| D03 | Which language and program format? | CONFIRMED: Temurin Java 21 for the demo; one UTF-8 Main.java file, class Main with standard main method, stdin/stdout, no packages or external libraries. Match the college lab later when its version is known | Phase 2 editor choice, Phase 5 runtime |
| D04 | Which attempt determines the grade? | CONFIRMED: highest graded score; equal points per test. Proposed: zero for compile failure; no manual overrides | Phase 4 authoring |
| D05 | Deadline and attempt policy? | CONFIRMED: strict deadline, no late submissions, configurable assessed limit defaulting to 5; Runs separate. Proposed configurable range 1–50 | Phase 4 authoring |
| D06 | What is completed, and how are late joiners treated? | CONFIRMED: earlier closed activities are visible as not assigned and excluded from a late joiner's possible points; any graded submission counts as completed, even zero | Phase 4 enrollment |
| D07 | Calendar conventions? | APPROVED PROVISIONAL: academic year expressed by start/end year; First, Second and Summer terms; Asia/Manila timezone; OC = Online Class, LAB = Laboratory. Revisit when the user receives the complete schedule/terms; no actual term dates are invented | Phase 3 schema |
| D08 | How private are hidden tests? | CONFIRMED: score only for hidden tests; public-test details visible; hidden inputs, outputs and individual verdicts remain private. Proposed safeguard: also suppress hidden timing/memory/explanations | Phase 4 serializer, Phase 5 runner |
| D09 | What may change after publishing? | CONFIRMED: tests editable before the first accepted assessed submission, then locked; later corrections require a replacement activity. Proposed: other assessment fields freeze at publication; deadline extensions/attempt-limit increases remain allowed and audited | Phase 4 publication |
| D10 | Reports versus official course grades? | CONFIRMED: CSV activity scores and raw period totals; no official weighted course-grade calculation. Provisional and missing results remain labeled | Phase 6 reporting |
| D11 | Hosting, load, and runner choice? | CONFIRMED: local demo with synthetic data; real hosting is a later plan. ARCHITECT BASELINE: same-origin local proxy, project-specific Linux application containers, dedicated Linux runner VM using Docker/runsc (gVisor), one active evaluation. Local hardware inspected; actual isolation and capacity remain Phase 5 gates | Phase 2 environment, Phase 5 execution |
| D12 | Retention and identity rules? | CONFIRMED: email login and optional unique student number. ARCHITECT BASELINE: synthetic data only, explicit demo cleanup, Runs 24h/logs 30d. Real academic retention requires institutional approval in the later deployment plan | Phase 3 identity, later live deployment |
| D13 | Seven phase labels and reporting? | ARCHITECT BASELINE: seven phases in the roadmap. User requires a clear completion notice for every phase; track evidence and do not report an incomplete phase as complete | Each phase gate |
| D14 | Visual rule conflicts? | ARCHITECT BASELINE: preserve DESIGN.md; use its 8px button-radius rule over the conflicting pill-button example; adapt marketing spacing to lab screens and prioritize contrast/accessibility | Phase 2 design |

## Final review baseline

These architect-selected defaults consolidate the remaining details for one final review; they are not represented as individual user confirmations:

- Strict deadlines use server time; limit range is 1–50 with default 5. Student-caused compile/runtime/limit failures consume an attempt; infrastructure failures have no score and release the slot. Best score uses decimal arithmetic and rounds only the final result.
- Non-test assessment content freezes on publication; tests lock at the first accepted assessed submission. Deadline extensions and limit increases are audited. No manual grade override, automatic regrading or silent exclusion of replacement activities is in the MVP.
- Hidden output, per-test diagnostics, timing and memory remain private. Sessions use Sanctum cookies/CSRF; classroom policies apply to every read, mutation and export.
- Local authentication emails go to a development mail catcher, allowing synthetic verification/reset journeys without sending to real people. Secrets and dataset resets remain project-specific.
- The compatible dependency baseline, Linux application environment and isolated runner design are specified in system architecture. No packages or VM software have been installed during planning. Exact resolved dependency locks and image digests are produced during authorized setup, then verified before use.
- Local demo capacity starts at 10 synthetic accounts, 5 concurrent browser sessions and one active evaluation. Higher college-pilot targets are deferred; execution safety is not relaxed for the demo.
- The supplied frontend structure, DESIGN.md, naming/import/layer rules and no-restructure-without-approval constraint remain mandatory.

When the real schedule arrives, update the calendar decisions and any unstarted classroom drafts before publication. Published academic history must not silently change terms or timezone; create the appropriate new term classroom or agree an explicit data transition. When the lab JDK is known, compare language/runtime compatibility before real classroom use; never silently replace the runtime of an existing assessed activity.

## Visual source and plan approval

Frontend architecture is confirmed by the user's explicit instruction: follow [PROJECT_STRUCTURE.md](<C:/Users/ED/Desktop/Voting System/frontend/PROJECT_STRUCTURE.md>). Use @/ for cross-directory imports, kebab-case filenames, PascalCase components, composition-only pages, API calls in services/, feature UI in components/features/, and shared primitives in components/ui/. Follow the reference's dependency rules. Directory restructuring requires explicit approval. The [system architecture](system-architecture.md) records the full tree and conventions; this replaces the earlier frontend feature-colocation proposal without changing any application directories.

[DESIGN.md](../DESIGN.md) is the visual authority: warm off-white canvas, white surfaces, blue primary actions, restrained borders and flat colors. It is an existing Notion style reference, not a CodeLab screen specification. Phase 2 will apply the installed `design-taste-frontend` skill while respecting DESIGN.md and product needs. It must not introduce unrelated branding, marketing layouts, proprietary-font dependencies, or conflicting defaults. Use available font substitutes and validate contrast.

The user's design requirements are confirmed: apply the installed taste skill when relevant, prioritize usability and accessibility, and maintain consistent responsive layouts. The skill does not authorize changes to the agreed architecture.

Phase 1 delivers documentation only. Approval is required before creating the frontend/backend projects, installing application dependencies, creating migrations, or implementing endpoints. No current planning default is a claim that the execution sandbox is secure or production-ready.
