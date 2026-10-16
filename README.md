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
