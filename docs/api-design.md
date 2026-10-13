# REST API Design

Status: proposed resources, not implemented endpoints. Base path `/api/v1` for application resources. Browser authentication endpoints use `/auth` and Sanctum's conventional CSRF path through the same origin. [Permissions](user-roles-permissions.md) apply to every route, including list/poll/export routes.

## Common contract

JSON over HTTPS; string IDs; UTC ISO-8601 timestamps with `Z`; scores as decimal strings such as `70.00`; documented enum values from the functional requirements. Use `data` for resources, `meta` and `links` for pagination. Errors carry `code`, `message`, optional field `errors` and `request_id`; never return stack traces, SQL or hidden test details.

Lists default to 25 items, maximum 100, with stable sorting and allowlisted filters. Own submissions sort newest first. Arbitrary field expansion, SQL-like filters and client-controlled ownership are not supported. Read responses containing private data use `Cache-Control: no-store`. Browser TanStack Query keeps authorized data in memory only and clears it on logout.

| Status | Meaning |
| --- | --- |
| 200 / 201 / 204 | Read/update or idempotent replay / creation / successful empty response |
| 202 | New Run or submission durably accepted; not proof of successful execution |
| 401 / 403 / 404 | Not authenticated / forbidden visible action / absent or inaccessible resource |
| 409 | Idempotency mismatch, deadline passed, limit exhausted, in-flight conflict or immutable resource conflict, with distinct machine codes |
| 419 | Expired/invalid CSRF session context; refresh CSRF state and require login when necessary |
| 422 / 413 | Field validation / payload exceeds configured size limit |
| 429 / 503 | Request quota exceeded / execution service unavailable or saturated; provide Retry-After when meaningful |

## Authentication resources (outside /api/v1)

| Method/path | Purpose |
| --- | --- |
| GET `/sanctum/csrf-cookie` | Initialize CSRF cookie before state-changing browser authentication requests |
| POST `/auth/register` | Register student only: name, email, password, password_confirmation, optional approved student_number |
| POST `/auth/login` | Establish cookie session with email/password |
| POST `/auth/logout` | Invalidate session and rotate CSRF context |
| POST `/auth/forgot-password` | Generic reset-link request response |
| POST `/auth/reset-password` | Reset through valid expiring token with password confirmation |
| POST `/auth/email/verification-notification` | Authenticated, throttled resend |
| GET `/auth/email/verify/{id}/{hash}` | Authenticated, signed expiring verification link; validate identity/signature |

Sanctum does not itself supply all registration/recovery endpoints; Laravel authentication services or a compatible headless package will implement these in Phase 3. No application code exists yet.

## Account, classroom and membership resources

All paths below are relative to `/api/v1`.

| Method/path | Authorized caller and contract |
| --- | --- |
| GET `/me` | Authenticated user; safe profile including role and verification status |
| PATCH `/me` | Own name only and approved editable profile fields; role/student identity changes excluded |
| PUT `/me/password` | Own account; current password plus confirmed new password; revoke other sessions |
| GET `/classrooms` | Owner's classrooms or student's active memberships, including archived classrooms |
| POST `/classrooms` | Instructor; title, course_code, section_label, academic year, semester, term_end_date, timezone; owner inferred |
| GET `/classrooms/{classroom}` | Owner or active member |
| PATCH `/classrooms/{classroom}` | Owner; allowed metadata or status=archived; term/timezone frozen after first publication; archival irreversible in MVP |
| GET `/classrooms/{classroom}/invitation` | Owner; expiry/revocation status only, never code plaintext |
| PUT `/classrooms/{classroom}/invitation` | Owner; expires_at; generate/rotate cryptographically random code, return plaintext once |
| DELETE `/classrooms/{classroom}/invitation` | Owner; revoke current invitation |
| POST `/classroom-joins` | Verified student; invitation_code only; return membership (201 new, 200 already active) |
| GET `/classrooms/{classroom}/memberships` | Owner; paginated roster; status filter |
| PATCH `/classrooms/{classroom}/memberships/{membership}` | Owner of active classroom; status=removed or active; no changed student/classroom IDs |
| GET `/languages` | Verified user; active approved runtime metadata only, no commands or private runner configuration |

## Activity authoring and discovery

| Method/path | Contract |
| --- | --- |
| GET `/classrooms/{classroom}/activities` | Authorized owner/member; period/session/type/status filters; student visibility scope enforced independently of filter |
| POST `/classrooms/{classroom}/activities` | Owner; create draft with fields in database design |
| GET `/classrooms/{classroom}/activities/{activity}` | Owner or active member; role-specific serializers |
| PATCH `/classrooms/{classroom}/activities/{activity}` | Owner; draft fields or published deadline/limit increases; status=published/archive triggers lifecycle validation |
| DELETE `/classrooms/{classroom}/activities/{activity}` | Owner; unreferenced draft only |
| GET `/classrooms/{classroom}/activities/{activity}/test-cases` | Owner only; public and hidden tests |
| POST `/classrooms/{classroom}/activities/{activity}/test-cases` | Owner of active classroom; draft or published activity with no accepted assessed submission; position, visibility, stdin, expected_stdout, explanation |
| PATCH/DELETE `/classrooms/{classroom}/activities/{activity}/test-cases/{test}` | Same editable-suite rule; nested ownership and continued publication validity checked atomically; 409 when suite locked |

Student activity detail embeds public examples and exposes categories, instructions, approved language, max points, deadline, limit, allocation_status (assigned/not_assigned), attempts_used, remaining_attempts, server_time and can_submit with a reason. Not-assigned work is read-only even after a later deadline extension. `can_submit` is guidance; admission rechecks it. Do not expose hidden test objects, IDs, count, expected outputs, private explanations or runtime details. The visible grading-policy description explains equal points per test. Allocation is server-owned; there is no manual allocation mutation endpoint in MVP. Owner detail also includes test_suite_locked_at and can_edit_tests; the server rechecks that permission on each edit.

## Runs, submissions and feedback

Use prefix `/classrooms/{classroom}/activities/{activity}` for each route below.

| Method/suffix | Contract |
| --- | --- |
| POST `/runs` | Enrolled student; source_code, language_id, mode=public/custom, custom_stdin for custom; Idempotency-Key header required |
| GET `/runs/{run}` | Author only and currently enrolled; state and safe public/custom results; 404 after expiration |
| POST `/submissions` | Enrolled student; source_code, language_id; Idempotency-Key header required |
| GET `/submissions` | Student: own only; owner: classroom activity submissions, optional membership/state filters |
| GET `/submissions/{submission}` | Author with active membership or owner; immutable source, state, safe outcomes, score and feedback |
| PUT `/submissions/{submission}/feedback` | Owner in active classroom; body; create/replace single feedback note, record audit |

New execution requests return 202 with ID, state, accepted/created timestamp and status URL (also Location header). A same-key same-body replay returns 200 with the existing resource state. Scope keys to membership and resource type, retain submission keys with academic records, and retain Run keys for its 24-hour lifetime. Body hash includes activity, language, source and Run mode/input; reused keys cannot refer to another activity unnoticed.

Submission student results contain overall outcome/score and public test results only. If a failure arose from a hidden test, the student overall outcome becomes generic `tests_failed`; detailed backend outcome remains owner-only. No hidden stdout/stderr, per-test verdict, timing, memory or count is returned. `system_error` responses use a safe service message. Result polling never contacts the runner directly.

## Results and exports

| Method/path | Contract |
| --- | --- |
| GET `/classrooms/{classroom}/results` | Required grading_period, optional class_session/activity_type; owner roster or student's own row; stable pagination for owner |
| GET `/classrooms/{classroom}/results/export` | Owner only; same filters, CSV download of all matching rows, no pagination; active and removed membership labels |

Result metadata includes generation time, timezone, filters, provisional flag and student-specific earned/possible points. Cells distinguish graded zero, pending, missed, system_error and not_assigned. Not-assigned cells are excluded from totals; zero possible points produces a null percentage. A new export is a fresh consistent snapshot; identical values with a prior screen are only expected if no intervening changes occurred. Include snapshot timestamp so the distinction is visible. Stream CSV for pilot size with a consistent read transaction; cap expensive exports and revisit background exports only if measured scale requires them.

## Internal runner boundary

Runner transport is private and is not a browser REST resource. A server-side adapter creates a bounded job, polls by opaque job ID and cancels expired jobs. Its contract includes execution generation, language image digest, source, test input, enforced caps and bounded output/status. Expected output and score calculation stay outside the untrusted process. Authentication and network policy restrict it to workers. No public callback endpoint is required for MVP; results cannot be posted by students.

## Required contract tests in implementation

Verify mismatched nested IDs, student-submitted privileged fields, unauthorized filters/exports, hidden-field absence in every response/error, idempotent retry before/after deadline, same key/different body, race for final attempt, stale sessions, membership removal during polling, student failure versus system failure, and CSV formula injection. These are future acceptance checks, not tests already run.
