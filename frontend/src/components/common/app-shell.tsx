import { Link, Outlet } from 'react-router'

export function AppShell() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link className="text-lg font-semibold tracking-tight" to="/">CodeLab</Link>
        <span className="text-sm text-stone-600">Local development</span>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
        <Outlet />
      </main>
    </>
  )
}
