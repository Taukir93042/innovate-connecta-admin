import { apiClient } from '@/lib/api-client'

export interface SessionImageItem {
  id: number
  session_id: number
  image: string
  image_url?: string | null
  is_primary: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface InfoCardItem {
  title: string
  description: string
}

export interface SessionCategoryObj {
  id: number
  name: string
  slug: string
}

export interface SessionItem {
  id: number
  title: string
  slug: string
  session_category_id?: number | null
  category?: string | SessionCategoryObj | null
  section_one_content: string
  section_two_content?: string | null
  info_cards?: InfoCardItem[] | null
  is_featured: boolean
  is_active: boolean
  image_url?: string | null
  short_description?: string
  images?: SessionImageItem[]
  created_at?: string
  updated_at?: string
}

export function getCategoryName(
  category: string | SessionCategoryObj | null | undefined
): string {
  if (!category) return 'General'
  if (typeof category === 'object' && 'name' in category) {
    return category.name || 'General'
  }
  return String(category)
}

export interface SessionListResponse {
  status: boolean
  message: string
  data: SessionItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface SessionSingleResponse {
  status: boolean
  message: string
  data: SessionItem
}

export const adminSessionService = {
  async getSessions(params?: {
    search?: string
    category?: string
    is_active?: boolean
    is_featured?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<SessionListResponse> {
    const response = await apiClient.get<SessionListResponse>(
      '/admin/sessions',
      { params }
    )
    return response.data
  },

  async getSession(id: number | string): Promise<SessionSingleResponse> {
    const response = await apiClient.get<SessionSingleResponse>(
      `/admin/sessions/${id}`
    )
    return response.data
  },

  async createSession(formData: FormData): Promise<SessionSingleResponse> {
    const response = await apiClient.post<SessionSingleResponse>(
      '/admin/sessions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async updateSession(
    id: number,
    formData: FormData
  ): Promise<SessionSingleResponse> {
    const response = await apiClient.post<SessionSingleResponse>(
      `/admin/sessions/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async deleteSession(
    id: number
  ): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/sessions/${id}`)
    return response.data
  },

  async toggleStatus(id: number): Promise<{
    status: boolean
    message: string
    data: { id: number; is_active: boolean }
  }> {
    const response = await apiClient.patch(
      `/admin/sessions/${id}/toggle-status`
    )
    return response.data
  },

  async toggleFeatured(id: number): Promise<{
    status: boolean
    message: string
    data: { id: number; is_featured: boolean }
  }> {
    const response = await apiClient.patch(
      `/admin/sessions/${id}/toggle-featured`
    )
    return response.data
  },

  async deleteSessionImage(
    sessionId: number,
    imageId: number
  ): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(
      `/admin/sessions/${sessionId}/images/${imageId}`
    )
    return response.data
  },
}
