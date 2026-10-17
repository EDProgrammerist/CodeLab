# CodeLab

CodeLab is a web-based programming laboratory for students and instructors. Instructors organize private classrooms and programming activities; students write Java code, submit it for review, and read instructor feedback.

## Current features

- Student registration, email verification, password recovery, and secure session-based sign-in.
- Instructor accounts created through a protected operator command.
- Private classrooms for each course, section, and term, with invitation-code enrollment.
- Academic years, semesters, grading periods, and weekly OC/LAB schedules.
- Activities and assignments with instructions, examples, deadlines, and submission limits.
- Monaco Java editor with a plain-text alternative, saved submissions, and submission history.
- Instructor comments and explanations, plus completed, pending, and missed activity tracking.
- Responsive public pages, account forms, and student/instructor workspaces.

## Technology

React, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives, React Router, TanStack Query, Axios, and Monaco power the frontend. Laravel provides the REST API, Sanctum cookie-based sessions, and authorization. Local services include MySQL, Redis, and Mailpit, managed with Docker Compose.


### October 17 workflow update

Activities open directly into the code workspace. Instructors set maximum points and review submitted code to award points in CodeLab. Resubmissions are allowed before the deadline without attempt limits; progress shows the latest submission's points. First and Second are the available semesters. Student number is required for new student registration. Java execution remains deferred and no automatic grading or exports are introduced.

Apply the additive feedback-points migration without resetting data:
`docker compose --env-file .env -f infra/app/compose.yaml exec -T app php artisan migrate --no-interaction`


## Start locally

Open Docker Desktop and wait for its engine to run. From the project root:

```powershell
.\infra\app\frontend.ps1 dev
```

This starts and checks the Laravel, MySQL, Redis and local mail services before launching Vite. Open the URL printed by Vite. Running `npm run dev` directly starts only the frontend and does not start Laravel.

`ECONNREFUSED 127.0.0.1:8010` means the local API is stopped. Restart it without resetting any data:

```powershell
docker compose --env-file .env -f infra/app/compose.yaml up -d --wait
```

Services restart automatically after an unexpected stop while Docker is running. Explicitly stopped services stay stopped until started again. Docker Desktop must remain running for sign-in and database access.
