# Phase 3 — Authentication and authorization

## Running the local system

Use synthetic identities only. Start Docker and the frontend with the commands in [local development](local-development.md), then open http://127.0.0.1:5173. Register a student through **Register as a student**. Verification and password-reset mail stays in [local Mailpit](http://127.0.0.1:8025); no external mail provider is configured.

On an existing Phase 2 installation, use `SESSION_DRIVER=database` and `APP_DEBUG=false` in backend/.env. Then apply the additive migrations:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan config:clear
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan migrate --no-interaction
```

Do not run migrate:fresh against the working database. The migration adds role, optional unique student number and disabled_at to users, plus classrooms and classroom_memberships for authorization. Standard sessions, password-reset, cache and queue tables now exist. Laravel's `users.password` contains the hash described conceptually as password_hash in the planning ERD.

## Controlled instructor provisioning

An operator with trusted access to the application container provisions an account:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan codelab:provision-instructor instructor@example.test --name="Demo Instructor"
```

The command rejects existing emails. It creates an instructor with an unknown random password and sends a private, one-hour password-setup link. No shared password is displayed or committed. The instructor opens the local inbox link, chooses a password, signs in, then requests and opens the email-verification link. The command does not grant verified status. If mail delivery fails after creation, use Forgot password to request another setup link; do not create another account.

Public registration always creates students; privileged fields are rejected and only approved identity fields are assigned. There is no HTTP instructor-provisioning endpoint and no administrator role. Restrict Docker/host shell access to operators. Before any production use, replace local Mailpit with the approved provider and operational access/audit process.

## Authentication contract

- POST /auth/register and /auth/login establish database-backed sessions and regenerate the session ID. Email is trimmed/lowercased. New passwords require 12 characters and a maximum of 72 bytes (bcrypt input bound), plus confirmation.
- React obtains /sanctum/csrf-cookie before each authentication mutation and Axios sends X-XSRF-TOKEN. The same-origin Vite proxy is retained. No bearer tokens or account data are persisted to browser storage; bearer authentication is explicitly disabled.
- CodeLab requires CSRF tokens even when Laravel 13 receives same-origin metadata. Neither web nor stateful API routes exempt auth mutations from CSRF. Read-only requests remain exempt.
- Database sessions use HttpOnly cookies, SameSite=Lax and a 120-minute idle lifetime. Local loopback HTTP uses non-Secure cookies; a real HTTPS deployment must set SESSION_SECURE_COOKIE=true and configure exact trusted SPA origins. This local exception does not authorize public hosting.
- GET /api/v1/me exposes only id, name, email, role, student_number and email_verified_at for the signed-in account. API errors are JSON even without an Accept header, with safe messages, error codes, field errors and request IDs. Private responses are no-store.
- React routes check session, verification and role before rendering. Successful login redirects to the server-provided role's /student/dashboard or /instructor/dashboard. Dashboard endpoints independently enforce verified email and role gates. Initial loading and connectivity failures are distinct from being signed out.
- Email verification links are signed for one hour and bound to the authenticated account and email hash. Open links while signed in with the same account; otherwise sign in, then reopen the link or request a new one. Resend is authenticated and throttled.
- Password recovery returns a neutral response for eligible and missing accounts. Hashed, expiring reset tokens are single-use. Reset replaces the password and remember token, removes every database session for that user and signs out the requesting session. Password hashes recorded in sessions and Sanctum's session middleware also reject stale sessions.
- Logout is a CSRF-protected POST, invalidates the server session, rotates CSRF state, clears React Query's cache and replaces the page with sign-in. It is safe to call again when already signed out. Disabled accounts cannot log in and existing sessions are rejected on subsequent protected requests.
- The frontend sends only an origin referrer (`strict-origin`), allowing Sanctum SPA detection without leaking reset tokens through URL referrers. Verification/reset URLs are secrets: do not copy them into tickets or shared logs.

## Initial throttles

| Operation | Limit |
| --- | --- |
| Login | 5/minute per normalized email + IP; 30/minute per IP |
| Registration | 5/minute per IP |
| Forgot/reset password | Shared 5/minute per IP; 3/minute per normalized email |
| Verification/resend | Shared 3/minute per authenticated account |

Password-reset mail also uses Laravel's 60-second per-account resend throttle. Rate-limited requests return 429 and Retry-After. These are local-demo defaults; campus NAT tuning belongs to the deployment plan. Do not disable limits to rerun tests; wait for the window when rerunning live tests rapidly.

## Classroom authorization foundation

GET /api/v1/classrooms/{classroom} invokes ClassroomPolicy and returns only safe classroom metadata. A verified owner or active student member can view; strangers, another instructor and removed students receive 404. Updates are owner-only for active classrooms at the policy layer. Foreign keys and the unique classroom/student pair establish the membership foundation. Phase 4 now adds classroom creation, enrollment, schedules and nested activity authoring. See local-development.md for the current workflow. The Phase 3 results below remain historical authentication evidence.

Classroom, assignment, submission-history, feedback, progress and gradebook screens now use API records. The separate legacy editor prototype remains explicitly fictional. Real Java execution and new automated grading remain disabled while the user-deferred runner setup is unfinished.

## Verification and repeatable checks

```powershell
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan test --compact
.\infra\app\frontend.ps1 check
.\infra\app\frontend.ps1 test:ui
```

The backend tests use isolated in-memory SQLite, not the working MySQL records. The default frontend suite uses API fixtures for identity and classroom screens; the real integration tests are intentionally opt-in because they require MySQL and Mailpit and create synthetic accounts.

With the local stack running, from frontend/:

```powershell
$env:CODELAB_LIVE_AUTH = '1'
npx playwright test auth-live.spec.ts
Remove-Item Env:CODELAB_LIVE_AUTH
```

Live tests exercise real browser cookies and mail links through React, Laravel, MySQL and Mailpit. They create uniquely named student-/instructor- accounts under example.test and retain them for inspection. Do not mix real records into this local-demo database or reset it merely to rerun tests. Browser traces/results are ignored by Git.

Security coverage includes privileged registration fields, duplicate identity, weak passwords, session rotation, disabled users, guest/wrong-role access, signed-link tampering/expiry/wrong identity, neutral recovery, invalid/expired/reused reset tokens, session revocation, CSRF rejection, throttling, provisioning, and classroom owner/member/removed/stranger access. The live browser tests replay old cookies after reset/logout and test role redirects plus API denials.

Reference implementation guidance: [Sanctum](https://laravel.com/docs/13.x/sanctum), [email verification](https://laravel.com/docs/13.x/verification), [password recovery](https://laravel.com/docs/13.x/passwords). CI executes backend tests and the isolated frontend suite; no remote CI run or production security assessment is claimed.

## Phase completion evidence - 2026-10-13

Phase 3 is complete: 20 backend tests passed with 109 assertions; both real-browser account journeys passed against the local MySQL/Mailpit stack; six prototype regression tests passed (the two opt-in live tests are skipped by default). Frontend lint, application/test type checks and production build passed. PHP formatting passed. Existing Monaco chunk-size warnings remain a later performance concern. The application has not been deployed and remote CI has not been run. At that milestone Phase 4 was next; its completed workflows and current checks are recorded in local-development.md.
