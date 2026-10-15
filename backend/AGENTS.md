# CodeLab API agent guidance

Laravel scaffold initialization and Boost guideline installation are complete. Read CLAUDE.md for the generated PHP/Laravel conventions; do not repeat initial Boost installation.

Run PHP and Composer through the root infra/app/compose.yaml stack (PHP 8.4). Host PHP 8.2 is not compatible. See ../docs/local-development.md for commands.

Follow the approved planning documents in ../docs. Phases 3-4 implement authentication, classroom/enrollment/schedule workflows and activity authoring. Preserve classroom-first transaction locking and student-safe serializers. Isolated execution belongs to Phase 5. Never execute student code in this application stack.
