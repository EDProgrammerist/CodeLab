# Vercel frontend preparation

Scope confirmed 15 October 2026: prepare React only. Laravel/MySQL hosting is undecided. Nothing has been published.

Import this repository into Vercel when ready and set **Root Directory** to `frontend`, framework to Vite, Node to 24.x, install to `npm ci`, build to `npm run build`, and output to `dist`. The checked-in `frontend/vercel.json` supplies SPA routing and preview security headers. Do not put database credentials, Laravel APP_KEY or other secrets in VITE variables or the frontend project.

Public pages can be previewed independently. Authentication, registration, classrooms and submissions require Laravel and will not work on a frontend-only deployment. The SPA rewrite excludes `/api`, `/auth`, `/sanctum` and `/up` so missing backend routes cannot return a successful HTML page disguised as an API response. Noindex is retained for draft policies; it does not restrict access.

Before enabling real accounts, select backend, MySQL, mail and storage providers. Prefer same-origin external rewrites for the four backend prefixes, ahead of the SPA fallback, to preserve the application's existing relative requests. Use only the exact trusted backend origin, bypass caching for authenticated responses, configure Laravel trusted proxies and stateful domains, secure cookies, and correct verification/reset URLs. Verify Set-Cookie, CSRF, registration, verification, reset and logout on the actual HTTPS topology. Do not use wildcard stateful domains or disable CSRF to make hosting work.

The local Vite proxy remains development-only; Vercel does not use it. Configuration review and a local build do not prove Vercel routing or authentication. A real preview must pass direct navigation and refresh on public and protected routes, asset loading, excluded API routes, headers and mobile checks before deployment acceptance.

References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [external rewrites](https://vercel.com/docs/routing/rewrites), [configuration](https://vercel.com/docs/project-configuration/vercel-json).
