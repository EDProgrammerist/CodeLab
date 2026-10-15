# Phase 6 and 7 acceptance - 15 October 2026

## Scope and status

DESIGN.md alignment review and Phase 6 frontend-only preparation are complete. Phase 7 local checks below passed; final acceptance remains pending the manual checks below. The owner explicitly left backend hosting undecided. No site was published, no school policies were approved, and Java execution remains deferred. Existing application data was preserved.

## Verified this continuation

| Check | Result |
| --- | --- |
| Frontend lint, TypeScript and Vite build | Passed; Inter is bundled locally with its OFL notice |
| Laravel default suite | 41 passed, 346 assertions; optional MySQL checks run separately |
| MySQL contention | 4 passed, 28 assertions: join/publication, example locking, competing final attempts and identical retries |
| Default browser suite | 12 passed; responsive and axe checks at 360/768/1366px, keyboard/focus, editor, submission and feedback states |
| Live auth and classroom journeys | 3 passed against MySQL/Mailpit: registration, verification, reset, controlled instructor provisioning, role protection, classroom enrollment, code submission, feedback and completion |
| Installed browser smoke | Chrome 156.0.8078.36 and Edge 155.0.4283.45 rendered six public/login routes without overflow; not a full cross-browser workflow certification |
| Concurrent read load | 50 mixed identity/activity reads across five independent browser sessions: p95 373.8ms against a 500ms target |
| Concurrent submission admission | Five students submitted simultaneously; slowest 519.4ms against a 1s target; no scores or execution |
| API restart | All five sessions survived; each student's saved source remained readable after restart |
| Synthetic backup/restore | Restored codelab_phase4_test into a new, uniquely named recovery database; ordered data dump SHA256 matched across every table |
| Dependency advisories | npm audit during installation: zero vulnerabilities; composer audit: no security advisories at check time |
| Limited operational check | No known APP_KEY/database-password matches in the existing Laravel log; zero failed jobs. This is not a comprehensive personal-data log audit |
| Vercel config | JSON and route-pattern checks: six SPA examples included, five backend paths excluded. Vercel-hosted behavior is untested |

The load fixture creates ten synthetic students plus their fixture instructor and classroom. It uses five authenticated sessions, 50 read requests and five code admissions; this is a short local sample, not sustained pilot capacity. Synthetic fixtures are retained for inspection.

Hardware: Windows host, AMD Ryzen 7 7435HS, 16 logical processors, approximately 15.8 GiB physical RAM, Docker Linux PHP 8.4/MySQL 8.4/Redis, local Chromium. Docker resource allocation was not separately profiled. One PHP worker initially measured 591.4ms p95 for identity reads. Four development workers fixed that bottleneck; identity-only p95 was 208.5ms, and the final mixed read workload above measured 373.8ms. The app uses --no-reload; restart it after backend environment changes.

## Corrections found during verification

- The initial mobile baseline had a cold-start page-load timeout. Subsequent full responsive checks passed without weakening assertions.
- Fontsource's installed package exports its root CSS, not latin.css. The import was corrected before the passing build.
- The instructor-panel eyebrow failed contrast after adding the reference blue surface. It now uses dark ink and the complete accessibility suite passes.
- The reference is now docs/DESIGN.md throughout the updated planning links. The review explains where accessibility and workspace density override literal marketing examples.

## Remaining acceptance and release gates

- Actual screen-reader review: sign in/register labels and errors, route announcements, editor escape/plain-text alternative, submission confirmation and instructor feedback. Automated axe checks do not replace this.
- Firefox coverage and full supported-browser classroom journeys, beyond Chrome/Edge public-route smoke checks. The attempted Playwright Firefox download stalled at 0% and was stopped; no Firefox result is claimed.
- Review privacy in logs beyond exact known-secret matching; approve academic retention and fixture-cleanup ownership.
- Rehearse a release rollback after a versioned deployable release exists. The API restart check is recovery evidence, not a code rollback rehearsal.
- Vercel preview routing and headers, backend/MySQL/mail selection, live HTTPS Sanctum/CSRF, school identity/contact/jurisdiction and policy approval remain deferred deployment gates.

The lazy Monaco chunk remains approximately 2.7 MB before compression. It is separate from the landing bundle. No claim is made for physical phones, external email delivery, production capacity, WCAG certification or a secure Java runner.

## Re-run commands

From the repository root, start the existing stack and run frontend checks with infra/app/frontend.ps1. The default UI suite leaves live tests skipped. For the live auth/classroom journeys, set CODELAB_LIVE_AUTH=1 and CODELAB_LIVE_CLASSROOMS=1 in that process. For the load/restart test, set CODELAB_LIVE_HARDENING=1 and run hardening-live.spec.ts from frontend. Do not run the restart check while another person is using the local app.

Run the separate MySQL suite with `docker compose --env-file .env -f infra/app/compose.yaml exec -T -e CODELAB_TEST_MYSQL=1 app php artisan test --compact --filter=ClassroomConcurrencyTest`. It targets only codelab_phase4_test and applies additive migrations. Never replace this with migrate:fresh against the working database.

## Repeatable synthetic recovery rehearsal

The source database below contains only fixtures from the opt-in tests. This command creates a new destination each time and fails if that destination already exists. It does not overwrite or drop any working database. The backup stays inside the local MySQL container; synthetic recovery databases and temporary dumps remain for inspection. It is not an encrypted production backup procedure.

Run from PowerShell at the repository root:

```powershell
@'
set -eu
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
restore_db="codelab_phase7_restore_$(date +%s)"
mysql -u root -e "CREATE DATABASE $restore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysqldump -u root --single-transaction --no-tablespaces --skip-add-drop-table codelab_phase4_test > /tmp/codelab-phase7-backup.sql
mysql -u root "$restore_db" < /tmp/codelab-phase7-backup.sql
mysqldump -u root --no-tablespaces --skip-comments --compact --order-by-primary --skip-extended-insert --no-create-info codelab_phase4_test > /tmp/codelab-phase7-source-data.sql
mysqldump -u root --no-tablespaces --skip-comments --compact --order-by-primary --skip-extended-insert --no-create-info "$restore_db" > /tmp/codelab-phase7-restored-data.sql
source_hash=$(sha256sum /tmp/codelab-phase7-source-data.sql | cut -d ' ' -f 1)
restored_hash=$(sha256sum /tmp/codelab-phase7-restored-data.sql | cut -d ' ' -f 1)
test "$source_hash" = "$restored_hash"
printf 'Restored data verified in %s\n' "$restore_db"
'@ | docker compose --env-file .env -f infra/app/compose.yaml exec -T mysql sh
```

Stop writes to the isolated test database during the comparison. On restoration failure, inspect the uniquely named destination rather than retrying into an existing database. Before any real deployment, replace this fixture exercise with an approved encrypted backup, retention, access, recovery-time and rollback plan.

## Frontend design and cleanup — 16 October 2026

Visual authority: [DESIGN.md](DESIGN.md); frontend layers and imports: [PROJECT_STRUCTURE.md](../frontend/PROJECT_STRUCTURE.md). The reference is the Notion style at https://styles.refero.design/style/2bf4c61f-de10-4614-ba1b-20c0453bd2a9. The public canvas follows its white screenshot background; workspaces use warm paper. Use 12px cards, 8px buttons, blue actions, peach highlights and readable dark secondary blue. Marketing display sizes do not apply to dense workspace forms or tables. Keep visible focus and reduced-motion support.

The completed visual pass covers landing sections, About/Contact/legal pages, account forms, dashboards and shared classroom/progress styling. Illustration assets are generated, and product screenshots contain fictional records. This is a CodeLab adaptation, not a pixel-identical reproduction of Notion. The avatar strip height was corrected to prevent clipped circle outlines. No backend contracts or records changed in this pass.

Frontend verification on 16 October: lint, TypeScript and build passed; 15 default browser tests passed, with 4 opt-in live-backend tests skipped. Coverage includes public/account pages, dashboards and classroom/editor/report views at 360, 768 and 1366 pixels, with automated accessibility and overflow checks. The existing lazy Monaco chunk warning remains. This does not supersede the pending manual acceptance checks above.

Removed superseded Phase 2 prototype notes and the chronological design review; their current guidance is summarized here. Removed unused setup-preview components, sample grading data and frontend-only health-preview helpers. The backend health endpoint, active routes and browser tests remain available. Shared role types now live with the account types rather than obsolete prototype types.

## Post-cleanup testing — 16 October 2026

Fresh local verification after the frontend cleanup:

| Check | Result |
| --- | --- |
| Frontend lint, TypeScript, production build | Passed; existing lazy Monaco chunk warning only |
| Composer validation | Passed |
| PHP formatting | Passed across 66 files after correcting formatting in ClassroomWorkflowTest.php |
| Laravel default suite | 41 passed, 346 assertions; 4 optional MySQL tests skipped here and run separately below |
| Separate MySQL concurrency suite | 4 passed, 28 assertions against codelab_phase4_test |
| Browser suite with live auth and classroom tests enabled | 18 passed; hardening test run separately below |
| Live session/load/restart test | 1 passed: five isolated sessions, 50 reads, p95 260.9 ms; five simultaneous submissions, slowest 360.5 ms; sessions and saved source survived API restart |
| Local services | Existing migrations applied; Redis PONG; application, MySQL, Redis and Mailpit healthy |

Live journeys verified registration, Mailpit verification and password recovery, controlled instructor provisioning, role protection, classroom schedules/invitations/enrollment, Java code submission without execution, instructor feedback and completion tracking. Responsive/automated accessibility coverage ran at 360, 768 and 1366 pixels, with a separate mobile-emulated live student flow. Backend tests cover CSRF rejection, throttling, membership/ownership boundaries, deadlines, attempt limits and submission retry idempotency.

The tests created uniquely named synthetic accounts and classroom records; no working database was reset. The only corrective code change in this test pass was test-file formatting. Local services remain running for hands-on testing at http://127.0.0.1:5173/ and Mailpit at http://127.0.0.1:8025/. No deployment or commit was performed.

These results cover the current local application, not production readiness. Manual screen-reader testing, Firefox/full cross-browser workflows, actual hosting/HTTPS and school policy approval remain unverified. Java execution stays deferred. The earlier synthetic restore evidence was not rerun in this pass.
