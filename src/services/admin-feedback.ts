import { apiClient } from '@/lib/api-client'

export interface FeedbackItem {
  id: number
  name: string
  email: string
  session_name?: string | null
  key_takeaway?: string | null
  suggestions?: string | null
  is_read: boolean
  is_featured: boolean
  created_at?: string
  updated_at?: string
}

export interface FeedbackListResponse {
  status: boolean
  message: string
  data: FeedbackItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface FeedbackSingleResponse {
  status: boolean
  message: string
  data: FeedbackItem
}

export const adminFeedbackService = {
  async getFeedbacks(params?: {
    search?: string
    session_name?: string
    is_read?: boolean
    is_featured?: boolean
    all?: boolean
  }): Promise<FeedbackListResponse> {
    const response = await apiClient.get<FeedbackListResponse>(
      '/admin/feedbacks',
      {
        params: {
          all: true,
          ...params,
        },
      }
    )
    return response.data
  },

  async getFeedback(id: number): Promise<FeedbackSingleResponse> {
    const response = await apiClient.get<FeedbackSingleResponse>(
      `/admin/feedbacks/${id}`
    )
    return response.data
  },

  async toggleFeatured(id: number): Promise<{
    status: boolean
    message: string
    data: { id: number; is_featured: boolean }
  }> {
    const response = await apiClient.patch(
      `/admin/feedbacks/${id}/toggle-featured`
    )
    return response.data
  },

  async deleteFeedback(
    id: number
  ): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/feedbacks/${id}`)
    return response.data
  },

  async bulkDeleteFeedbacks(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/feedbacks/bulk-delete', { ids })
    return response.data
  },
}
