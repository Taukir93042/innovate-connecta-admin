import { apiClient } from '@/lib/api-client'

export interface AdminUser {
  id: number
  name: string
  email: string
  phone?: string | null
  created_at?: string
  updated_at?: string
}

export interface AdminLoginCredentials {
  email: string
  password: string
}

export interface AdminLoginResponse {
  status: boolean
  message: string
  data: {
    admin: AdminUser
    token_type: string
    token: string
    expires_in: number
  }
}

export interface AdminProfileResponse {
  status: boolean
  message: string
  data: {
    admin: AdminUser
  }
}

export interface UpdateAdminProfilePayload {
  name: string
  email: string
  phone?: string | null
}

export interface ChangeAdminPasswordPayload {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export interface AdminBaseResponse {
  status: boolean
  message: string
  data?: unknown
}

export const adminAuthService = {
  /**
   * Log in admin with email & password and receive JWT token
   */
  async login(credentials: AdminLoginCredentials): Promise<AdminLoginResponse> {
    const response = await apiClient.post<AdminLoginResponse>(
      '/admin/login',
      credentials
    )
    return response.data
  },

  /**
   * Retrieve current authenticated admin profile
   */
  async getProfile(): Promise<AdminProfileResponse> {
    const response = await apiClient.get<AdminProfileResponse>('/admin/profile')
    return response.data
  },

  /**
   * Update admin profile details (name, email, phone)
   */
  async updateProfile(
    payload: UpdateAdminProfilePayload
  ): Promise<AdminProfileResponse> {
    const response = await apiClient.put<AdminProfileResponse>(
      '/admin/profile',
      payload
    )
    return response.data
  },

  /**
   * Change admin password
   */
  async changePassword(
    payload: ChangeAdminPasswordPayload
  ): Promise<AdminBaseResponse> {
    const response = await apiClient.post<AdminBaseResponse>(
      '/admin/change-password',
      payload
    )
    return response.data
  },

  /**
   * Invalidate JWT token on server
   */
  async logout(): Promise<AdminBaseResponse> {
    const response = await apiClient.post<AdminBaseResponse>('/admin/logout')
    return response.data
  },

  /**
   * Refresh JWT token
   */
  async refresh(): Promise<AdminLoginResponse> {
    const response = await apiClient.post<AdminLoginResponse>('/admin/refresh')
    return response.data
  },
}
