# Functional Requirements

Status: proposed MVP contract. Open choices are tracked as D01–D14 in [project overview](project-overview.md).

## Capability requirements

| ID | MVP requirement | Acceptance evidence |
| --- | --- | --- |
| FR01 | Students register, verify email, sign in/out and reset passwords; instructors are provisioned | Public role escalation is rejected; verification and recovery work without account enumeration |
| FR02 | Instructors create, edit and archive their own classrooms | Another instructor cannot list, read, modify or export the classroom |
| FR03 | Classroom has title/course code, section, academic year, semester, term end date and IANA timezone | Invalid years/semesters rejected; term/timezone fixed after first activity publication |
| FR04 | Instructor issues, expires, disables and rotates a classroom invitation code | Invalid/expired/revoked codes fail; rotation invalidates the old code immediately |
| FR05 | Verified student joins active classroom and instructor manages enrollment | Duplicate join creates no duplicate; removed membership cannot be restored using a code |
| FR06 | Instructor drafts activities with instructions, examples, tests, language, points, deadline and attempt limit | Publication fails without at least one public and one hidden test or with invalid settings |
| FR07 | Activities are classified by period, session and type | Required values: `prelim`, `midterm`, `semi_final`, `final`; `oc`, `lab`; `activity`, `assignment`; year/semester inherited from classroom |
| FR08 | Students view published activities and edit one-file solutions in Monaco | Drafts and hidden test fields never appear in student responses |
| FR09 | Student runs source against public tests or custom stdin without spending assessed attempts | Results are asynchronous and bounded; hidden tests are never available to Run |
| FR10 | Student submits an immutable source snapshot for grading | Atomic eligibility checks enforce deadline, membership, concurrency and attempts |
| FR11 | Both roles inspect authorized assessed history and scores | Student sees own history; owner sees classroom students; immutable source and evaluation provenance retained |
| FR12 | Instructor writes one editable feedback note per submission | Author/updated time shown to student; feedback does not alter numeric score |
| FR13 | Student sees completed/pending/missed work by grading period | Categories follow rules below and match period report calculations |
| FR14 | Instructor filters results and exports CSV | Same authorization/calculation as on-screen report; export distinguishes zero, absent and unresolved |

## Classroom and activity lifecycle

Classrooms are `active` or `archived`. Archiving disables invitation joins, activity changes, Run and Submit. Authorized historical reads and exports remain available; already accepted work still finishes. No ownership transfer or co-teaching in the MVP. Instructor may deactivate/reactivate a membership, preserving its original join time and assessed history. No student directory or enrollment editing across classrooms. Students do not self-unenroll in the MVP.

Activities move `draft → published → archived`. Drafts may be edited or deleted; publishing is explicit and immediate. Archived activities cannot reopen or receive new work. Previously published archived activities remain visible in history and reports; never-published archived drafts remain instructor-only. Published resources cannot be hard-deleted through the UI.

At publication, freeze title/instructions, categories, runtime, maximum points and grading policy. Under confirmed D09, public examples/test cases and hidden tests remain editable until the first assessed submission is accepted. Test edits are audited, refresh the assessment digest, and preserve publication validation (including at least one public and one hidden test). The first accepted assessed submission locks the test suite atomically, before queue dispatch; even if it later has a system error, tests remain locked. Practice Runs do not lock tests and instead retain their own public-test snapshot.

Deadline may only be extended and attempt limit increased, with an audit trail; extensions can reopen an expired published activity. Locked-content corrections require a new activity. No silent edits or automatic regrading. The instructor must decide how to communicate a replacement; old published scores remain in reports and cannot silently disappear.

## Publication validation and input bounds

- Confirmed Java source contract: Temurin Java 21 for the local demo; one UTF-8 Main.java file, class Main with conventional main entry point, stdin/stdout, no packages or external libraries. The college lab's actual version will be checked later without silently changing assessed runtimes. The bounded compilation design is in [system architecture](system-architecture.md).
- Required deadline later than publication time; maximum points greater than zero and at most 1,000; attempt limit integer 1–50 (default 5).
- One active supported runtime; at least 1 public and 1 hidden test, at most 20 tests total. Every test contributes equal points; unique ordering within an activity. Public test stdin/stdout and explanation are the visible examples. Custom test weighting is future scope.
- Initial platform caps: source 64 KiB; each test input/expected output or custom input 64 KiB; instructions 20,000 characters; feedback 5,000 characters. These are tunable platform limits, not instructor-controlled escape hatches.
- Instructions and feedback use plain text or restricted Markdown; no arbitrary HTML, executable embeds, attachments, or custom judge scripts.

## Deadline and admission policy

Persist timestamps in UTC; accept explicit offsets from clients and display using the classroom timezone. API time is authoritative. At the short admission transaction's eligibility check, `server_now <= deadline_at` is accepted; later is rejected. Queue and execution time never makes accepted work late. Client clicks before the deadline do not guarantee admission if requests arrive or acquire the lock too late.

Before committing a new submission, lock the classroom/activity state and the enrollment record in a consistent order, then check active enrollment, an assigned activity allocation, active classroom, published activity, deadline, allowed language, source size, limits and no in-flight submission for that student/activity. Concurrent publication changes, archiving, withdrawal and admission must share compatible locks. Rejected admission consumes no attempt.

Each accepted record has a monotonically increasing attempt number, including records later marked system error. Limit usage counts submissions in `queued`, `running` or `graded`; terminal `system_error` does not count. A compile failure, timeout, runtime failure, output overflow or wrong answer caused by the student's program is graded and does count. System failures carry no score and release the reserved slot. Released slots cannot bypass an expired deadline; an instructor may extend the whole activity deadline after an outage. Individual extensions are future work.

A client-generated idempotency key is required. The same key and body returns the original record even if the deadline later passed; same key with a different body returns conflict. Authorization must still hold on retry. A second distinct key during in-flight work is rejected. Redis delivery duplicates must not create a second attempt or overwrite a terminal grade.

## Run versus Submit

Runs require active enrollment, an assigned activity allocation and an open published activity, and use either the public test set or custom stdin. They execute the same language/environment as submissions but produce no official score and do not affect completed status. Limit one in-flight Run per student/activity and initially 6 Runs/minute/student, plus classroom/global capacity limits. Practice responses may expose only public/custom output and bounded diagnostics. Runs expire after 24 hours. Cloud draft autosave is future scope; keep current editor state and warn before leaving unsaved work.

Submissions use all tests. Run and Submit are separate controls, with remaining assessed attempts and deadline visible before Submit. Submit snapshots source atomically; further editor changes cannot change accepted source. Do not auto-submit on Run or automatically resubmit code on a network error.

## Grading policy

Every test is all-or-nothing. Normalize CRLF/CR line endings to LF and remove at most one final LF before comparison; otherwise compare exact output, preserving spaces and case. No token matching, float tolerance, nondeterministic tasks, interactive input or custom checkers in MVP. Show this rule to authors and students.

For a graded submission: `score = round(max_points × passed_tests / total_tests, 2)` using decimal arithmetic. Public and hidden tests contribute equally; round only the final score, not individual test points. Compile failure gives zero; a per-test runtime failure, timeout or output overflow earns zero on that test. Remaining tests still run in fresh sandboxes. A platform/infrastructure failure makes the entire evaluation `system_error`, not a partial academic grade. Example: 7 passed tests out of 10 for a 100-point activity earns 70.00.

The official activity score is the highest graded submission score. Ties select the earliest accepted submission (ID breaks exact timestamp ties). Keep all attempts and feedback. No grade exists if there is no graded submission; do not store a synthetic zero. Runtime image digest, judge version, source hash and frozen assessment digest allow later diagnosis. Aggregate scores release immediately; hidden test content and per-test diagnostics remain private indefinitely.

## Progress and reporting semantics

For assigned activities that have ever been published in a student's classroom:

| Category | Rule |
| --- | --- |
| Completed | At least one graded submission, even if score is zero; correctness is shown separately |
| Pending | No graded submission and deadline has not passed, or an accepted submission is queued/running |
| Missed | Deadline passed, no graded submission and no queued/running submission |

An archived classroom/activity with no grade before its deadline remains pending but is explicitly marked closed; pending means unresolved participation, not permission to submit. A terminal system error receives an additional “evaluation failed” flag, including when the participation category becomes missed. Never conceal outages as ordinary student failure. A better attempt still running does not erase a prior completed result; mark its score provisional.

Under confirmed D06, students joining after an activity closes see it as **not assigned**, outside completed/pending/missed counts and outside their possible points. Store an activity allocation for each membership/activity pair when the activity is published to active members or when a student joins. At join, assign only published activities whose deadline has not passed; already archived activities are not assigned. Keep the decision fixed: a subsequent deadline extension does not silently assign excluded work. Drafts receive allocations on publication. Reactivation preserves existing allocations and creates any missing allocations using the reactivation time and current activity state. This is automatic eligibility tracking, not a manual exemption feature.

Reports include active and removed members, labeling membership status; reactivation preserves history and attempt usage. Student access is revoked during removal. Students may read earlier published not-assigned activities, but cannot Run or Submit them. If no activities are assigned, totals show 0/0 and percentage is not applicable, never a divide-by-zero result.

Period reports filter classroom, grading period, session and activity type. They show each activity's best points, maximum points, participation state, attempts used, unresolved evaluations and last submission time. Published archived activities remain included and labeled. Drafts are excluded. Student views contain only their own row.

Raw period earned points sum graded best scores for the student's assigned activities; possible points sum those assigned activities' published maximum points. For arithmetic only, absent assigned grades contribute zero earned points, but cells remain pending/missed/system-error rather than falsely showing a graded zero. Not-assigned cells are labeled and excluded from both sums; students can therefore have different possible-point totals. Totals are provisional while assigned work is open or evaluations are unresolved. These totals are not official weighted course grades. CSV includes generation time, filters, timezone, membership status and provisional flags; exports use one consistent database snapshot.

## Explicit future features

Per-student accommodations, late penalties, configurable best/latest rules, custom test weights, test-suite edits after the first assessed submission, retroactive regrading, manual exclusions/replacements from grade totals, manual overrides, final-grade formulas, attachments, multi-language activities and notifications need separate approved requirements.
