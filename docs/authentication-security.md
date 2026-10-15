# Authentication and Security

> **Scope revision - 14 October 2026:** [Current functional requirements](functional-requirements.md) supersede older grading/export references below. CodeLab stores code submissions and instructor feedback, with no new scores, grading calculations or CSV/Excel exports. Completed means code was received. Run Java is deferred independently of submission. School: Asticassia School of Technology; no Facebook page supplied. Phases 6 and 7 resumed on 15 October 2026; see development-roadmap.md for current acceptance status. Older grading architecture and evidence are retained as historical design, not current commitments.

Status: approved security plan. Phase 3 authentication and classroom authorization foundations are implemented and tested; see [implementation evidence](authentication-implementation.md). Later domain and deployment controls remain phase-gated. Code execution must pass the Phase 5 containment gate before any untrusted student program is enabled.

The confirmed first release is local-only with synthetic accounts and grades. Sandbox, authorization and resource-limit requirements still apply. The review baseline is a dedicated Linux VM running Docker/gVisor with a restricted supervisor; application-host execution is prohibited. Real student data or public access requires a separate approved hosting, retention and operational plan. Production-only controls below remain documented prerequisites for that later deployment. Demo verification/reset emails go only to a local development mail catcher; this exercises the workflow without contacting real recipients. Loopback HTTP is a documented development exception; CSRF/session protections remain enabled and production requires HTTPS/Secure cookies.

## Browser authentication

Use Laravel Sanctum's first-party SPA cookie authentication, with Laravel sessions and CSRF protection. Prefer a same-origin reverse proxy serving built React files and routing `/api`, `/auth` and `/sanctum` to Laravel. The frontend/backend remain separate projects and deployments even though the browser sees one origin. Related subdomains are an acceptable alternative after cookie and exact-origin CORS tests; unrelated domains are not the planned deployment.

The browser obtains the CSRF cookie, then sends credentials and the matching X-XSRF-TOKEN header with state-changing requests. Session cookies are HttpOnly, Secure in production and SameSite=Lax where compatible. The CSRF cookie is intentionally readable by the client; the session cookie is not. Axios configuration must match the chosen origin topology. Never disable CSRF as a CORS workaround or store bearer tokens in localStorage. This design follows [Laravel Sanctum SPA authentication](https://laravel.com/docs/13.x/sanctum#spa-authentication); installed versions are pinned in the lockfiles and recorded in local-development.md.

Use framework password hashing and password-reset primitives, regenerate session IDs after login, expire idle sessions (proposed 2 hours), invalidate sessions on logout/password reset, and offer neutral reset/login error messages. Public registration always sets student role server-side. Verify email before classroom access; throttle registration, login, verification and reset. Instructor provisioning requires a protected operator workflow; no default shared passwords. Reject role/owner fields using request allowlists rather than relying on hidden form controls.

## Authorization and private data

Laravel policies enforce owner/membership boundaries at every query and mutation. Scope nested IDs and prevent assignment of arbitrary user, membership, score or status values. Recheck current access during polling/export. Serialize student/owner resources explicitly. A classroom code is a join capability, not a login credential or permanent authorization token.

Generate invitation codes using a cryptographic random source: proposed 12 characters from an unambiguous 32-character alphabet (60 bits). Normalize case consistently; store a keyed HMAC digest indexed for lookup. Display plaintext once, default expiry 7 days, allow rotation/revocation; default expiry is configurable. Rate-limit joins initially to 5/minute/account and 20/minute/IP with deployment-aware tuning for shared campus NAT. Keep responses generic for invalid/revoked/removed-user cases. Never put codes in analytics or ordinary request logs.

Academic records, source, hidden tests and feedback are private; encrypt transport and backups, restrict storage/service accounts, and use no-store responses. Logs contain resource IDs, reason codes and timings, not source/input/output or secret headers. Operator access and retention need institutional approval under D12; this plan does not assert legal compliance.

## Threat register

| Risk | Safeguard and required evidence |
| --- | --- |
| Cross-classroom access / IDOR | Owner/member policies plus nested scoping; tests with unrelated instructors and students, including lists, exports and feedback |
| Account takeover / role escalation | Password hashing, CSRF/session rotation, throttling, verified email, server-owned roles; negative request-field tests |
| Invitation guessing/leakage | Random expiring digest-stored codes, rate limits, rotation/revocation and no public roster responses |
| Host escape from malicious source | Separate Linux runner host plus strengthened sandbox runtime; patched immutable images; no privileged containers or host/socket mounts; containment testing |
| Fork bombs, loops and output flooding | CPU/wall/memory/PID/disk/output caps enforced outside guest code; process-tree termination and bounded queues |
| Credential theft or network abuse | Guest has no network, cloud metadata, DNS, API/DB/Redis access or inherited secrets; test outbound and internal-network denial |
| Hidden-test extraction | Feed only current stdin into guest; expected outputs and other tests stay outside; suppress hidden outputs/diagnostics from all student channels |
| Forged or replayed runner results | Private authenticated transport, validated resource/generation identity, one atomic terminal commit and stale-result rejection |
| Limit/deadline race / double grading | Database transaction locks, unique idempotency keys, durable snapshots, generation leases and recovery tests |
| XSS through source, output or Markdown | Render text as text; sanitized restricted Markdown, Content Security Policy and no HTML execution in output panes |
| SQL/command injection | Parameterized ORM queries, validated identifiers and fixed execution adapter commands; never interpolate user source/filenames into shell text |
| CSV formula injection | Escape CSV correctly and neutralize cells beginning with spreadsheet formula/control prefixes, including leading whitespace/control characters; test common spreadsheet import behavior |
| Queue/log leakage | ID-only messages, redacted error payloads, private Redis network and credentials; inspect failed-job records |
| Lost academic records | Encrypted backups, tested restoration, retained immutable source/test provenance and controlled purges |
| Dependency/sandbox vulnerabilities | Pin supported runtime images by digest, scan and patch dependencies, disable affected runtime and drain unsafe workloads |

## Code execution trust boundary

Student code is hostile even in a private college classroom. Never execute it in the Laravel PHP process, application container, queue-worker host shell or browser with privileged server access. Use a dedicated runner service on a separate host/network security boundary. A strengthened runtime such as gVisor is the proposed candidate, subject to compatibility testing; standard containers alone are insufficient for this threat model. gVisor supplies additional isolation but does not remove the need for host/network controls or patching. See [gVisor's architecture overview](https://gvisor.dev/docs/).

Require a non-root workload identity, dropped capabilities, no privilege escalation, restricted syscall profile, read-only base filesystem and size-limited temporary workspace. Block guest networking externally, including metadata and private networks. No host paths, Docker socket, production credentials or writable shared caches. These controls align with [OWASP Docker security guidance](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html); they are proposed controls to verify, not proof of containment.

The trusted runner supervisor handles lifecycle; its control credentials never enter a guest environment. Each test receives a fresh sandbox and only its own stdin. Expected output remains in the trusted grader; the guest necessarily sees its current input, so hidden-input secrecy depends on preventing egress and suppressing all hidden stdout/stderr and diagnostic channels. Aggregate scores still create a limited inference channel. Attempt caps and no hidden per-test detail reduce this risk; absolute secrecy against repeated probing is not promised.

Program output is data, never executable markup or trusted runner metadata. Control responses must have schema/size validation and bind to the expected job/generation. Destroy sandbox storage and processes after every run/test, including timeout, worker crash and cancellation. Keep only authorized bounded assessed results in private storage.

## Incident and release controls

Provide an operational execution-disable switch. On suspected escape or systemic grading corruption: stop intake, isolate runner hosts, preserve minimal protected audit evidence, notify responsible institutional staff through approved processes, rotate impacted secrets, repair/rebuild images and replay containment tests before resuming. Do not blindly regrade immutable terminal records; use an approved correction process outside the current MVP contract.

Before live use: test unauthorized access, CSRF, session recovery, invitation abuse, sandbox denial paths, stale result rejection, dependency scans, log redaction and backup restoration. Resolve the retention policy and runner vendor/data-location decision before sending real student code to any third party. Future SSO/MFA and plagiarism checks do not substitute for current isolation requirements.
