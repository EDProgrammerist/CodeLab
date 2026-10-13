import { useApiHealth } from '@/hooks/use-api-health'

export function FoundationSection() {
  const health = useApiHealth()
  const status = health.isPending ? 'Checking connection…' : health.isError ? 'API unavailable' : 'API connected'

  return (
    <section className="max-w-2xl" aria-labelledby="foundation-title">
      <p className="mb-4 text-sm font-medium text-stone-600">Programming laboratory</p>
      <h1 id="foundation-title" className="text-4xl font-semibold tracking-tight sm:text-5xl">A place to learn by doing.</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-700">
        CodeLab brings programming activities, practice, and feedback into one workspace.
      </p>
      <div className="mt-10 rounded-xl border border-black/10 bg-white p-6">
        <h2 className="font-semibold">The foundation is taking shape</h2>
        <p className="mt-2 leading-relaxed text-stone-700">
          This is the setup preview. Classrooms, accounts, and code execution are not available yet.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-black/10 pt-5">
          <p role="status" aria-live="polite" className="text-sm">{status}</p>
          <button type="button" onClick={() => void health.refetch()} disabled={health.isFetching}
            className="rounded-lg bg-[#0075de] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {health.isFetching ? 'Checking…' : 'Check connection'}
          </button>
        </div>
        {health.isError && <p className="mt-3 text-sm text-stone-700">Start the local API, then check the connection again.</p>}
      </div>
    </section>
  )
}
