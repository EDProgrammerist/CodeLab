# System Architecture

> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

Status: local application infrastructure and Phases 1-4 are implemented. Phase 5 editor/history/feedback/report integration is implemented with simulated execution tests. The user deferred the separate Linux runner setup on 2026-10-14; real execution stays disabled. A later college deployment requires separate approval.

## Components and responsibilities

| Component | Responsibility |
| --- | --- |
| React + TypeScript + Vite | Separate frontend; role-specific classroom, activity, editor and results screens |
| Tailwind CSS + shadcn/ui | Accessible reusable UI primitives and DESIGN.md tokens, refined using installed taste skill in Phase 2 |
| React Router | Client navigation and user-friendly role/access redirects; not the authorization authority |
| TanStack Query + Axios | Server-state cache in memory, request handling, cookie/CSRF transport, async status polling |
| Monaco Editor | Source editing and language affordances; no grading or trusted execution |
| Laravel REST API + Sanctum | Sessions, authorization, validation, admission rules, authoring, reports and feedback |
| MySQL | Authoritative memberships, immutable assessed source, tests, states, results and audit history |
| Redis + Laravel queue workers | Bounded asynchronous execution dispatch and rate limiting; Redis is replaceable transport, not grade storage |
| Laravel scheduler | Recover undispatched queued work and expired leases, clean expired Runs, monitor queue health |
| Isolated execution service | Execute untrusted programs with enforceable resource and network isolation on a separate Linux host |
| Email transport | Verification and password recovery; not a course-notification subsystem |

Future directory boundaries are `frontend/`, `backend/`, and minimal deployment/runner-adapter configuration, alongside existing `docs/` and `DESIGN.md`. Phase 1 approval was received on 2026-10-13; frontend/backend initialization is complete under Phase 2.1. The local review baseline uses the established gVisor/runsc sandbox inside a dedicated Linux VM, with a small trusted supervisor exposing only fixed job operations. This is an execution control service, not a newly invented sandbox. No third-party hosted judge or paid service is selected.

## Required frontend architecture and proposed folder structure

The frontend must follow the user-supplied [PROJECT_STRUCTURE.md](../frontend/PROJECT_STRUCTURE.md). The user explicitly adopted its architecture rules for CodeLab; its configuration snippets are reference examples, not instructions to initialize or modify the Voting System project. Its sample admin group does not introduce an administrator role into CodeLab.

This replaces the earlier feature-colocated frontend proposal. The approved structure was initialized in Phase 2.1. Do not restructure the agreed directories without explicit approval. The backend layout below remains a separate proposal; frontend naming rules do not override Laravel conventions.

```text
CodeLab/
  DESIGN.md
  docs/                          Planning and technical decisions
  .agents/skills/                Installed design skills
  skills-lock.json
  frontend/                     Separate React + TypeScript + Vite project
    public/                     Static public assets only
    src/
      assets/                   Imported images, fonts and icons
      components/
        common/                 Shared shell, navigation and global modals
        features/               Feature UI and feature-local state
          auth/
          classrooms/           Invitations and enrollment included
          activities/           Authoring and student activity views
          editor/               Monaco, Run and Submit interactions
          submissions/          History, results and feedback
          reports/              Period progress and gradebook views
        ui/                     Shared reusable shadcn/ui primitives
      hooks/                    Custom hooks and TanStack Query orchestration
      lib/                      Pure helpers, formatters and validators
      pages/                    Route composition only
        guest/                  layout.tsx and <page>/index.tsx
        student/                layout.tsx and <page>/index.tsx
        instructor/             layout.tsx and <page>/index.tsx
      services/                 Axios transport, API calls and integrations
      styles/                   DESIGN.md tokens and global styles
      types/                    Shared TypeScript types only
      main.tsx                  Entry point, providers, router and route table
    index.html
    vite.config.ts              Runtime alias configuration
    tsconfig.json
    tsconfig.app.json           Type-checking and IDE alias configuration
    tsconfig.node.json
    eslint.config.js
    package.json
  backend/                      Separate Laravel REST API project
    app/
      Http/
        Controllers/Api/V1/    Resource controllers
        Requests/             Input validation
        Resources/            Role-safe response serialization
      Models/                   Eloquent records and relationships
      Policies/                 Classroom and resource authorization
      Actions/                  Admission, publication and grading operations
      Jobs/                     Asynchronous orchestration
      Services/Execution/       Private runner adapter boundary
    config/
    routes/                     API and browser-authentication routing
    database/
      migrations/               Approved schema implementation, later
      factories/
      seeders/                  Explicit local/test fixtures
    tests/
      Feature/                  API, auth, admission and integration tests
      Unit/                     Deterministic business-rule tests
  infra/                        Deployment documentation and configuration
    app/                        Proxy, worker and scheduler configuration
    runner/                     Isolated-host sandbox/runtime configuration
```

Use only the frontend directories defined by PROJECT_STRUCTURE.md. Adding a route or a feature within its prescribed placeholders is routine implementation; adding or moving architectural layers requires approval. Test placement will follow the agreed tree (for example, colocated test files); do not create a new frontend tests directory without approval. Do not add a global state framework beside TanStack Query without a demonstrated need.

Laravel controllers delegate multi-step business operations to focused Actions; policies own authorization and the execution service adapter owns runner transport. Follow normal Laravel defaults for unlisted backend paths. No repository/service layer around every model, separate Java application backend or custom orchestration platform is planned. Java is the assessed student language; Laravel remains the application backend.

### Imports and naming

- Configure the single alias `@` to resolve to frontend/src in both Vite and the application TypeScript configuration when initialization is authorized.
- Use `@/` for every cross-directory application import, including styles, types and assets. Relative `./` imports are limited to the same directory; no parent-directory imports such as `../` or `../../`. Package imports keep their package names.
- Use kebab-case frontend filenames and folders, such as activity-editor.tsx and submission-service.ts. Standard configuration filenames and the required index.tsx/layout.tsx/main.tsx names remain as specified in PROJECT_STRUCTURE.md.
- React components use PascalCase and named exports. Page index.tsx and layout.tsx files use default exports, with PascalCase component names.
- Custom hooks use use-*.ts filenames and useCamelCase function names; API services use *-service.ts; shared type files use singular nouns; constants use UPPER_SNAKE_CASE.

### Layer dependency contract

Follow the source's downward dependency direction: main → pages → feature UI → shared UI → supporting hooks/helpers/services/types. Upper layers may use appropriate lower layers; lower layers must never import back upward. Keep dependencies acyclic. The common shell is shared composition and must not contain feature-specific UI.

| Layer | Responsibility | Forbidden dependencies or behavior |
| --- | --- | --- |
| pages/ | Compose route entry points and layouts from existing components | No business logic, local state, fetching or query/mutation hooks |
| components/features/ | Feature UI, interactions and local state | No imports from pages/ |
| components/common/ | Shared shell, headers, navigation and global modals | No feature-specific content or route-page imports |
| components/ui/ | Stateless reusable primitives; shared visual building blocks | No imports from components/features/ or pages/; no feature business behavior |
| hooks/ | Reusable stateful logic, queries and mutations calling services | No imports from components/ or pages/; no direct network requests |
| lib/ | Pure functions, formatting and validation | No React-component imports, network calls or side effects |
| services/ | All API/external calls, Axios instance and cookie/CSRF transport | No imports from components/, pages/ or React hooks |
| types/ | Shared type definitions | No runtime code or runtime dependencies |

For example, an activity page composes the activity editor feature; that feature uses a submission hook; the hook calls a submission service through the shared HTTP service. Only services perform requests. TanStack Query handles cache invalidation and polling through hooks, not through a service importing React or a page holding application state. Shared UI receives data and event handlers through props. Browser route guards remain UI convenience; Laravel policies remain authoritative.

### Frontend design contract

DESIGN.md governs visual choices; PROJECT_STRUCTURE.md governs code organization. Apply the installed design-taste-frontend skill when visual implementation or review benefits from it, but it must not override either document or introduce a directory restructure. Prioritize clear workflows, usable controls and accessibility. Keep layouts, spacing, typography and interaction states consistent across guest, student and instructor routes. Verify keyboard/focus behavior, contrast, reduced motion and responsive layouts at 360px, 768px and 1366px as defined in the non-functional requirements. Keep code-editor and report layouts usable at narrow widths with stacked panels or contained scrolling.

### Dependency baseline and compatibility evidence

The stack in the component table is fixed by the project brief. This proposed version baseline was checked using publisher npm/Packagist metadata and official runtime guidance on 2026-10-12. It establishes a concrete plan, not proof of a successful install/build. Resolve transitive dependencies and create lockfiles only during authorized initialization; recheck security fixes within the selected release lines then. Do not silently adopt new major versions.

| Component | Review baseline | Reason or compatibility check |
| --- | --- | --- |
| Node.js | 24 LTS, current patched release | Project runtime; leave existing Node 26 installation unchanged |
| React / React DOM | 19.3.0, matched versions | Router, TanStack Query and Monaco wrapper declare compatible React peer ranges |
| TypeScript | 6.0.3 | Current typescript-eslint 8.71.1 declares >=4.8.4 and <6.1.0; avoid selecting TypeScript 7 merely because it is latest |
| Vite / React plugin | 8.3.4 / 6.1.2 | Plugin declares Vite 8; Node 24 satisfies the declared engine ranges |
| Tailwind / Vite integration | 4.3.3 / 4.3.3 | Integration declares Vite 8 compatibility |
| shadcn CLI | 4.21.4 | Generate primitives only into the user-required components/ui/ tree; review generated dependencies and naming |
| React Router | 8.4.0 | Declarative client routing in main.tsx; declared Node >=22.22.0 and React >=19.2.7 are satisfied by this plan |
| TanStack Query / Axios | 5.104.2 / 1.20.0 | Query hooks call services; HTTP transport stays in services/ |
| Monaco / React wrapper | 0.57.0 / 4.7.0 | Wrapper accepts Monaco >=0.25 and <1, and React 19; no claim of full Java IDE semantic analysis |
| ESLint / typescript-eslint | 10.12.0 / 8.71.1 | Updated during initialization because ESLint 9.39.5 was deprecated; installed peers and checks pass |
| Laravel / Sanctum | 13.35.0 / 4.3.3 | Framework requires PHP ^8.3; Sanctum explicitly accepts Illuminate 13 |
| PHP / Composer | PHP 8.4, Composer 2, patched releases | Linux application container; do not upgrade shared host PHP 8.2 or alter other projects |
| MySQL / Redis | MySQL 8.4 LTS / Redis 8.2, patched releases | Private project-specific services; no public database/queue ports |
| Java | Temurin 21 LTS, patched JDK/JVM image | Explicit user choice for demo; compiler/runtime pinned together; no preview features |
| Runner | Patched Linux VM + Docker Engine + gVisor/runsc | Pin verified images/runtime artifacts before execution; exact digests are setup outputs, not fabricated planning values |

Metadata was inspected read-only using npm view and the [Laravel framework](https://repo.packagist.org/p2/laravel/framework.json) / [Sanctum](https://repo.packagist.org/p2/laravel/sanctum.json) publisher feeds. Consult [typescript-eslint dependency guidance](https://typescript-eslint.io/users/dependency-versions/) when resolving the lint toolchain. Runtime release choices reference [Node's LTS guidance](https://nodejs.org/en/about/previous-releases), [Temurin support](https://adoptium.net/support/), [MySQL 8.4 LTS](https://dev.mysql.com/doc/refman/8.4/en/faqs-general.html) and [Redis supported versions](https://github.com/redis/redis/security). These checks do not replace Phase 2 type/build tests or Phase 5 Java/runner containment tests.

## Java execution contract

Java-only assessment and the single-file format are confirmed: Temurin Java 21 for the demo, one UTF-8 source file named Main.java, a Main entry class using the conventional public static void main(String[] args) entry point, stdin/stdout, no package declaration, and only the selected JDK standard library. The college lab version is unknown and will be checked before real classroom use; it does not block the chosen demo runtime. No preview language features, Maven/Gradle builds, uploaded JARs, external libraries, GUI or network exercises are in the MVP.

Compilation is part of untrusted execution: javac produces class files consumed by the JVM, as described by the [official Java compiler documentation](https://docs.oracle.com/en/java/javase/25/docs/api/jdk.compiler/module-summary.html). Compile once per execution generation in a restricted build sandbox with bounded time, memory, output and artifact size. Use fixed server-owned compiler options with annotation processing disabled. Compiler and execution runtimes must be compatible and pinned together. Never compile student source on the API/worker host.

After successful compilation, the trusted supervisor transfers only bounded regular class files from that job's build directory into fresh per-test sandboxes. Reject symlinks, path traversal and unexpected artifact types; never execute or deserialize artifacts on the host. Each test starts a new JVM with only those artifacts and the current stdin; expected outputs stay outside. Build artifacts are ephemeral and removed after the evaluation. The service must support this boundary or the adapter must be redesigned and reviewed before selection.

Source-caused compilation errors or enforced build-limit violations finish as compile_error with zero assessed points and safe bounded compiler diagnostics; infrastructure faults become system_error without a score. Compiler diagnostics cannot contain hidden tests because no tests are mounted at compilation. Public/custom Runs use the same bounded build process without spending assessed attempts.

## Deployment and trust boundaries

The confirmed first delivery is a local demonstration with synthetic data. Run the trusted frontend tooling with the project-selected Node version, and the API/queue/scheduler, MySQL, Redis and mail catcher in project-specific Linux application containers. This avoids changing shared host PHP or other projects. Execute Java only in a separate dedicated Linux runner VM, using Docker with gVisor/runsc, fixed runtime manifests and restricted networking. Do not execute submitted Java directly on Windows, in WSL's application environment or in the Laravel/worker container. Do not expose the demonstration publicly or accept real student records. WSL2/container availability alone is not proof of isolation.

Read-only host inspection on 2026-10-12 found Windows 11 Pro, approximately 15.8 GiB total RAM, 16 logical processors and firmware virtualization enabled; WSL2/docker-desktop is present. Node 26.4.0 and PHP 8.2.12 are installed. This establishes a plausible local starting point, not proof of an available VM backend or functioning isolation. Start the runner VM budget at 2 vCPU/4 GiB RAM and one active evaluation; reserve sufficient memory for Windows and trusted app services. Benchmark actual resource usage before increasing concurrency. If the machine cannot support this safely, keep real execution disabled and revisit the environment plan rather than weakening containment.

The selected sandbox requires Linux; [gVisor installation guidance](https://gvisor.dev/docs/user_guide/install/) specifies Linux 5.6+ on supported architectures. Use a patched Linux LTS guest and the [systrap platform](https://gvisor.dev/docs/user_guide/platforms/) so the plan does not rely on nested KVM acceleration. Actual VM/runtime installation and destructive workload tests belong to implementation, not Phase 1.

The trusted runner supervisor provides fixed create/status/cancel operations over a private authenticated endpoint. It validates resource limits, compiler/runtime identities and source sizes, then uses the container runtime API; it accepts no user-chosen host command, image, mount, path or runtime flag. Supervisor privileges stay inside the runner VM. Guests have no Docker socket, network interface, host shares or inherited secrets. Bind the control interface to the application-reachable private interface with an allowlist; the execution sandbox cannot reach that interface or the application network. Use bounded job TTLs and cleanup independent of worker survival. No public callback is needed.

A separate physical/cloud runner host, public TLS setup, provider, budget and real-data policies belong to the later approved deployment plan. The local HTTP loopback exception is development-only; production requires HTTPS, Secure cookies and verified origin configuration. Route /api, /auth and /sanctum through the local frontend proxy, rather than disabling CSRF to make development work.

The browser connects by HTTPS to a reverse proxy. The proxy serves React build assets and routes API/authentication requests to Laravel, preserving a same-origin browser model. Development uses Vite with a matching proxy strategy after setup. If subdomains are chosen, verify Sanctum stateful domains, cookie scope and exact CORS origin rules.

Laravel and its trusted workers connect to MySQL and Redis on a private application network. Only workers contact the authenticated private runner control endpoint. The runner's sandbox network cannot reach the application network, internet, cloud metadata, Redis or MySQL. The browser never receives runner credentials or contacts it. Runner hosts do not receive production database credentials. Secrets for supervision stay outside guests.

For a later real pilot, use one application deployment, database and Redis instance with independent worker processes and one separate runner host. Backups and monitoring are required. Kubernetes, service mesh, event sourcing, multi-region replication and a separate analytics warehouse are unnecessary for this scope. Local demo measurements must not be presented as proof of pilot capacity.

## Assessed execution lifecycle

1. Browser sends activity, approved language and immutable source with idempotency key.
2. Laravel scopes the classroom and resource; atomically checks membership, assigned allocation, state, deadline, limits and source bounds. It saves a queued submission and its provenance in MySQL.
3. After commit, dispatch a job containing only the submission ID. Return 202 without waiting for execution. If Redis dispatch fails after commit, keep the accepted record and let reconciliation enqueue it; do not tell the client to create a replacement attempt.
4. Worker atomically claims queued work or recovers an expired lease, advances execution_generation and records a bounded lease. Duplicate deliveries cannot claim active or terminal work.
5. Worker loads the locked assessed suite (or a Run's admission-time public-test snapshot) and pinned runtime, then sends source plus current test input and caps to the runner over private authenticated transport. Runner requests use a deterministic identity derived from resource ID and generation so a transport retry cannot create uncontrolled duplicate jobs.
6. Compile Java in the isolated build sandbox, then execute each test in a fresh sandbox/JVM as described above. The trusted worker compares bounded stdout with expected output using the frozen judge rule, outside the guest. Run uses only public/custom input and never hidden cases.
7. On coherent completion, the current generation transactionally stores test results, terminal outcome and score. A stale generation cannot commit. On exhausted infrastructure recovery, commit system_error and null score, releasing the attempt slot by the count rule.
8. Frontend polling reads Laravel's role-safe resources. Instructor sees private diagnostic detail; student sees safe public detail and overall score. Derived best scores and period totals use committed graded records only.

## Delivery, failure and retry model

Queues deliver at least once; academic effects must be idempotent. Dispatch-after-commit prevents workers reading rolled-back records, but does not alone close a crash between commit and queue publish. Durable queued rows and a periodic reconciliation scan close that gap. See [Laravel queue transaction and timeout behavior](https://laravel.com/docs/13.x/queues).

Provisional timeout ordering: whole runner evaluation ≤150s; worker processing timeout 180s; claim lease 210s; Redis retry_after 240s. Validate actual startup/network overhead and Laravel driver semantics before implementation. Per-request runner network timeouts remain bounded within the worker budget. Never let a guest choose these values. Polling status calls must not indefinitely extend a worker or guest lifetime.

Retry infrastructure/transport failures at most twice after the initial execution, with bounded backoff and the same assessed record/attempt number. Keep the submission running during this recovery; use a new generation for a recovered execution and invalidate old results. Do not retry student compile/wrong-answer/runtime/limit failures as infrastructure faults. If recovery is exhausted, system_error is terminal in MVP; a student may make a new admitted submission while the activity remains open.

If a worker dies after a runner job starts, a service-side TTL kills the entire workload independently of the worker. The supervisor must enforce cleanup on restart. Reconciliation handles expired claims; generation checks handle late replies. Work accepted before archival or membership removal can finish, but new access remains governed by current policies.

Known unavailability/saturation blocks admission before attempt allocation where possible. A failure immediately after admission remains an accepted queued job, visible to the user. No successful admission may disappear due only to Redis loss. Proposed queue scan frequency is 30 seconds; verify the 60-second recovery target under healthy dependencies.

## Grading and hidden-test boundary

The trusted worker, not student code, calculates score. Lock tests at the first accepted assessed submission, store test references and submission provenance, and compare deterministically. Before that lock, permitted test edits update the assessment digest; Runs use captured public-test snapshots. Expected outputs are never mounted in guests. Any output produced while receiving hidden input is private, including error text, process filenames and timing. A student-facing submission response maps hidden failures to a generic tests_failed outcome.

Separate Run and assessed queues with grading preference so repeated practice cannot starve deadlines. Admission quotas protect students, classrooms and the host. Java is the confirmed initial language; the chosen runtime image digest and comparison behavior must be proven on known-answer fixtures before use.

## Testing seams and operations

Use a fake execution adapter for UI/API contract tests before the real runner is enabled. This is not evidence of sandbox security. Phase 5 separately tests real malicious/limit workloads on the isolated environment. Phase 7 rehearses the full instructor-create → student-join → submit → feedback → export flow, queue recovery and restoration.

Track queue age, pending count, sandbox failures, system_error rate and completed execution durations with correlation IDs. Keep academic source and hidden tests out of general observability tools. Independently update/pin runtime images; never silently change the referenced runtime of published assessments. Security incidents may require disabling a runtime rather than mutating historical provenance.

Implementation commands and local runtime decisions are recorded in [local development](local-development.md).
