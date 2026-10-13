# User Workflows

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
