# Phase 6: Public pages and deployment preparation

> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

## Confirmed scope

The corrected school name is **Asticassia School of Technology**. No Facebook page, verified contact, or location has been supplied for this name. Public pages omit the old Facebook name and old location. Legal jurisdiction and institutional details require confirmation before approved policies or publication. No hosting/domain exists; frontend-only Vercel preparation is complete; hosting and publication remain deferred.

The root route is the public landing page. Sign-in remains `/login`. `/about`, `/contact`, `/privacy` and `/terms` are public. Unknown routes render a helpful not-found page. Account pages link to public information. The landing uses an actual application screenshot with fictional records and explicitly explains that Run Java is deferred and automated grading is outside the current scope.

Visual design follows [docs/DESIGN.md](DESIGN.md) and installed design-taste-frontend: variance 3, motion 2, density 4. Paper/blue colors, restrained typography, native expandable questions, visible focus, route-change focus and responsive layouts prioritize usability. There is no marketing tracker, contact form or invented testimonial. The preview is marked noindex; that is not an access-control mechanism.

## School legal review required

Privacy and Terms are drafts, dated 14 October 2026 for review, not effective policies. They describe current behavior and describe code submission and instructor feedback without scores. They make no institutional endorsement or compliance certification claim.

Before real student data or publication, the college must settle:

- Responsible personal information controller, operator responsibilities, DPO and a private verified contact channel.
- Processing purposes and appropriate lawful bases, including educational records and any minors; avoid blanket consent as a substitute for school review.
- Actual hosting/processors, access rules, international transfers if applicable and approved disclosures.
- Retention periods for accounts, academic records, source, logs and backups; deletion/legal-hold procedures. Archival does not delete records. The implemented short-lived practice cleanup is not an academic-retention policy.
- Identity-verified rights requests and applicable exceptions, breach handling, complaints and response ownership.
- Academic integrity, appeals, service interruptions, instructor authority and approved effective dates/version history.

References for review: [Philippine Data Privacy Act](https://privacy.gov.ph/data-privacy-act-/), [implementing rules](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/), [NPC data-subject rights](https://privacy.gov.ph/data-subject-rights/). The drafts require school/legal review against actual practices.

## Current deployment boundary - 15 October 2026

The owner resumed work and confirmed frontend-only Vercel preparation, leaving backend hosting undecided. See [Vercel setup](vercel-frontend.md), [design and acceptance notes](phase-6-7-acceptance.md) and [current acceptance evidence](phase-6-7-acceptance.md). No hosting account, domain or public deployment was created.

The previous production Docker/Caddy package and runner VM scripts stay removed. The local development stack remains in infra/app; no working database reset occurred. Older ignored rehearsal artifacts may still exist on disk after blocked cleanup; their removal is not a deployment prerequisite.

Public pages have been aligned with the design reference and verified locally. Policies retain their draft status and existing school-review requirements. Local checks do not establish Vercel routing, live HTTPS authentication or institutional readiness.

## Scope revision verification - 14 October 2026

The manual-review workflow is implemented: code submissions are saved immediately without a runner, instructor feedback persists, and progress uses received submissions without grades. CSV/XLSX generation and its route are removed. Old grading jobs are inert and no new evaluation jobs are dispatched. Existing records and legacy schema fields are retained; there was no destructive migration.

Validation: 41 backend tests / 346 assertions passed (two opt-in MySQL concurrency tests skipped), 12 default browser checks passed, and a separately run live MySQL/Mailpit/mobile-emulation journey passed through student submission, instructor feedback, student reload and completion tracking. Frontend lint/type/build and PHP formatting passed. A live-session regression caused by no-referrer was fixed using an origin-only referrer policy; same-origin Sanctum authentication then passed. No production rehearsal was resumed and no Java code was executed. The existing lazy Monaco bundle warning remains.

Branding now uses Asticassia School of Technology with no Facebook page. New location/jurisdiction is unconfirmed; legal text remains conditional and draft. The owner resumed Phases 6 and 7 on 15 October 2026; see development-roadmap.md for current status.
