import { http } from "@/services/http-service";
export async function readDomain<T>(path: string): Promise<T> {
  return (await http.get<T>(path)).data;
}
export async function writeDomain<T = unknown>(
  path: string,
  method: "post" | "patch" | "put" | "delete",
  data?: unknown,
): Promise<T> {
  await http.get("/sanctum/csrf-cookie", { baseURL: "/" });
  return (await http.request<T>({ url: path, method, data })).data;
}
