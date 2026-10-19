# Functional Requirements

Current approved scope, 17 October 2026. This replaces the earlier automated-assessment and export requirements. Phases 6 and 7 are paused at the owner's request; this scope correction does not resume deployment work.

## MVP

- Two roles: public student registration and controlled instructor provisioning; email login, verification, recovery and secure logout.
- Each instructor owns private classrooms, one per course/section/term, with enrollment codes shared with their section.
- Activities and assignments are categorized by academic year, semester, grading period and session. Preserve the approved calendar placeholders until the owner supplies the actual schedule.
- Instructors author a title and questions, set deadlines and maximum points (0.01 to 1000, up to two decimal places), publish and archive activities, review submitted code and provide comments/explanations.
- Students write single-file Java in CodeMirror or the plain-text fallback and submit source for instructor review. Source is stored as text and never executed by React, PHP or the database.
- CodeLab tracks received submissions and completion. Instructors award points manually during review; students can read their points and feedback in CodeLab.
- No automated grading or highest-score selection, grade totals, percentages, gradebook calculations, CSV exports or Excel exports.

## Submission rules

A successful new submission returns immediately after storage with state `submitted`; it is not queued for evaluation. There is no attempt limit; students may resubmit before the deadline. A valid repeated idempotency key with identical activity/language/source returns the existing record without creating another submission; different content with that key returns conflict. Preserve source whitespace and reject source exceeding 64 KiB.

Admission requires a verified active student, active membership in the correct classroom, assigned published activity, active classroom, enabled activity language, an unexpired deadline. The server clock and classroom transaction lock determine admission. A request at the exact deadline is accepted; later requests are rejected. Replayed successful requests may return their existing record after closure, but cannot create another submission.

Published questions/categories/language remain fixed. Deadlines and limits may only increase. Examples lock on the first code submission; a replacement activity is needed for later corrections. No public/hidden test combination is required to publish; examples are optional and never graded.

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

## October 17 workflow revision

- Only First and Second semesters can be selected. Existing historical Summer records are preserved, not silently reassigned or deleted.
- Student number is required and unique for new student registration. Existing accounts and instructor accounts retain their existing identities.
- Open an assigned activity/assignment to enter its code workspace, write code and submit. The instructor reviews immutable submitted source and saves comments and optional points between zero and the activity maximum. Blank points mean not yet scored; zero is a valid score.
- Points are fixed once published. Previously published activities with zero maximum can have their points configured once by the owner. Prior historical grading fields are never treated as manual scores.
- Progress reports show the latest submission's manual points. A new submission is unscored until reviewed; previous submissions and reviews remain accessible. No weighted course totals or exports are introduced.
- Application APIs no longer expose attempt counts or accept submission limits. Old database compatibility columns remain inert to preserve existing records.

Instructor classroom screens expose enrollment codes and rosters directly, without a Manage classroom toggle. Weekly schedule controls and example/instructor-note authoring are removed. Separate Activity and Assignment creation actions preselect the work type, and classroom lists group them under distinct labels. Historical schedule/example data is preserved.

Classroom creation asks only for Section, Semester, and academic-year start/end. For this simplified form the API uses the section as title, no course code, Asia/Manila timezone, and December 31 of the ending academic year as the internal date boundary (not an asserted school semester end). Existing classrooms retain their saved values.

Activity/Assignment authoring uses one Publish action to save and publish atomically. Questions use the existing instructions storage field for compatibility. Students see Questions alongside CodeMirror, without separate Instructions or Public examples sections. Instructors use Review answers in the classroom to review code, save feedback and award points; the Submissions sidebar link is removed. The session filter uses All sessions, OC and LAB.

Both roles can edit their own name and upload a JPG, PNG or WebP profile picture (2 MB maximum; 2048 by 2048 pixels maximum). Students can also edit their unique required student number and optional profile section. Profile section never enrolls or moves a student. Photos are stored privately and served to their authenticated owner; role, email and verification changes are not allowed through profile settings.
