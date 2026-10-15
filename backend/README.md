# CodeLab API

Laravel REST API, separate from the React frontend. Use the PHP 8.4 Docker runtime and Composer lockfile.

See [local development](../docs/local-development.md) for environment setup, startup and checks. Health, authentication, dashboards, private classrooms, weekly schedules, enrollment, invitations and activity/test authoring are implemented. See [authentication implementation](../docs/authentication-implementation.md) for routes, operator provisioning and tests; remaining resources are planned in [API design](../docs/api-design.md).

Phase 3 migrations establish users, database sessions, recovery tokens and classroom/membership foundations. Apply migrations additively; never reset the working database to run tests. Tests use isolated in-memory SQLite.
