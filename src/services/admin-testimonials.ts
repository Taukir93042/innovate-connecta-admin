import { apiClient } from '@/lib/api-client'

export interface TestimonialItem {
  id: number
  name: string
  designation?: string | null
  review: string
  rating: number
  avatar?: string | null
  is_verified: boolean
  is_featured: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface TestimonialListResponse {
  status: boolean
  message: string
  data: TestimonialItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface TestimonialSingleResponse {
  status: boolean
  message: string
  data: TestimonialItem
}

export const adminTestimonialService = {
  async getTestimonials(params?: {
    search?: string
    is_active?: boolean
    is_featured?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<TestimonialListResponse> {
    const response = await apiClient.get<TestimonialListResponse>(
      '/admin/testimonials',
      { params }
    )
    return response.data
  },

  async getTestimonial(id: number): Promise<TestimonialSingleResponse> {
    const response = await apiClient.get<TestimonialSingleResponse>(
      `/admin/testimonials/${id}`
    )
    return response.data
  },

  async createTestimonial(formData: FormData): Promise<TestimonialSingleResponse> {
    const response = await apiClient.post<TestimonialSingleResponse>(
      '/admin/testimonials',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async updateTestimonial(
    id: number,
    formData: FormData
  ): Promise<TestimonialSingleResponse> {
    const response = await apiClient.post<TestimonialSingleResponse>(
      `/admin/testimonials/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async deleteTestimonial(
    id: number
  ): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/testimonials/${id}`)
    return response.data
  },

  async bulkDeleteTestimonials(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/testimonials/bulk-delete', { ids })
    return response.data
  },

  async toggleStatus(id: number): Promise<{
    status: boolean
    message: string
    data: { id: number; is_active: boolean }
  }> {
    const response = await apiClient.patch(
      `/admin/testimonials/${id}/toggle-status`
    )
    return response.data
  },

  async toggleFeatured(id: number): Promise<{
    status: boolean
    message: string
    data: { id: number; is_featured: boolean }
  }> {
    const response = await apiClient.patch(
      `/admin/testimonials/${id}/toggle-featured`
    )
    return response.data
  },
}
