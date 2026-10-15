import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import type { User } from '@/types/user'

export function AuthGuard({
  role,
  children,
}: {
  role: User['role']
  children: ReactNode
}) {
  const session = useSession()
  if (session.isPending)
    return (
      <main className="panel m-8" role="status">
        Checking your session…
      </main>
    )
  if (session.isError)
    return (
      <main className="panel m-8">
        <p role="alert">Cannot check your session. Please retry.</p>
        <Button onClick={() => void session.refetch()}>Retry</Button>
      </main>
    )
  if (!session.data) return <Navigate to="/login" replace />
  if (!session.data.email_verified_at)
    return <Navigate to="/verify-email" replace />
  if (session.data.role !== role)
    return <Navigate to={`/${session.data.role}/dashboard`} replace />
  return children
}
