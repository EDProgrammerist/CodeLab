# Local development — Phase 4

> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

The application runs locally with synthetic data only. Authentication, classrooms, enrollment, schedules and authoring use MySQL records. Execution and reports remain later phases. Additive Phase 3 and 4 migrations are applied on this installation. See [authentication implementation](authentication-implementation.md) for provisioning, mail flows and security verification.

## Runtime and layout

- Frontend: Node 24.21.0, React 19.3, TypeScript 6.0.3, Vite 8.3.4, Tailwind 4.3.3. Exact resolutions are in package-lock.json.
- API: Laravel 13.35.0 and Sanctum 4.3.3, PHP 8.4.26 in Docker. composer.lock records exact resolutions. Sanctum cookie authentication is implemented.
- MySQL 8.4, Redis 8.2, Mailpit; PHP worker and scheduler are separate processes on the trusted application network.
- Docker image digests are pinned in infra/app. backend/vendor lives in a Docker named volume to avoid Windows bind-mount extraction problems. Run PHP/Composer in the container, not with the host PHP 8.2.
- The frontend helper downloads the pinned Node through npm and temporarily prepends its directory to PATH, leaving host Node 26 unchanged. First use requires internet access.
- The supplied frontend architecture is preserved in frontend/PROJECT_STRUCTURE.md. DESIGN.md is the visual authority. Design primitives and responsive prototype review are complete; see phase-6-7-acceptance.md.

## First setup on another machine

Install Docker Desktop with Linux containers and a working npm command. Start Docker Desktop. Run these commands from the project root.

1. Copy `.env.example` to `.env` only if the local file does not already exist. Replace both database password placeholders with different randomly generated passwords. Hexadecimal strings avoid environment-file quoting issues. Keep `.env` private.
2. Copy `backend/.env.example` to `backend/.env` only if absent. Set its DB_PASSWORD to exactly the root .env DB_PASSWORD. Root .env supplies Compose interpolation; backend/.env supplies Laravel configuration. Do not regenerate database credentials after initializing the MySQL volume without a deliberate password rotation.
3. Build and install:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml build app
docker compose --env-file .env -f infra/app/compose.yaml run --rm --no-deps app composer install --no-interaction
docker compose --env-file .env -f infra/app/compose.yaml run --rm --no-deps app php artisan key:generate --no-interaction
.\infra\app\frontend.ps1 ci
```

Generate the application key only on first setup. Do not overwrite an existing key. After starting the containers, apply migrations with `docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan migrate --no-interaction`. Do not reset an existing database.

## Start and stop

```powershell
docker compose --env-file .env -f infra/app/compose.yaml up -d
.\infra\app\frontend.ps1 dev
```

The frontend command stays in the terminal; use another terminal for checks. Ctrl+C stops Vite. `docker compose --env-file .env -f infra/app/compose.yaml stop` stops only CodeLab containers and preserves data.

| Service | Address |
| --- | --- |
| Frontend | http://127.0.0.1:5173 |
| API liveness JSON | http://127.0.0.1:8010/api/v1/health |
| Laravel health | http://127.0.0.1:8010/up |
| Mailpit local inbox | http://127.0.0.1:8025 |

Port 8010 avoids an existing service on 8000. MySQL and Redis have no host port bindings. Use 127.0.0.1 consistently. Vite proxies /api, /auth, /sanctum and /up to the API, establishing the same browser origin for Sanctum cookie authentication. The health route is a liveness check, not proof of database/queue readiness.

Use SESSION_DRIVER=database and APP_DEBUG=false in backend/.env; these are already set on this installation and in the example. Database sessions, stateful Sanctum, CSRF and account flows are tested. Redis handles cache/queues; queue tables exist, but the idle worker/scheduler do not imply assessment jobs exist.

`frontend/.env.example` documents the optional API_PROXY_TARGET override. It defaults to 8010 in vite.config.ts. Vite preview is only a build preview; use the dev server for the local API proxy.

## Checks

```powershell
.\infra\app\frontend.ps1 check
docker compose --env-file .env -f infra/app/compose.yaml exec -T app composer validate --strict
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan test --compact
docker compose --env-file .env -f infra/app/compose.yaml exec -T app vendor/bin/pint --test
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan db:show --database=mysql --no-interaction
docker compose --env-file .env -f infra/app/compose.yaml exec -T redis redis-cli ping
docker compose --env-file .env -f infra/app/compose.yaml ps
```

Historical Phase 2.1 baseline evidence on 2026-10-13 (before migrations/authentication): frontend lint/type/build passed; two backend tests passed (three assertions), including the JSON health contract; Composer validation passed; PHP formatting checked; API health passed through the Vite proxy; MySQL connected with zero tables; Redis returned PONG; six service containers were running. Dependency audits reported no advisories at installation time. CI is defined in `.github/workflows/checks.yml`; it has not run on a remote GitHub repository. Phase 2.3 subsequently completed Chromium screenshot, keyboard and automated accessibility checks; see phase-6-7-acceptance.md.

## Initialization decisions and boundaries

ESLint 10.12 replaces the deprecated 9.39.5 planning baseline, with compatible typescript-eslint 8.71.1 and plugins. Monaco's DOMPurify dependency is overridden to 3.4.17 to address the reported advisories; recheck the override when upgrading Monaco. Laravel Boost is a development-only dependency installed per the generated Laravel scaffold guidance; no MCP connection was configured. The lockfiles are the installation baseline.

Environment files, dependency trees and build outputs are ignored by Git. Environment examples contain placeholders only. Do not expose the development API, Mailpit, Docker socket or databases publicly. Student code must never run in this application stack. The dedicated runner and its containment verification remain Phase 5 work.

## Phase 4 workflow and verification

On earlier installations, start the stack and apply the additive schema: `docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan migrate --no-interaction`. Do not reset the working database.

1. Provision and verify an instructor using [the account guide](authentication-implementation.md).
2. Open **Classrooms**, create a course/section/term and optionally add weekly OC/LAB slots. Times use classroom timezone. Each slot finishes on the same day and cannot overlap another slot in that classroom. Up to 14 slots are supported.
3. Open **Manage classroom** and generate an invitation. The UI defaults expiry to seven days ahead; choose a future time no later than term end. Copy the code now: plaintext is shown only once. Rotation immediately invalidates the old code; revocation disables joining.
4. Create an activity or assignment, select grading period and OC/LAB, set points/deadline/attempts and save a draft. Add at least one public and one hidden test before publishing. Reload to check persistence. Published instructions/categories/points/runtime are fixed; tests stay editable until the first assessed admission. Deadlines and attempt limits can only increase.
5. Register/verify a synthetic student in another browser profile, join by code and open the assignment/public examples. Remove/reactivate enrollment from the instructor roster. Removal blocks access; reactivation preserves history. Earlier closed work is not assigned and remains excluded after deadline extensions.

Device-local date/time inputs are labeled and converted to UTC; read views display classroom time. Real assignments disable Run/Submit until the isolated runner is verified. Progress and gradebook now use stored records; only the standalone legacy editor remains a labeled simulation.

The default browser suite uses isolated API fixtures. The live suite uses Laravel, MySQL and Mailpit and retains uniquely named synthetic accounts/classrooms. From frontend/:

```powershell
$env:CODELAB_LIVE_CLASSROOMS = '1'
npx playwright test classroom-live.spec.ts
Remove-Item Env:CODELAB_LIVE_CLASSROOMS
```

Responsive checks cover 360, 768 and 1366px. The real student journey uses a 390px touch/mobile Chromium context and axe accessibility checks. The owner explicitly accepted emulation for this phase. No physical phone or iOS Safari test is claimed.

Two opt-in InnoDB tests use the separate database `codelab_phase4_test`. On this installation it already exists, and the application DB user has permission on it. On another installation, a trusted MySQL operator must create that test database and grant the local codelab user access to it first. The test hardcodes this separate name, applies migrations additively and leaves synthetic fixtures; it does not reset the working database. Run from the project root:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml exec -T -e CODELAB_TEST_MYSQL=1 app php artisan test --compact --filter=ClassroomConcurrencyTest
```

These tests prove that a competing join waits for publication and that a waiting test edit rechecks a committed suite lock. The lock transition simulates assessed admission; integration with actual submission records is a Phase 5 check. Default CI skips the two tests unless their separate MySQL environment is enabled.

Completion evidence, 2026-10-14: 32 default backend tests (269 assertions), two MySQL contention tests (12 assertions), six default browser tests and the live classroom journey passed. Frontend lint/type/build and PHP formatting passed. Default browser runs skip three opt-in live tests. Monaco's existing lazy chunk-size warning remains. No remote CI run or production acceptance is claimed.


## Phase 5 application features; runner deferred (2026-10-14)

The user explicitly deferred VM installation. Keep `EXECUTION_ENABLED=false` and `RUNNER_CONTAINMENT_VERIFIED=false`. No simulated runner is enabled in the working application, and no synthetic grades are inserted by the UI. This historical runner-dependent workflow is superseded: Run Java is deferred, while code submissions are accepted immediately for instructor review without execution.

- Students open a real classroom activity to use the locally bundled Monaco editor or accessible plain-text editor. Drafts stay in memory on that page; copy code before navigating away or reloading. Run and Submit are disabled with an explanation while execution is deferred. Existing assessed submissions, source, public diagnostics and instructor feedback are readable subject to current enrollment.
- Instructors open an existing activity and use **Student submissions and feedback**, select an attempt and save comments/explanations. Feedback never changes the score. On a new installation with no assessed records this section is honestly empty.
- **My progress** and **Gradebook** now query the API. Select a classroom and filter grading period, OC/LAB and activity/assignment. Instructor roster results are paginated; CSV/Excel exports include all matching rows. Exports and the UI share highest-score calculations, fixed allocations and raw denominators. No official weighted course grade is calculated.
- CSV fields are formula-neutralized; Excel uses literal inline-string cells, including numeric display values. Source, tests and feedback are excluded from exports. Downloaded reports are fresh database snapshots and may differ from a previously loaded page if records change.
- Historical infrastructure failures remain flagged. Provisional totals clear once the latest evaluation is resolved and assigned activities close; archival closes activity availability even with a future deadline. A graded zero remains completed.

The legacy `/student/activities/sum` editor remains an explicitly labeled, isolated layout simulation. Real classrooms link to `/student/classrooms/{classroom}/activities/{activity}`. Simulation controls do not appear in real assignments.

Tests use Laravel's isolated SQLite database and simulated runner outputs, plus browser API fixtures. The opt-in classroom browser journey uses real local MySQL/Mailpit and verifies editor availability, empty history, period totals and CSV/Excel downloads without running Java. It retains synthetic accounts as before. These tests do not prove sandbox containment, concurrent final-attempt admission on MySQL, or actual Java grading.

Run `.\infra\app\frontend.ps1 check` and `.\infra\app\frontend.ps1 test:ui`; enable `CODELAB_LIVE_CLASSROOMS=1` to include the live classroom/report journey. Backend: `docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan test --compact`. The two opt-in MySQL contention tests and two live authentication browser journeys remain separately gated.


Continuation verification, 2026-10-14: **42 backend tests / 374 assertions**, **9 default browser tests**, and the separately enabled live classroom/editor/report/export journey passed. The default backend run skips two opt-in MySQL tests; the default browser run skips three live tests. Lint, TypeScript, production build and PHP formatting pass. The existing lazy Monaco chunk-size warning remains. Screenshot review and axe checks cover mobile reports and the real activity workspace; physical-device, actual screen-reader, real-runner and production acceptance are not claimed.

## Phase 6 public-site checks

The root is now the public landing page; use `/login` for authentication. About, Contact, Privacy and Terms are public. Policies remain school-review drafts. The default UI suite now includes three public-page viewport/accessibility checks (12 default tests total); live authentication/classroom journeys remain separately gated.

See [public-site review](public-pages-and-deployment.md). The unfinished production package and its HTTPS rehearsal test have been removed; deployment is deferred.

## Scope revision verification - 14 October 2026

The manual-review workflow is implemented: code submissions are saved immediately without a runner, instructor feedback persists, and progress uses received submissions without grades. CSV/XLSX generation and its route are removed. Old grading jobs are inert and no new evaluation jobs are dispatched. Existing records and legacy schema fields are retained; there was no destructive migration.

Validation: 41 backend tests / 346 assertions passed (two opt-in MySQL concurrency tests skipped), 12 default browser checks passed, and a separately run live MySQL/Mailpit/mobile-emulation journey passed through student submission, instructor feedback, student reload and completion tracking. Frontend lint/type/build and PHP formatting passed. A live-session regression caused by no-referrer was fixed using an origin-only referrer policy; same-origin Sanctum authentication then passed. No production rehearsal was resumed and no Java code was executed. The existing lazy Monaco bundle warning remains.

Branding now uses Asticassia School of Technology with no Facebook page. New location/jurisdiction is unconfirmed; legal text remains conditional and draft. The owner resumed Phases 6 and 7 on 15 October 2026; see development-roadmap.md for current status.

## Current infrastructure scope - 14 October 2026

Use only the local startup commands above. Production deployment files and runner VM setup have been removed; Vercel frontend configuration is now prepared; actual deployment and backend hosting remain deferred. The local Docker stack still uses Linux containers internally. No separate Linux/Debian VM is required, and no existing database volumes or system installations were removed. Historical grading/export workflows above are superseded by the scope revision.

## Phase 6/7 continuation - 15 October 2026

Frontend-only Vercel configuration is now prepared; see vercel-frontend.md. The local app container now starts four PHP development workers with --no-reload to avoid serializing concurrent browser requests. PHP source changes still apply per request; after changing backend environment variables, restart the app container. This is development infrastructure, not a production server.

The opt-in MySQL concurrency suite now has four tests, including actual final-attempt and idempotent-retry contention. The opt-in frontend hardening test uses CODELAB_LIVE_HARDENING=1 and runs hardening-live.spec.ts. It creates ten synthetic students, measures five independent sessions, restarts only the app container and checks that sessions survive. Run it against the local demo only, not during someone else's work. Synthetic fixtures remain available for inspection; no working records are reset. See phase-6-7-acceptance.md for current results and remaining gates.
