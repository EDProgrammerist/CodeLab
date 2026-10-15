import { WorkspaceShell } from '@/components/common/workspace-shell'
import { AuthGuard } from '@/components/features/auth/auth-guard'

export default function Layout() {
  return (
    <AuthGuard role="instructor">
      <WorkspaceShell role="instructor" />
    </AuthGuard>
  )
}
