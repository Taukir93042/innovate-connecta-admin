import { apiClient } from '@/lib/api-client'

export interface InstructorItem {
  id: number
  name: string
  designation?: string | null
  experience?: string | null
  bio?: string | null
  image?: string | null
  image_url?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface InstructorListResponse {
  status: boolean
  message: string
  data: InstructorItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface InstructorSingleResponse {
  status: boolean
  message: string
  data: InstructorItem
}

export const adminInstructorService = {
  async getInstructors(params?: {
    search?: string
    is_active?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<InstructorListResponse> {
    const response = await apiClient.get<InstructorListResponse>(
      '/admin/instructors',
      { params }
    )
    return response.data
  },

  async getInstructor(id: number | string): Promise<InstructorSingleResponse> {
    const response = await apiClient.get<InstructorSingleResponse>(
      `/admin/instructors/${id}`
    )
    return response.data
  },

  async createInstructor(formData: FormData): Promise<InstructorSingleResponse> {
    const response = await apiClient.post<InstructorSingleResponse>(
      '/admin/instructors',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async updateInstructor(
    id: number,
    formData: FormData
  ): Promise<InstructorSingleResponse> {
    const response = await apiClient.post<InstructorSingleResponse>(
      `/admin/instructors/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async deleteInstructor(
    id: number
  ): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/instructors/${id}`)
    return response.data
  },

  async bulkDeleteInstructors(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/instructors/bulk-delete', { ids })
    return response.data
  },

  async toggleStatus(id: number): Promise<{
    status: boolean
    message: string
    data: { id: number; is_active: boolean }
  }> {
    const response = await apiClient.patch(
      `/admin/instructors/${id}/toggle-status`
    )
    return response.data
  },
}
