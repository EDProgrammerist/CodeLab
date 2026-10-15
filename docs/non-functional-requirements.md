# Non-functional Requirements

> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

Status: proposed quality targets, not measured capabilities. The confirmed first release is a local demonstration with synthetic data. Measure and record its actual hardware/workload; the 200-account/50-concurrent-user baseline below is a future pilot objective, not a guarantee or mandatory local-demo capacity. Production hosting and institutional requirements are intentionally deferred to a later approved deployment plan under D11/D12.

| ID | Area | MVP target and verification |
| --- | --- | --- |
| NFR01 | Isolation | No cross-classroom or cross-student data access in policy/API tests, including nested IDs, lists, exports, feedback and guessed identifiers |
| NFR02 | Runner containment | Before accepting student code, verify blocked network/metadata access, process/memory/CPU/output/disk caps, no host mounts or credentials, process-tree cleanup and isolation between jobs |
| NFR03 | Pilot capacity | Baseline load test: 200 registered accounts, 50 concurrent users, 5 simultaneous sandbox executions; set actual runner concurrency from hardware evidence |
| NFR04 | API performance | On declared staging hardware at baseline load, p95 ordinary reads <500ms and submission admission <1s, excluding execution and external email; errors and saturation reported separately |
| NFR05 | Execution latency | For the approved simple sample workload, p95 queue wait <10s and completion <30s at baseline load; never promise this for all programs. Show queued status, back off polling and reject excess intake with retry guidance |
| NFR06 | Reliability | No duplicate counted attempt or terminal result under concurrent clicks, queue redelivery, network loss or worker restart; stranded queued jobs recovered by reconciliation within 60s when dependencies are healthy |
| NFR07 | Recovery | Proposed daily encrypted MySQL backups, 24h RPO and 4h RTO; prove restoration including private tests and grades before pilot. These are recovery objectives, not uptime guarantees |
| NFR08 | Accessibility | Target WCAG 2.2 AA: keyboard navigation, visible focus, labels/errors, adequate contrast, status text beyond color, reduced motion, editor escape instructions and screen-reader testing; no claim of certification |
| NFR09 | Responsive UI | Core views work at 360px, 768px and 1366px widths; narrow editor/output panes stack or use tabs. Dense report tables have contained scroll, not page overflow |
| NFR10 | Compatibility | Validate current stable Chrome, Edge and Firefox on lab desktops; smoke-test mobile reading/navigation. Actual institutional browser versions recorded in Phase 7 |
| NFR11 | Privacy | No passwords, invitation plaintext, hidden tests, source code or program output in ordinary logs/telemetry; private data excluded from shared/public caching |
| NFR12 | Maintainability | TypeScript strict checking; Laravel policies and request validation; one shared grading calculation per server use case; migrations and tests added only in implementation phases |
| NFR13 | Observability | Correlation IDs across admission/queue/runner; track queue age, system errors, worker health and sandbox saturation; alert on sustained failure without copying student data into alerts |
| NFR14 | Delivery quality | CI later requires frontend type/build checks, relevant unit/integration tests, API policy/concurrency tests and runner containment checks; manual end-to-end classroom rehearsal before release |
| NFR15 | Frontend architecture | Follow the supplied PROJECT_STRUCTURE.md as recorded in system architecture. Review/lint cross-directory @/ imports, kebab-case filenames, PascalCase components, page composition, service-only networking and downward layer dependencies. Verify Vite/TypeScript aliases agree. Directory restructuring requires approval |

## Execution budgets and overload

The revised local-demo workload uses ten synthetic student accounts and five concurrent browser sessions, with code admissions instead of runner evaluations. Read p95 remains below 500ms and admission below 1s. The short measured sample and its limits are recorded in phase-6-7-acceptance.md. Runner latency targets are deferred; the larger pilot workload is a future objective.

Provisional Java per-test budgets: 2 CPU seconds, 5 wall seconds including JVM startup, 512 MiB total memory, 64 processes/threads, 32 MiB temporary disk, 64 KiB stdout and 64 KiB stderr. Compilation has a separate proposed cap of 10 CPU seconds, 30 wall seconds, 512 MiB total memory, 64 processes/threads, 32 MiB disk/artifacts and 64 KiB per diagnostic stream. Heap and native/JVM memory must fit the total cap; an OS process/thread limit must accommodate tested JVM operation while bounding abuse. Benchmark these limits before activation; they are not measured requirements of every Java program. Up to 20 tests means up to 100 seconds test wall time, plus 30 seconds compilation and bounded orchestration overhead; nominal whole-evaluation cap is 150 seconds. Thus a 30-second typical completion target is not a maximum deadline.

Public/custom Runs use these caps too. Stop output capture and kill the workload at its limit; do not buffer unlimited output first. Java compilation is required in the first release and must be sandboxed and bounded independently of execution. A platform timeout from lost control-plane connectivity is distinct from a student exceeding build/test limits. Measure compiler/JVM overhead against the pilot workload before promising queue latency or sizing concurrency.

Bound per-student, per-classroom and global pending work. The local-demo queue cap is 10 waiting evaluations, returning 503 before admission when saturation is known; any increase requires load evidence. A future pilot may consider 100 waiting evaluations after sizing. Separate Run and grading queues, with grading preferred and bounded practice capacity. Validate isolation under simultaneous abusive submissions as well as normal workloads.

## Data lifecycle and availability

MySQL is the source of truth; Redis loss must not erase accepted source or grades. During a known runner outage, reject new execution requests before allocating attempts; work accepted just before failure remains visible and recoverable. Show service degradation and contact instructions; do not silently claim success.

Proposed retention: Runs 24 hours, operational logs 30 days, academic records and academic audit events 1 year after classroom term end. Confirm institutional retention, appeal windows and deletion authorization before real student data. A coordinated purge must account for tests, source, feedback, exports and backup expiration; no cascade-delete UI shortcut. Backups expire after a proposed 30 days. Avoid persistent export files in the pilot by streaming CSV.

## Visual quality

Use [DESIGN.md](DESIGN.md) as the Phase 2 reference, with documented accessibility corrections where necessary. Reuse shadcn/ui primitives and Tailwind tokens, keep clear empty/loading/error/queued/graded/system-error states, and make deadline timezone and remaining attempts visible. Do not copy marketing-scale headings into the programming workspace. Phase 2 must inspect the installed taste skill; this planning phase does not generate visual or application code.

Usability, accessibility and consistent responsive layouts are explicit user requirements. Place shared primitives in components/ui/, feature UI in components/features/, and the app shell in components/common/ according to PROJECT_STRUCTURE.md. Design work and skill recommendations must preserve those boundaries; visual changes do not authorize architectural restructuring.
