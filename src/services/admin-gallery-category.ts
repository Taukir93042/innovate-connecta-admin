import { apiClient } from '@/lib/api-client'

export interface GalleryCategoryItem {
  id: number
  name: string
  slug: string
  is_active: boolean
  galleries_count?: number
  created_at?: string
  updated_at?: string
}

export interface GalleryCategoryListResponse {
  status: boolean
  message: string
  data: GalleryCategoryItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export const adminGalleryCategoryService = {
  async getCategories(params?: {
    is_active?: boolean
    all?: boolean
    search?: string
    page?: number
    per_page?: number
  }): Promise<GalleryCategoryListResponse> {
    const response = await apiClient.get<GalleryCategoryListResponse>(
      '/admin/gallery-categories',
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
    const response = await apiClient.post('/admin/gallery-categories', payload)
    return response.data
  },

  async updateCategory(
    id: number,
    payload: { name?: string; slug?: string; is_active?: boolean }
  ) {
    const response = await apiClient.put(
      `/admin/gallery-categories/${id}`,
      payload
    )
    return response.data
  },

  async deleteCategory(id: number) {
    const response = await apiClient.delete(`/admin/gallery-categories/${id}`)
    return response.data
  },

  async bulkDeleteCategories(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/gallery-categories/bulk-delete', { ids })
    return response.data
  },

  async toggleStatus(id: number) {
    const response = await apiClient.patch(
      `/admin/gallery-categories/${id}/toggle-status`
    )
    return response.data
  },
}
