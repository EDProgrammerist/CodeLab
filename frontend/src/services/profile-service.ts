import { http } from '@/services/http-service'
import type { User } from '@/types/user'

export async function saveProfile(data: FormData): Promise<User> {
  await http.get('/sanctum/csrf-cookie', { baseURL: '/' })
  return (await http.post<{ data: User }>('/profile', data)).data.data
}
