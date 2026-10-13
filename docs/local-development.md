# Local development — Phase 2.1

The foundation runs locally with synthetic data only. No account, classroom or runner functionality is implemented. No migrations have been applied. The three stock Laravel migrations are unmodified scaffold files, not the approved CodeLab schema.

## Runtime and layout

- Frontend: Node 24.21.0, React 19.3, TypeScript 6.0.3, Vite 8.3.4, Tailwind 4.3.3. Exact resolutions are in package-lock.json.
- API: Laravel 13.35.0 and Sanctum 4.3.3, PHP 8.4.26 in Docker. composer.lock records exact resolutions. Authentication is deferred to Phase 3.
- MySQL 8.4, Redis 8.2, Mailpit; PHP worker and scheduler are separate processes on the trusted application network.
- Docker image digests are pinned in infra/app. backend/vendor lives in a Docker named volume to avoid Windows bind-mount extraction problems. Run PHP/Composer in the container, not with the host PHP 8.2.
- The frontend helper downloads the pinned Node through npm and temporarily prepends its directory to PATH, leaving host Node 26 unchanged. First use requires internet access.
- The supplied frontend architecture is preserved in frontend/PROJECT_STRUCTURE.md. DESIGN.md is the visual authority. Full design primitives and responsive screen review belong to 2.2/2.3.

## First setup on another machine

Install Docker Desktop with Linux containers and a working npm command. Start Docker Desktop. Run these commands from the project root.

1. Copy `.env.example` to `.env` only if the local file does not already exist. Replace both database password placeholders with different randomly generated passwords. Hexadecimal strings avoid environment-file quoting issues. Keep `.env` private.
2. Copy `backend/.env.example` to `backend/.env` only if absent. Set its DB_PASSWORD to exactly the root .env DB_PASSWORD. Root .env supplies Compose interpolation; backend/.env supplies Laravel configuration. Do not regenerate database credentials after initializing the MySQL volume without a deliberate password rotation.
3. Build and install:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml build app
docker compose --env-file .env -f infra/app/compose.yaml run --rm --no-deps app composer install --no-interaction
docker compose --env-file .env -f infra/app/compose.yaml run --rm --no-deps app php artisan key:generate --no-interaction
.\infra\app\frontend.ps1 ci
```

Generate the application key only on first setup. Do not overwrite an existing key. No database migration command is required for Phase 2.1.

## Start and stop

```powershell
docker compose --env-file .env -f infra/app/compose.yaml up -d
.\infra\app\frontend.ps1 dev
```

The frontend command stays in the terminal; use another terminal for checks. Ctrl+C stops Vite. `docker compose --env-file .env -f infra/app/compose.yaml stop` stops only CodeLab containers and preserves data.

| Service | Address |
| --- | --- |
| Frontend | http://127.0.0.1:5173 |
| API liveness JSON | http://127.0.0.1:8010/api/v1/health |
| Laravel health | http://127.0.0.1:8010/up |
| Mailpit local inbox | http://127.0.0.1:8025 |

Port 8010 avoids an existing service on 8000. MySQL and Redis have no host port bindings. Use 127.0.0.1 consistently. Vite proxies /api, /auth, /sanctum and /up to the API, establishing the same browser origin for later Sanctum cookie authentication. The health route is a liveness check, not proof of database/queue readiness.

File sessions temporarily allow boot without a sessions table. Phase 3 will implement the planned database session storage, stateful Sanctum middleware, CSRF and account flows with their tests. Redis handles cache/queue configuration now. The idle worker/scheduler do not imply assessment jobs exist. Queue failed-job persistence will be established with Phase 3 migrations.

`frontend/.env.example` documents the optional API_PROXY_TARGET override. It defaults to 8010 in vite.config.ts. Vite preview is only a build preview; use the dev server for the local API proxy.

## Checks

```powershell
.\infra\app\frontend.ps1 check
docker compose --env-file .env -f infra/app/compose.yaml exec -T app composer validate --strict
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan test --compact
docker compose --env-file .env -f infra/app/compose.yaml exec -T app vendor/bin/pint --test
docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan db:show --database=mysql --no-interaction
docker compose --env-file .env -f infra/app/compose.yaml exec -T redis redis-cli ping
docker compose --env-file .env -f infra/app/compose.yaml ps
```

Baseline evidence on 2026-10-13: frontend lint/type/build passed; two backend tests passed (three assertions), including the JSON health contract; Composer validation passed; PHP formatting checked; API health passed through the Vite proxy; MySQL connected with zero tables; Redis returned PONG; six service containers were running. Dependency audits reported no advisories at installation time. CI is defined in `.github/workflows/checks.yml`; it has not run on a remote GitHub repository. Browser visual/accessibility acceptance remains for 2.2/2.3; the in-app browser was unavailable in this session.

## Initialization decisions and boundaries

ESLint 10.12 replaces the deprecated 9.39.5 planning baseline, with compatible typescript-eslint 8.71.1 and plugins. Monaco's DOMPurify dependency is overridden to 3.4.17 to address the reported advisories; recheck the override when upgrading Monaco. Laravel Boost is a development-only dependency installed per the generated Laravel scaffold guidance; no MCP connection was configured. The lockfiles are the installation baseline.

Environment files, dependency trees and build outputs are ignored by Git. Environment examples contain placeholders only. Do not expose the development API, Mailpit, Docker socket or databases publicly. Student code must never run in this application stack. The dedicated runner and its containment verification remain Phase 5 work.
