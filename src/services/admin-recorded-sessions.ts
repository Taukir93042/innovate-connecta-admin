import { type InstructorItem } from './admin-instructors'
import { apiClient } from '@/lib/api-client'

export interface SessionCategoryObj {
  id: number
  name: string
  slug: string
  type?: string
  color?: string
}

export interface RecordedSessionItem {
  id: number
  title: string
  slug: string
  heading?: string | null
  session_category_id?: number | null
  instructor_id?: number | null
  duration?: string | null
  lessons?: string | null
  original_price?: string | null
  discount_price?: string | null
  thumbnail?: string | null
  thumbnail_url?: string | null
  preview_video_url?: string | null
  course_overview?: string | null
  what_you_will_learn?: string | null
  is_featured: boolean
  is_active: boolean
  order_column: number
  category?: SessionCategoryObj | null
  instructor?: InstructorItem | null
  formatted_original_price?: string | null
  formatted_discount_price?: string | null
  created_at?: string
  updated_at?: string
}

export interface RecordedSessionListResponse {
  status: boolean
  message: string
  data: RecordedSessionItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface RecordedSessionSingleResponse {
  status: boolean
  message: string
  data: RecordedSessionItem
}

export const adminRecordedSessionService = {
  async getRecordedSessions(params?: {
    search?: string
    session_category_id?: number
    instructor_id?: number
    is_active?: boolean
    is_featured?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<RecordedSessionListResponse> {
    const response = await apiClient.get<RecordedSessionListResponse>(
      '/admin/recorded-sessions',
      { params }
    )
    return response.data
  },

  async getRecordedSession(id: number | string): Promise<RecordedSessionSingleResponse> {
    const response = await apiClient.get<RecordedSessionSingleResponse>(
      `/admin/recorded-sessions/${id}`
    )
    return response.data
  },

  async createRecordedSession(formData: FormData): Promise<RecordedSessionSingleResponse> {
    const response = await apiClient.post<RecordedSessionSingleResponse>(
      '/admin/recorded-sessions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async updateRecordedSession(
    id: number,
    formData: FormData
  ): Promise<RecordedSessionSingleResponse> {
    const response = await apiClient.post<RecordedSessionSingleResponse>(
      `/admin/recorded-sessions/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async deleteRecordedSession(
    id: number
  ): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/recorded-sessions/${id}`)
    return response.data
  },

  async bulkDeleteRecordedSessions(
    ids: number[]
  ): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.post('/admin/recorded-sessions/bulk-delete', {
      ids,
    })
    return response.data
  },

  async toggleRecordedSessionStatus(
    id: number
  ): Promise<{ status: boolean; message: string; data?: { id: number; is_active: boolean } }> {
    const response = await apiClient.patch(`/admin/recorded-sessions/${id}/toggle-status`)
    return response.data
  },

  async toggleRecordedSessionFeatured(
    id: number
  ): Promise<{ status: boolean; message: string; data?: { id: number; is_featured: boolean } }> {
    const response = await apiClient.patch(`/admin/recorded-sessions/${id}/toggle-featured`)
    return response.data
  },
}
