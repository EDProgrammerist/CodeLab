import axios from 'axios'

export const http = axios.create({
  baseURL: '/api/v1',
  timeout: 10_000,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/me')
      window.dispatchEvent(new Event('codelab:session-expired'))
    return Promise.reject(error)
  },
)
