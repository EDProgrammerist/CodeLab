import { http } from '@/services/http-service';
import type { Evaluation } from '@/types/assessment';
export async function sendEvaluation(path: string, data: unknown, key: string): Promise<Evaluation> {
 await http.get('/sanctum/csrf-cookie', { baseURL: '/' });
 return (await http.post<{ data: Evaluation }>(path, data, { headers: { 'Idempotency-Key': key } })).data.data;
}
