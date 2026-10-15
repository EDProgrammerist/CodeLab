import axios from 'axios'
import { http } from '@/services/http-service'
import type { User } from '@/types/user'

export async function getSession(): Promise<User | null> {
  try {
    return (await http.get<{ data: User }>('/me')).data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null
    throw error
  }
}
export async function authPost(
  path: string,
  data: Record<string, unknown> = {},
) {
  await http.get('/sanctum/csrf-cookie', { baseURL: '/' })
  return http.post(`/auth/${path}`, data, { baseURL: '/' })
}
export async function getDashboard(role: User['role']): Promise<User> {
  return (await http.get<{ data: User }>(`/${role}/dashboard`)).data.data
}
export function authError(error: unknown): string {
  if (!axios.isAxiosError(error))
    return 'Something went wrong. Please try again.'
  if (error.response?.status === 429)
    return 'Too many attempts. Wait a minute before trying again.'
  if (error.response?.status === 419)
    return 'Your security session expired. Please try again to refresh it.'
  const errors = error.response?.data?.errors as
    Record<string, string[]> | undefined
  return (
    (errors && Object.values(errors).flat()[0]) ||
    error.response?.data?.message ||
    'Cannot reach CodeLab. Check your connection and try again.'
  )
}
