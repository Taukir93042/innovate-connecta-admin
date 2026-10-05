import { apiClient } from '@/lib/api-client'

export interface ResourceItem {
  id: number
  title: string
  recorded_session_id?: number | null
  session_id?: number | null
  category: string
  file_path: string
  file_name: string
  file_size?: string | null
  file_type?: string | null
  description?: string | null
  download_count: number
  is_active: boolean
  order_column: number
  file_url?: string | null
  created_at?: string
  updated_at?: string
  recorded_session?: {
    id: number
    title: string
    slug: string
  } | null
  session?: {
    id: number
    title: string
    slug: string
  } | null
}

export interface ResourceListResponse {
  status: boolean
  message: string
  data: ResourceItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export const adminResourceService = {
  async getResources(params?: {
    search?: string
    category?: string
    recorded_session_id?: number | string
    is_active?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<ResourceListResponse> {
    const res = await apiClient.get<ResourceListResponse>('/admin/resources', {
      params,
    })
    return res.data
  },

  async getResource(id: number): Promise<{ status: boolean; data: ResourceItem }> {
    const res = await apiClient.get<{ status: boolean; data: ResourceItem }>(
      `/admin/resources/${id}`
    )
    return res.data
  },

  async createResource(formData: FormData): Promise<{ status: boolean; message: string; data: ResourceItem }> {
    const res = await apiClient.post<{ status: boolean; message: string; data: ResourceItem }>(
      '/admin/resources',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return res.data
  },

  async updateResource(
    id: number,
    formData: FormData
  ): Promise<{ status: boolean; message: string; data: ResourceItem }> {
    const res = await apiClient.post<{ status: boolean; message: string; data: ResourceItem }>(
      `/admin/resources/${id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return res.data
  },

  async deleteResource(id: number): Promise<{ status: boolean; message: string }> {
    const res = await apiClient.delete<{ status: boolean; message: string }>(
      `/admin/resources/${id}`
    )
    return res.data
  },

  async bulkDeleteResources(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const res = await apiClient.post<{
      status: boolean
      message: string
      data?: { deleted_count: number }
    }>('/admin/resources/bulk-delete', { ids })
    return res.data
  },

  async toggleResourceStatus(
    id: number
  ): Promise<{ status: boolean; message: string; data: { id: number; is_active: boolean } }> {
    const res = await apiClient.patch<{
      status: boolean
      message: string
      data: { id: number; is_active: boolean }
    }>(`/admin/resources/${id}/toggle-status`)
    return res.data
  },
}
