import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession, authPost } from '@/services/auth-service'

export function useSession() {
  const client = useQueryClient()
  const session = useQuery({
    queryKey: ['session'],
    queryFn: getSession,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })
  useEffect(() => {
    const expired = () => {
      client.clear()
      client.setQueryData(['session'], null)
    }
    window.addEventListener('codelab:session-expired', expired)
    return () => window.removeEventListener('codelab:session-expired', expired)
  }, [client])
  return {
    ...session,
    async logout() {
      await authPost('logout')
      client.clear()
      client.setQueryData(['session'], null)
    },
  }
}
