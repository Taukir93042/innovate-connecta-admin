import { apiClient } from '@/lib/api-client'

export interface SessionBookingItem {
  id: number
  session_id?: number | null
  session_title?: string | null
  name: string
  email: string
  phone: string
  institute: string
  course: string
  semester: string
  status: 'pending' | 'confirmed' | 'cancelled' | string
  notes?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
  updated_at?: string
  session?: {
    id: number
    title: string
    slug: string
  } | null
}

export interface SessionBookingListResponse {
  status: boolean
  message: string
  data: SessionBookingItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface SessionBookingSingleResponse {
  status: boolean
  message: string
  data: SessionBookingItem
}

export const adminSessionBookingService = {
  async getBookings(params?: {
    page?: number
    per_page?: number
    search?: string
    status?: string
    session_id?: number | string
    all?: boolean
  }): Promise<SessionBookingListResponse> {
    const response = await apiClient.get<SessionBookingListResponse>(
      '/admin/session-bookings',
      {
        params,
      }
    )
    return response.data
  },

  async getBooking(id: number): Promise<SessionBookingSingleResponse> {
    const response = await apiClient.get<SessionBookingSingleResponse>(
      `/admin/session-bookings/${id}`
    )
    return response.data
  },

  async updateBookingStatus(
    id: number,
    status: 'pending' | 'confirmed' | 'cancelled',
    notes?: string
  ): Promise<SessionBookingSingleResponse> {
    const response = await apiClient.patch<SessionBookingSingleResponse>(
      `/admin/session-bookings/${id}/status`,
      { status, notes }
    )
    return response.data
  },

  async deleteBooking(id: number): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/session-bookings/${id}`)
    return response.data
  },

  async bulkDeleteBookings(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/session-bookings/bulk-delete', { ids })
    return response.data
  },
}
