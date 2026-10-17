# CodeLab

CodeLab is a web-based programming laboratory for college students and instructors. Instructors create private section classrooms, publish activities and assignments, review submitted Java code, and award points with feedback. Students enroll using a classroom code, write solutions in their browser, and track their work throughout the semester.

## Current features

### Students

- Register with a required unique student number, name, email, and password.
- Verify email, sign in securely, and reset a forgotten password.
- Join classrooms using instructor-provided enrollment codes.
- Open an Activity or Assignment directly into the code workspace.
- Write single-file `Main.java` solutions using Monaco Editor or its plain-text alternative.
- Submit updated code before the deadline without an attempt limit.
- View submission history, instructor feedback, and manually awarded points.
- Track completed, pending, and missed work by grading period.

### Instructors

- Use an account created through controlled instructor provisioning.
- Create private classrooms using Section, Semester, and Academic Year.
- Generate enrollment codes and manage enrolled students.
- Create Activities and Assignments with distinct labels and custom titles.
- Set instructions, maximum points, deadlines, grading periods, and OC/LAB activity labels.
- Save drafts and publish them to enrolled students.
- Review code from Submission tracking, provide feedback, and award points within the activity maximum.

### Shared experience

- First and Second semesters; Prelim, Midterm, Semi-Final, and Final grading periods.
- Role-based dashboards, protected routes, and classroom-scoped authorization.
- Cookie-based sessions, CSRF protection, rate limiting, and secure logout.
- Responsive landing, About, Contact, Privacy Policy, and Terms of Use pages.
- Original landing illustrations and accessible interface components.

## Workflow

1. The instructor creates a section classroom and shares its enrollment code.
2. Students register, verify their email, and join the classroom.
3. The instructor creates an Activity or Assignment, sets points and a deadline, and publishes it.
4. Students open the work, write Java code, and submit their solutions.
5. The instructor reviews submissions and saves feedback and points.
6. Students read the review in their submission history. Progress shows the latest submission's points; a new submission remains unscored until reviewed.

## Current scope

CodeLab stores source code for **manual instructor review**. Real Java execution is deferred; submitted code is not executed by the application. Automated grading, CSV/Excel exports, weekly schedule controls, and submission attempt limits are not part of the current workflow.

Points represent instructor assessments of individual submissions, not an automatically calculated official course grade. Public legal pages require review against the school's actual practices. Production backend hosting remains undecided.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI and styling | Tailwind CSS, shadcn/ui primitives, Radix UI, Lucide icons |
| Routing and data | React Router, TanStack Query, Axios |
| Code editor | Monaco Editor with a plain-text fallback |
| Backend | PHP 8.4, Laravel REST API |
| Authentication | Laravel Sanctum cookie-based sessions |
| Database | MySQL |
| Supporting services | Redis, Mailpit, Docker Compose |
| Quality checks | ESLint, TypeScript, Playwright, axe-core, PHPUnit, Laravel Pint |

