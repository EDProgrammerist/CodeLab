# CodeLab

Phases 1-4 are complete. The current scope is private programming classrooms, Java editing, code submissions for instructor review, feedback and completion tracking. Scores are recorded externally in instructors' class records; automated grading and CSV/Excel exports are removed. Run Java remains a deferred feature. Phase 6 frontend-only preparation is complete; Phase 7 hardening is in progress. Actual deployment remains deferred. School name: Asticassia School of Technology; no Facebook page is configured.

- [Local startup and verification](docs/local-development.md)
- [Public pages and school policy review](docs/public-pages-and-deployment.md)
- [Authentication, instructor provisioning and security checks](docs/authentication-implementation.md)
- [Project overview and decisions](docs/project-overview.md)
- [Roadmap and phase evidence](docs/development-roadmap.md)
- [Frontend architecture](frontend/PROJECT_STRUCTURE.md)
- [Visual requirements](docs/DESIGN.md)

From PowerShell in this directory, with the existing local environment files:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml up -d
.\infra\app\frontend.ps1 dev
```

Open http://127.0.0.1:5173 to sign in or register a student. For an existing earlier-phase installation, apply the additive migrations and session settings in the authentication guide first. Email verification and password-reset messages arrive in local Mailpit. Provision instructors through the documented operator command. Use synthetic identities; classrooms and assignments use real database records, and progress uses stored submissions. The old grading simulation is retired. API health: http://127.0.0.1:8010/api/v1/health. Local mail: http://127.0.0.1:8025.

Production deployment and runner VM scaffolding have been removed. Vercel frontend configuration is prepared; backend hosting and publication remain deferred. The local Docker development stack is retained, including its Linux containers. Existing database volumes are unchanged.

- [Vercel frontend preparation](docs/vercel-frontend.md)
- [Phase 6 and 7 acceptance evidence](docs/phase-6-7-acceptance.md)
