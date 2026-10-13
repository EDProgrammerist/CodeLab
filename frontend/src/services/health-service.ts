import { http } from '@/services/http-service'
import type { ApiHealth } from '@/types/api-health'

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await http.get<{ data: ApiHealth }>('/health')
  return response.data.data
}
