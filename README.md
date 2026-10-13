# CodeLab

Phase 1 is approved. Phase 2.1 provides a working React frontend and Laravel API foundation. Student/instructor features and the Java execution service are scheduled for later phases.

- [Local startup and verification](docs/local-development.md)
- [Project overview and decisions](docs/project-overview.md)
- [Roadmap and phase evidence](docs/development-roadmap.md)
- [Frontend architecture](frontend/PROJECT_STRUCTURE.md)
- [Visual requirements](DESIGN.md)

From PowerShell in this directory, with the existing local environment files:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml up -d
.\infra\app\frontend.ps1 dev
```

Open http://127.0.0.1:5173. The setup preview should show **API connected**. API: http://127.0.0.1:8010/api/v1/health. Local mail: http://127.0.0.1:8025.
