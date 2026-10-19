<div align="center">
  <br />
  <a href="#introduction">
    <img src="frontend/src/assets/landing-classroom.png" alt="CodeLab programming classroom illustration" width="900" />
  </a>
  <br />
  <br />

  <div>
    <img src="https://img.shields.io/badge/-React-61DAFB?style=for-the-badge&amp;logo=react&amp;logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&amp;logo=typescript&amp;logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/-Tailwind-06B6D4?style=for-the-badge&amp;logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS" />
    <br />
    <img src="https://img.shields.io/badge/-Laravel-FF2D20?style=for-the-badge&amp;logo=laravel&amp;logoColor=white" alt="Laravel" />
    <img src="https://img.shields.io/badge/-MySQL-4479A1?style=for-the-badge&amp;logo=mysql&amp;logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/-CodeMirror-D30707?style=for-the-badge&amp;logo=codemirror&amp;logoColor=white" alt="CodeMirror" />
  </div>

  <h3 align="center">CodeLab | Programming Laboratory &amp; Classroom Workspace</h3>
</div>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🚀 [More](#more)

## <a name="introduction">✨ Introduction</a>

CodeLab is a web-based programming laboratory for college students and instructors, built with React, TypeScript, Laravel, and MySQL. Instructors organize private section classrooms, share enrollment codes, publish questions for activities and assignments, and manually review submitted code. Students write Java solutions in CodeMirror, submit their answers, and track their progress throughout the semester.

The workflow is simple: **create a classroom, enroll students, publish questions, submit code, and review answers with points and feedback.**

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[React](https://react.dev/)** builds the component-based student and instructor interfaces.

- **[Vite](https://vite.dev/)** provides the frontend development server and build tooling.

- **[TypeScript](https://www.typescriptlang.org/)** adds static types to frontend components, services, and API data.

- **[Tailwind CSS](https://tailwindcss.com/)** styles the responsive layouts, alongside shadcn/ui primitives, Radix UI, and Lucide icons.

- **[React Router](https://reactrouter.com/)** handles navigation and role-specific routes. **[TanStack Query](https://tanstack.com/query)** and **[Axios](https://axios-http.com/)** manage server data and API requests.

- **[CodeMirror](https://codemirror.net/)** provides the Java editor with syntax highlighting, line numbers, and active-line highlighting.

- **[Laravel](https://laravel.com/)** runs the PHP 8.4 REST API, validation, classroom permissions, and submission workflow. **Laravel Sanctum** provides cookie-based authentication.

- **[MySQL](https://www.mysql.com/)** stores accounts, classrooms, activities, submissions, and instructor feedback. **[Redis](https://redis.io/)** supports cache and queue infrastructure.

- **[Docker Compose](https://docs.docker.com/compose/)** runs the local backend services. **[Mailpit](https://mailpit.axllent.org/)** captures verification and password-reset emails during development.

- **[Playwright](https://playwright.dev/)** and axe-core check browser workflows and accessibility. ESLint, TypeScript, PHPUnit, and Laravel Pint support code quality.

## <a name="features">🔋 Features</a>

👉 **Private Section Classrooms**: Instructors create classrooms with a section, First through Fourth Year level, First or Second semester, and academic year. Invitation codes let students join the correct classroom.

👉 **Activities and Assignments**: Separate work labels keep classrooms organized. Instructors enter questions, set maximum points and deadlines, choose a grading period and OC/LAB session, and publish directly from the creation form.

👉 **Focused Code Workspace**: Students open questions alongside CodeMirror, write their Java answers, and submit. The editor includes readable spacing, line numbers, syntax highlighting, and a responsive editing area without extra run or review controls.

👉 **Manual Instructor Assessment**: Submitted code is saved for the instructor to check. Instructors award points within the activity maximum and provide comments or explanations through the existing classroom review workflow.

👉 **Grading-Period Progress**: Students track completed, pending, and missed work across Prelim, Midterm, Semi-Final, and Final. Updated solutions can be submitted before the deadline without an attempt limit.

👉 **Profile Settings**: Both roles can update their name and upload a profile picture. Students can also update their unique student number and profile section; changing that section does not change classroom enrollment.

👉 **Classroom Management**: Instructors manage enrolled students and invitation codes. Owner-only classroom deletion removes access and disables invitations while preserving stored work.

👉 **Account Security**: Student registration, controlled instructor provisioning, email verification, password recovery, role-based routes, classroom authorization, CSRF protection, rate limiting, and secure logout.

👉 **Responsive Public Website**: Landing, About, Contact, Privacy Policy, and Terms of Use pages use original illustrations and layouts designed for desktop, tablet, and phone screens.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up CodeLab locally on Windows using PowerShell.

**Prerequisites**

- [Git](https://git-scm.com/)
- [Node.js and npm](https://nodejs.org/en) ? the project uses Node 24; the frontend helper resolves the pinned version.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Linux containers enabled and its engine running.
- An internet connection for the initial dependency and container downloads.

**Cloning the Repository**

```powershell
git clone https://github.com/EDProgrammerist/CodeLab.git
cd CodeLab
```

