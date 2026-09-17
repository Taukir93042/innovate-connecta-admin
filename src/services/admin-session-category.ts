import { apiClient } from '@/lib/api-client'

export interface SessionCategoryItem {
  id: number
  name: string
  slug: string
  is_active: boolean
  sessions_count?: number
  created_at?: string
  updated_at?: string
}

export interface SessionCategoryListResponse {
  status: boolean
  message: string
  data: SessionCategoryItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export const adminSessionCategoryService = {
  async getCategories(params?: {
    is_active?: boolean
    all?: boolean
    search?: string
    page?: number
    per_page?: number
  }): Promise<SessionCategoryListResponse> {
    const response = await apiClient.get<SessionCategoryListResponse>(
      '/admin/session-categories',
      {
        params,
      }
    )
    return response.data
  },

  async createCategory(payload: {
    name: string
    slug?: string
    is_active?: boolean
  }) {
    const response = await apiClient.post('/admin/session-categories', payload)
    return response.data
  },

  async updateCategory(
    id: number,
    payload: { name?: string; slug?: string; is_active?: boolean }
  ) {
    const response = await apiClient.put(
      `/admin/session-categories/${id}`,
      payload
    )
    return response.data
  },

  async deleteCategory(id: number) {
    const response = await apiClient.delete(`/admin/session-categories/${id}`)
    return response.data
  },

  async toggleStatus(id: number) {
    const response = await apiClient.patch(
      `/admin/session-categories/${id}/toggle-status`
    )
    return response.data
  },
}
