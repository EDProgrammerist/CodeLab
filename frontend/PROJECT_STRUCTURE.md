# Project Structure (Frontend)

Stack: React + TypeScript + Vite + Tailwind CSS + React Router.

---

## 1. Directory Tree

```
project-root/
├── public/                     # Static files served as-is (favicon, robots.txt)
├── src/
│   ├── assets/                 # @/assets      Images, fonts, icons imported by code
│   ├── components/             # @/components
│   │   ├── common/             #   App shell: header, footer, global modals
│   │   ├── features/           #   Feature UI, one folder per feature
│   │   │   └── <feature>/
│   │   └── ui/                 #   Reusable primitives: button, card, input, icons
│   ├── hooks/                  # @/hooks       Custom React hooks
│   ├── lib/                    # @/lib         Pure helpers (cn, formatters, validators)
│   ├── pages/                  # @/pages       Route entry points only
│   │   └── <group>/            #   Access group: guest, admin, ...
│   │       ├── layout.tsx
│   │       └── <page>/index.tsx
│   ├── services/               # @/services    API calls / external integrations
│   ├── styles/                 # @/styles      Global CSS
│   ├── types/                  # @/types       Shared TypeScript types
│   └── main.tsx                # Entry point: router + route table
├── index.html
├── vite.config.ts              # Alias (runtime)
├── tsconfig.json
├── tsconfig.app.json           # Alias (type-check / IDE)
├── tsconfig.node.json
├── eslint.config.js
└── package.json
```

---

## 2. Alias Path

One alias: **`@` → `./src`**. Declare it in both files.

**`vite.config.ts`**

```ts
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**`tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Requires `@types/node` (for `path` and `__dirname`).

### Alias map

| Import | Resolves to | Purpose |
| --- | --- | --- |
| `@/assets/*` | `src/assets/*` | Static assets |
| `@/components/common/*` | `src/components/common/*` | App shell |
| `@/components/features/*` | `src/components/features/*` | Feature UI |
| `@/components/ui/*` | `src/components/ui/*` | Reusable primitives |
| `@/hooks/*` | `src/hooks/*` | Custom hooks |
| `@/lib/*` | `src/lib/*` | Helpers |
| `@/pages/*` | `src/pages/*` | Routes and layouts |
| `@/services/*` | `src/services/*` | API layer |
| `@/styles/*` | `src/styles/*` | Global CSS |
| `@/types/*` | `src/types/*` | Shared types |

### Usage

```ts
import "@/styles/global.css";
import AppLayout from "@/pages/guest/layout";
import { Header } from "@/components/common/header";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/cn";
import { getUser } from "@/services/user-service";
import type { User } from "@/types/user";
import logo from "@/assets/logo.svg";
```

Rule: **`@/` for anything crossing folders; relative imports (`./`) only inside the same folder. No `../../`.**

---

## 3. Layer Rules

Dependency direction (upper layers may import lower ones, never the reverse):

```
main.tsx
  └─ pages
       └─ components/features
            └─ components/ui
                 └─ hooks, lib, services, types
```

| Layer | Responsibility | Must not |
| --- | --- | --- |
| `pages/` | Compose feature components for a route | Hold logic or state |
| `components/features/` | Feature UI and local state | Import from `pages/` |
| `components/common/` | Shared app shell | Contain feature-specific content |
| `components/ui/` | Stateless, reusable pieces | Import from `features/` or `pages/` |
| `hooks/` | Reusable stateful logic | Import from `components/` or `pages/` |
| `lib/` | Pure functions | Import React components |
| `services/` | Network / external calls | Import from `components/` or `pages/` |
| `types/` | Type definitions only | Contain runtime code |

---

## 4. Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Files and folders | `kebab-case` | `profile-form.tsx` |
| Page entry | `index.tsx`, default export | `pages/guest/home/index.tsx` |
| Layout | `layout.tsx`, default export | `pages/guest/layout.tsx` |
| Components | Named export, `PascalCase` | `export function Header()` |
| Hooks | `use-*.ts`, `useCamelCase` | `use-debounce.ts` |
| Services | `*-service.ts` | `user-service.ts` |
| Types | Singular noun file | `types/user.ts` |
| Constants | `UPPER_SNAKE_CASE` | `NAV_LINKS` |

---

## 5. Where Does New Code Go?

| Adding... | Location |
| --- | --- |
| New page | `pages/<group>/<page>/index.tsx` + `components/features/<page>/<page>-section.tsx`, then register the route in `main.tsx` |
| Reusable UI element | `components/ui/` |
| Feature-specific component | `components/features/<feature>/` |
| Custom hook | `hooks/use-<name>.ts` |
| Helper function | `lib/<name>.ts` |
| API call | `services/<name>-service.ts` |
| Shared type | `types/<name>.ts` |
| Image / font | `assets/` |
| Static file served as-is | `public/` |
