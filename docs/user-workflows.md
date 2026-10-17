# User Workflows

> **17 October 2026 update:** The current [functional requirements](functional-requirements.md#october-17-workflow-revision) supersede older no-score/attempt/Summer rules below. Manual points are stored in `submission_feedback.points_awarded`; `max_points` is required for new activities. Feedback accepts nullable `points_awarded` bounded by the activity maximum. Submission lists use IDs, not attempt numbers; reports show latest-submission points. Student numbers are required for new registration. Only First/Second semesters are accepted. Historical database fields and records are preserved.
> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

## Current student-to-instructor workflow

1. Instructor provisions their account, creates a private classroom and publishes an activity with instructions, optional examples, deadline and submission limit.
2. Student registers/verifies email, joins with an invitation code, opens the activity and writes Java in Monaco or the plain editor.
3. Student selects Submit code. The API validates membership, assignment, deadline, limit and request key, then stores the source without running it. A retry reuses the request key and does not create another attempt.
4. Instructor opens Student submissions and feedback, selects the saved source, and adds comments/explanations. Any score is recorded in the instructor's external class record.
5. Student reloads the submission to see feedback. Both roles see completion counts by grading period. Completed means received code, not a passing grade. Run Java remains disabled.

## Earlier workflow design (grading and export flows retired)

Status: proposed journeys. Rules and states are authoritative in [functional requirements](functional-requirements.md).

## 1. Account access

Student registers name, email and password with an optional unique student number → receives verification email → verifies → signs in → sees joined classrooms or a join prompt. Each account has exactly one role; email is the login identifier. Public registration has no instructor role selector. Unverified users can access verification/resend/logout and basic account information, but not classrooms or execution. Password recovery always presents a neutral response; reset links expire and are single-use. Instructor receives a provisioned account and completes password setup/verification. In the local synthetic-data demo, verification/reset emails are inspected in a development mail catcher; no real recipient is required.

Acceptance: a student cannot promote themselves through crafted fields, expired links fail safely, and logout clears private UI state.

## 2. Instructor creates classroom and enrolls students

Instructor enters course/title, section, academic year, semester, term end date and timezone → creates active classroom → generates an expiring invitation → shares the code through their existing class channel. Code plaintext is shown only on generation/rotation. The instructor can disable or replace it.

Student signs in → enters code → API checks verification, code, expiry, classroom state and membership → creates membership or returns existing active membership → opens classroom. Failed code attempts are rate-limited. A removed student receives a generic join failure and must contact the instructor. Rejoining cannot reset attempt counts.

Instructor views roster → removes membership when necessary → student loses classroom access → owner retains historical records. Reactivation restores the same membership. Under confirmed D06, late joiners see earlier closed activities as not assigned, excluded from their possible points. Preserve existing allocations on reactivation; create missing ones using the open/closed state at reactivation. Explain this policy before classroom use.

## 3. Instructor publishes an activity

Choose classroom → create draft → set grading period, OC/LAB and Activity/Assignment → add instructions, public examples and hidden tests (equal points per test) → select the approved runtime, points, attempts and deadline → review publication checklist → publish.

The checklist confirms expected outputs, comparison rules, timezone, hidden-test privacy, and the lock rules: non-test assessment fields freeze at publication; tests lock when the first assessed submission is accepted. Until then, the owner may correct tests with audit history and publication validation. Public examples are executable public tests; no duplicate example model is needed. Draft preview is visual only, not an authoring code runner. Instructor correctness checks use the approved QA process before release.

If settings are invalid, retain the draft and show field errors. If an assessed submission arrives while the instructor edits tests, reject the conflicting edit without changing the suite used for grading. To fix locked grading content later, create a replacement activity and communicate the change; this MVP cannot regrade or silently exclude the original. Extending a deadline or increasing attempts updates the activity and creates an audit event.

## 4. Student works on an activity

Open grading-period list → open activity → read instructions, examples, deadline/timezone, scoring and attempts → write source → Run public tests or custom input → see queued/running state → inspect bounded output → revise.

Run consumes no assessed attempt. Unsupported language, oversized input, excessive request rate, expired deadline or inactive membership prevents execution with a clear message. During an outage the editor remains usable, but Run/Submit indicates service unavailability. Editor content is held in memory; navigation warns about unsaved work. Refresh recovery/cloud autosave is not promised.

## 5. Student submits and recovers from uncertainty

Student chooses Submit → UI creates one idempotency key for that action and snapshots source → API admits transactionally → returns accepted submission ID and status → UI polls at roughly 2 seconds with backoff up to 10 seconds → stops on terminal status or loss of authorization.

- Lost POST response: retry the same body/key, or refresh own submission history. Do not allocate a new key until the outcome is known.
- Deadline passes while queued: accepted work still grades normally.
- Compile/runtime/test failure: show graded outcome, score and safe public diagnostics; attempt counts.
- Infrastructure failure: show system error, null score and released attempt slot. A new attempt needs a new key and an open deadline.
- Worker retry: keep the same submission, source and attempt number; UI may remain running while recovery occurs.
- Limit reached or second simultaneous Submit: reject without creating another attempt and show current limit/in-flight work.
- Student edits after Submit: new editor text does not change accepted source.

Acceptance: duplicate requests, refresh and worker restart never double-count or change an accepted source snapshot.

## 6. Instructor reviews and gives feedback

Open classroom → select activity/student → inspect attempts, source, grade and full authorized test results → write or edit submission feedback → student sees note on their own submission. Feedback is escaped/restricted Markdown and audited. It cannot alter scores or expose another student's work. Explain concepts without copying hidden test data into student-visible notes.

## 7. Review progress and export

Student filters by period and sees completed/pending/missed for assigned work, not-assigned labels for earlier closed activities, and execution/correctness indicators. Instructor selects period/session/type filters → reviews roster including removed membership labels → sees best scores and student-specific possible points → exports the same filtered snapshot as CSV. Spreadsheet-dangerous cells are neutralized. Exports never include source, tests or feedback.

Acceptance: a graded zero is distinguishable from a missing grade; pending or system-error work remains visible; on-screen and exported values agree for the same snapshot.

## 8. Close a classroom

Instructor archives classroom → code is disabled and new work is blocked → accepted submissions finish → authorized users retain read-only history → owner can still export. No restore or destructive academic-history deletion workflow is in MVP. Retention/purge occurs only through an approved operational process.
