import { apiClient } from '@/lib/api-client'

export interface UserItem {
  id: number
  name: string
  email: string
  phone?: string | null
  field?: string | null
  resume_path?: string | null
  resume_url?: string | null
  resume_title?: string | null
  resume_size?: string | null
  resume_updated_at?: string | null
  is_active: boolean
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface UserListResponse {
  status: boolean
  message: string
  data: {
    users: UserItem[]
    pagination?: {
      current_page: number
      per_page: number
      total: number
      last_page: number
    }
  }
}

export const adminUserService = {
  async getUsers(params?: {
    search?: string
    field?: string
    is_active?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<UserListResponse> {
    const response = await apiClient.get<UserListResponse>('/admin/users', {
      params: {
        all: true,
        ...params,
      },
    })
    return response.data
  },

  async getUser(id: number) {
    const response = await apiClient.get(`/admin/users/${id}`)
    return response.data
  },

  async updateUser(
    id: number,
    payload: {
      name?: string
      email?: string
      phone?: string | null
      field?: string | null
      is_active?: boolean
      password?: string
    }
  ) {
    const response = await apiClient.put(`/admin/users/${id}`, payload)
    return response.data
  },

  async toggleStatus(id: number) {
    const response = await apiClient.patch(`/admin/users/${id}/toggle-status`)
    return response.data
  },

  async deleteUser(id: number) {
    const response = await apiClient.delete(`/admin/users/${id}`)
    return response.data
  },
}
