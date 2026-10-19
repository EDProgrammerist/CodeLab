# REST API Design

> **17 October 2026 update:** The current [functional requirements](functional-requirements.md#october-17-workflow-revision) supersede older no-score/attempt/Summer rules below. Manual points are stored in `submission_feedback.points_awarded`; `max_points` is required for new activities. Feedback accepts nullable `points_awarded` bounded by the activity maximum. Submission lists use IDs, not attempt numbers; reports show latest-submission points. Student numbers are required for new registration. Only First/Second semesters are accepted. Historical database fields and records are preserved.
> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

## October 19 profile and authoring contract

The frontend uses one Publish action and Questions (stored in the existing `instructions` field). POST activity with `status=published` validates and publishes in one transaction, rolling back on failure. Existing drafts can still be published through PATCH. Profiles add nullable `section` and private `profile_photo_path` columns; UserResource exposes `section` and `photo_url`, never the storage path. Profile updates require CSRF for browser sessions and are limited to 30 per minute. Photos accept JPG/PNG/WebP up to 2 MB and 2048 by 2048 pixels; replacements remove the old file. Student number remains unique. Profile section is informational, not classroom membership.

## Current submission and progress contract

`POST /api/v1/classrooms/{classroom}/activities/{activity}/submissions` accepts `language_id` and `source_code` with UUID `Idempotency-Key`. Returns 201 for a new stored submission and 200 for a replay. No runner, queue or grading is involved. Score/state/results input is prohibited. Admission uses the existing classroom-first lock and deadline/limit rules.

GET submission lists/details expose ID, attempt number, accepted time, submitted/reviewed state, authorized source (detail only), and feedback; they omit scores, verdicts, test results and compiler output. `PUT .../submissions/{submission}/feedback` accepts text `body` only; score input is prohibited.

GET `/classrooms/{classroom}/results?grading_period=...` remains the compatibility URL for completion tracking. Rows contain activity state, attempts used, latest submission ID/time and closure; no earned/possible/percentage/score fields. Instructor rows are paginated and ownership scoped. `/results/export` has been removed and returns 404.

All `/runs` endpoints remain unavailable (503 for authorized requests). Activity resources omit `max_points` and `grading_policy`, report execution unavailable, and permit submission independently of execution. Authoring rejects `max_points`; examples are optional. Existing `/test-cases` paths remain compatibility paths for optional examples, with existing owner-only mutation and public-example filtering.

## Earlier design and implementation history

Status: authentication, /me, dashboards, classrooms, invitations, enrollment, languages and activity/test authoring are implemented through Phase 4. Profile edits, authenticated password changes, execution, submissions and reports below remain proposals. Base path `/api/v1` for application resources. Browser authentication endpoints use `/auth` and Sanctum's conventional CSRF path through the same origin. [Permissions](user-roles-permissions.md) apply to every route, including list/poll/export routes.

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

Sanctum does not itself supply registration/recovery endpoints. Phase 3 implements them using Laravel authentication services and password brokers. GET /api/v1/student/dashboard and /api/v1/instructor/dashboard return the safe current-account resource after independent verification/role checks; later dashboard aggregates remain future work.

## Account, classroom and membership resources

All paths below are relative to `/api/v1`.

| Method/path | Authorized caller and contract |
| --- | --- |
| GET `/me` | Authenticated user; safe profile including role and verification status |
| POST `/profile` | Verified active account; multipart name, optional photo; students also send required unique student_number and optional section. Updates only the signed-in user. |
| GET `/profile/photo` | Verified active account; streams own private photo, or 404. No public photo path. |
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
| POST `/classrooms/{classroom}/activities` | Owner; status=published creates and publishes atomically, including allocations; omitted status retains legacy draft API support |
| GET `/classrooms/{classroom}/activities/{activity}` | Owner or active member; role-specific serializers |
| PATCH `/classrooms/{classroom}/activities/{activity}` | Owner; draft fields or published deadline/limit increases; status=published/archive triggers lifecycle validation |
| DELETE `/classrooms/{classroom}/activities/{activity}` | Owner; unreferenced draft only |
| GET `/classrooms/{classroom}/activities/{activity}/test-cases` | Owner only; public and hidden tests |
| POST `/classrooms/{classroom}/activities/{activity}/test-cases` | Owner of active classroom; draft or published activity with no accepted assessed submission; position, visibility, stdin, expected_stdout, explanation |
| PATCH/DELETE `/classrooms/{classroom}/activities/{activity}/test-cases/{test}` | Same editable-suite rule; nested ownership and continued publication validity checked atomically; 409 when suite locked |

Student activity detail embeds public examples and exposes categories, instructions, approved language, max points, deadline, limit, allocation_status (assigned/not_assigned), attempts_used, remaining_attempts, server_time and can_submit with a reason. Not-assigned work is read-only even after a later deadline extension. `can_submit` is guidance; admission rechecks it. Do not expose hidden test objects, IDs, count, expected outputs, private explanations or runtime details. The visible grading-policy description explains equal points per test. Allocation is server-owned; there is no manual allocation mutation endpoint in MVP. Owner detail also includes test_suite_locked_at and can_edit_tests; the server rechecks that permission on each edit.

Phase 4 additions: classroom POST/PATCH accepts a schedules array (class_session, day_of_week, starts_at/ends_at as HH:mm) to replace the timetable atomically. Activity POST/PATCH accepts an optional full tests array without IDs to replace editable tests atomically; individual test routes also work. All mutations lock the classroom first. Deadline/invitation dates require an explicit offset or Z. Lists currently use fixed 25-item pages. Student activity responses report execution_available=false and can_submit=false with an unavailable reason; Phase 5 now derives attempt-use counts from stored submissions. No fabricated scores or attempts are returned.

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

Verify mismatched nested IDs, student-submitted privileged fields, unauthorized filters/exports, hidden-field absence in every response/error, idempotent retry before/after deadline, same key/different body, race for final attempt, stale sessions, membership removal during polling, student failure versus system failure, and CSV formula injection. Phase 4 tests nested IDs, authoring bounds, ownership, hidden fields, allocations, CSRF and publication/join locking. Execution/idempotency, grading and CSV checks remain in their owning phases.


## Phase 5 implemented application contract (runner deferred)

Under `/api/v1/classrooms/{classroom}/activities/{activity}`, `POST /runs` and `POST /submissions` accept `source_code`, `language_id` and an `Idempotency-Key` UUID header. Runs additionally require mode `public` or `custom` and optional `custom_stdin`. An accepted record returns 202; an identical replay returns 200, including after closure. A reused key with changed content returns 409. With execution disabled, new admissions return 503 without consuming attempts. This is currently the normal local configuration.

`GET /runs`, `GET /submissions`, and their `/{record}` detail routes provide authorized polling/history. Lists paginate at 25 records. Students see only their own records; instructors can review classroom assessed submissions but cannot read student practice runs. Expired practice details return 404. Student assessed results expose public-test details and aggregate score, never hidden test outputs/individual verdicts. A `system_error` has null score and releases attempt usage.

`PUT /submissions/{submission}/feedback` accepts a non-empty `body` up to 5,000 characters and requires classroom ownership. Editing preserves creation time and does not alter grading. `GET /classrooms/{classroom}/results` requires `grading_period`, with optional `class_session` and `activity_type`; instructor rows paginate at 25 using `page`. Students receive only their own row. The export route supports `format=csv` (default) or `format=xlsx`, includes the full matching roster regardless of page, and requires ownership. XLSX stores values as literal strings to avoid formula interpretation. Both exports omit assessment source/tests/feedback.

The frontend uses API permissions and remaining-attempt counts; Laravel remains authoritative. Tests cover mocked grading/admission and real database-backed report/feedback behavior. Runner-host provisioning and containment acceptance remain deferred.
