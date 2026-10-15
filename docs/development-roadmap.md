# CodeLab development roadmap

## Current scope - 15 October 2026

The owner resumed the DESIGN.md review, Phase 6 and Phase 7. Students edit and submit code; instructors review it and provide feedback. CodeLab stores no new scores and has no grade exports or automatic grading. Run Java remains deferred. Asticassia School of Technology is the supplied project school name; no Facebook page is configured. Backend hosting remains undecided; only React frontend preparation for Vercel is authorized. No public deployment has occurred.

## Phase status

| Phase | Status | Evidence / acceptance |
| --- | --- | --- |
| 1: Planning | Complete, approved 13 October | Requirements, roles, workflows, relationships and API proposals documented; later scope changes supersede original grading plans |
| 2: Foundations and frontend | Complete; design alignment reviewed 15 October | React/Laravel foundations and layer rules; current corrections in phase-6-7-acceptance.md |
| 3: Authentication and authorization | Complete | Student registration, controlled instructor provisioning, Sanctum sessions, verification/reset, role and classroom policies; live auth journeys passed |
| 4: Classroom and activity modules | Complete | Real MySQL records, schedules, codes, enrollment, publication, deadlines and attempts; live classroom journey and concurrency checks passed |
| 5: Submission and review workflow | Complete for revised manual-review scope | Source saved without execution, idempotent attempts, owner feedback and completion tracking; no score/export UI or API; Java execution deferred |
| 6: Public pages and frontend deployment preparation | Complete for frontend-only preparation; deployment deferred | Public pages and draft policies retained, DESIGN.md corrections, Vercel configuration and runbook, local build and responsive checks passed |
| 7: Hardening and local demonstration acceptance | In progress; final acceptance pending | Security, concurrency, live workflows, browser checks, synthetic restore and local read-load/restart checks passed; remaining checks listed below |

## Design review acceptance

Follow docs/DESIGN.md and frontend/PROJECT_STRUCTURE.md. Preserve routes, services-only network calls, @/ imports, existing directories, accessible states and classroom behavior. See [design and acceptance notes](phase-6-7-acceptance.md) for findings, intentional accessibility adaptations and visual corrections. Screenshot review covers mobile and desktop; browser scans cover 360, 768 and 1366px.

## Phase 6 boundary

Landing, About, Contact, Privacy and Terms are available. Policies are drafts for school review, not effective institutional policies. Vercel is prepared for the frontend only; missing backend prefixes are excluded from SPA fallback. See [Vercel preparation](vercel-frontend.md). Choosing Laravel/MySQL/mail hosting, real HTTPS cookie/CSRF verification, approved operator/private contact/retention, and publication are deferred release requirements. No production Compose package or runner VM setup is reintroduced.

## Phase 7 acceptance

- Real student/instructor registration, verification, recovery, role routing, code submission, feedback and progress journeys pass.
- Cross-role, cross-classroom and cross-student authorization tests pass; score injection, exports, deferred runs, deadlines and retry rules stay enforced.
- MySQL publication/edit contention, simultaneous final attempts and duplicate retry tests pass in a separate synthetic database.
- Responsive views, keyboard/focus behavior and automated accessibility scans pass; record actual browser coverage and remaining manual checks.
- Restore a synthetic database without overwriting working data and compare restored records.
- Measure five concurrent independent sessions with ten synthetic accounts against declared hardware. The mixed identity/activity read probe meets p95 <500ms; five concurrent admissions meet <1s in the local sample.
- Check recovery across an API restart, dependency advisories, private-network bindings and available logs without exposing secrets.

Final Phase 7 acceptance still needs Firefox coverage, an actual screen-reader review, release rollback rehearsal, and the remaining privacy/log review. These are not claimed complete merely because the default suite passes. Current evidence and commands are in [phase acceptance](phase-6-7-acceptance.md).

Real hosting acceptance is separate: no synthetic local test proves production capacity, external SMTP delivery, HTTPS sessions or school policy approval. Run Java is not a gate for the revised manual-review release.
