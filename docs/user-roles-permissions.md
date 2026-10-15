# User Roles and Permissions

> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

Status: Phase 1 review baseline. Instructor provisioning and exactly one role per account are confirmed under D02.

## Roles

- **Student:** owns their profile, editor work and submissions; participates only through active classroom membership.
- **Instructor:** owns private classrooms and all authoring/reporting actions within them.

There is no administrator application role in MVP. An infrastructure operator may provision instructor accounts using a protected operational procedure, but has no ordinary product session or cross-classroom dashboard. Operator access is exceptional, logged and governed separately. A user cannot change their own role or classroom ownership.

## Permission matrix

| Resource/action | Student | Instructor |
| --- | --- | --- |
| View/edit own basic profile and password | Own account | Own account |
| Create classroom | No | Yes, self as owner |
| Read classroom | Active membership, including archived classrooms | Own classrooms only |
| Edit/archive classroom | No | Owner, subject to frozen term rules |
| View/rotate/disable invitation | No | Owner of active classroom |
| Join by invitation | Verified student, active classroom | No |
| Read roster or other students' identities | No | Owner |
| Remove/reactivate enrollment | No | Owner of active classroom |
| List/read activity | Active membership; published or previously published archived only | Owner; drafts included |
| Author tests, publish/archive activity | No | Owner of active classroom |
| Read hidden tests/expected outputs | Never | Owner only |
| Run/Submit | Own work; active membership; assigned allocation; active/open published activity | No assessed student impersonation; runner QA is operational |
| Read source and submission history | Own within active membership | Submissions in owned classroom |
| Read Run results | Own, until expiration and while authorized | Not exposed through instructor API in MVP |
| Write/edit feedback | No | Owner for classroom submissions, while classroom active |
| Read feedback | Own submissions, while enrolled | Owner |
| View period results | Own results only | Entire owned classroom |
| Export CSV | No | Owner; includes removed-member history |
| Edit scores/delete assessed history | No | No |

## Mandatory boundaries

1. Authenticate first, then authorize the specific resource and action through Laravel policies. UI route guards are convenience only.
2. Scope queries to classroom owner or active membership before returning data. A role check alone is insufficient. Lists, counts, aggregates, search, result polling and exports use the same boundary.
3. Resolve nested resources through their parent. Activity must belong to the classroom; submission must belong to the activity and enrolled author; feedback must belong to that submission. Reject mixed identifiers even when the caller owns one parent.
4. Student identity and instructor ownership come from the session, never writable request fields. Clients cannot supply effective score, owner ID, published timestamp or evaluation status.
5. An invitation authorizes joining only; it never authorizes reading classroom records without a session. Knowledge of a numeric ID or runner job ID grants no access.
6. Student serializers whitelist safe fields and omit hidden test records rather than hiding them in UI. Error/debug responses, cached payloads and CSV must follow the same rule.
7. On removal, revoke all classroom reads/writes at the next request, including historical submissions, feedback and polling. Retain records for the owner. Reactivation is owner-only and restores access without resetting attempts.
8. Archival retains authorized historical reads but disables new execution. Work admitted before archival/removal may finish; authorization still controls who can read it.

Use 404 for inaccessible classroom-scoped resources to reduce existence leakage, 403 for disallowed role/action on an otherwise visible resource, and 401 for missing authentication. Verify two instructors with separate classrooms and two students, including one enrolled in both. Private grading content must not cross either ownership or student boundaries.

## Shared-computer handling

Clear authenticated query caches and in-memory source on logout/account switch. Do not persist source, rosters or grades in browser storage in the MVP. A removed member may have already read or copied previously accessible information; access revocation prevents future requests, not retroactive erasure.
