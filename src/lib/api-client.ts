import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor: Attach JWT bearer token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().auth.accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: Handle unauthenticated or server errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // If unauthorized and not the login request itself, clear auth state
      const isLoginRequest = error.config?.url?.includes('/admin/login')
      if (!isLoginRequest) {
        useAuthStore.getState().auth.reset()
      }
    }
    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data) {
      const data = error.response.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      if (data.errors) {
        const firstField = Object.keys(data.errors)[0]
        if (firstField && data.errors[firstField]?.length) {
          return data.errors[firstField][0]
        }
      }
      if (typeof data.message === 'string' && data.message.length > 0) {
        return data.message
      }
    }
    if (error.message) {
      return error.message
    }
  }
  return 'An unexpected error occurred. Please try again.'
}
