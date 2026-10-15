# Functional Requirements

Current approved scope, 14 October 2026. This replaces the earlier automated-assessment and export requirements. Phases 6 and 7 are paused at the owner's request; this scope correction does not resume deployment work.

## MVP

- Two roles: public student registration and controlled instructor provisioning; email login, verification, recovery and secure logout.
- Each instructor owns private classrooms, one per course/section/term, with enrollment invitations and weekly OC/LAB schedules.
- Activities and assignments are categorized by academic year, semester, grading period and session. Preserve the approved calendar placeholders until the owner supplies the actual schedule.
- Instructors author instructions and optional public or instructor-only examples, set deadlines and submission limits, publish and archive activities, review submitted code and provide comments/explanations.
- Students write single-file Java in Monaco or the plain-text fallback and submit source for instructor review. Source is stored as text and never executed by React, PHP or the database.
- CodeLab tracks received submissions and completion. Instructors record scores manually in their own class records outside CodeLab.
- No score entry, automated grading, highest-score selection, grade totals, percentages, gradebook calculations, CSV exports or Excel exports.

## Submission rules

A successful new submission returns immediately after storage with state `submitted`; it is not queued for evaluation. It consumes one attempt. The default limit remains five, configurable from one to fifty. A valid repeated idempotency key with identical activity/language/source returns the existing record without consuming another attempt; different content with that key returns conflict. Preserve source whitespace and reject source exceeding 64 KiB.

Admission requires a verified active student, active membership in the correct classroom, assigned published activity, active classroom, enabled activity language, an unexpired deadline and remaining attempts. The server clock and classroom transaction lock determine admission. A request at the exact deadline is accepted; later requests are rejected. Replayed successful requests may return their existing record after closure, but cannot create another submission.

Published instructions/categories/language remain fixed. Deadlines and limits may only increase. Examples lock on the first code submission; a replacement activity is needed for later corrections. No public/hidden test combination is required to publish; examples are optional and never graded.

## Review and progress

Students see only their own submitted source and instructor feedback. The classroom owner can review enrolled students' submissions and add/edit text feedback. Other instructors and students cannot access those records by guessing IDs. Feedback does not create a numeric grade.

- Completed: at least one successfully received code submission, regardless of correctness or feedback.
- Pending: assigned, still open, and no received submission.
- Missed: assigned, closed by deadline or archival, and no received submission.
- Not assigned: earlier closed work excluded by the existing late-enrollment policy; excluded from completion counts.

The submission list distinguishes submitted and reviewed (feedback exists). Existing legacy infrastructure failures do not count as received submissions or consume capacity. Legacy successful/queued source records remain reviewable without their old grading results. No score fields are returned in submission, progress or activity resources.

## Deferred and excluded

Run Java is a future feature. Its endpoints remain unavailable, even if old execution environment flags are enabled. A later approved isolated service must enforce network/filesystem/process/memory/time limits; it must not run code on the application host. Running code will remain separate from submitting it and will not introduce automated grading.

Future enhancements require approval: additional languages, multiple files, co-teachers, SSO, notifications, individual deadline accommodations and collaboration. Automated grading and grade exports are removed, not promised future features.

## Branding

Use **Asticassia School of Technology**. No Facebook page name or URL is provided. Do not infer the new school's location, institutional endorsement, private support email or legal jurisdiction. Public policies remain school-review drafts.
