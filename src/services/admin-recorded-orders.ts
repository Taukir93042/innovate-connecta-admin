import { apiClient } from '@/lib/api-client'

export interface RecordedOrderItem {
  id: number
  order_id: string
  recorded_session_id?: number | null
  session_title: string
  user_id?: number | null
  name: string
  email: string
  phone: string
  amount: number | string
  original_price?: number | string | null
  payment_method: string
  transaction_id?: string | null
  payment_status: 'completed' | 'pending' | 'refunded' | 'failed' | string
  notes?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
  updated_at?: string
  recorded_session?: {
    id: number
    title: string
    slug: string
    thumbnail?: string | null
    duration_minutes?: number | null
    original_price?: number | string | null
    discount_price?: number | string | null
  } | null
  user?: {
    id: number
    name: string
    email: string
  } | null
}

export interface RecordedOrderStats {
  total_orders: number
  total_revenue: number
  completed_orders: number
  pending_orders: number
  refunded_orders: number
  failed_orders: number
}

export interface RecordedOrderListResponse {
  status: boolean
  message: string
  data: RecordedOrderItem[]
  stats?: RecordedOrderStats
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface RecordedOrderSingleResponse {
  status: boolean
  message: string
  data: RecordedOrderItem
}

export const adminRecordedOrderService = {
  async getOrders(params?: {
    page?: number
    per_page?: number
    search?: string
    payment_status?: string
    payment_method?: string
    recorded_session_id?: number | string
    date_from?: string
    date_to?: string
    all?: boolean
  }): Promise<RecordedOrderListResponse> {
    const response = await apiClient.get<RecordedOrderListResponse>(
      '/admin/recorded-session-orders',
      { params }
    )
    return response.data
  },

  async getOrder(id: number): Promise<RecordedOrderSingleResponse> {
    const response = await apiClient.get<RecordedOrderSingleResponse>(
      `/admin/recorded-session-orders/${id}`
    )
    return response.data
  },

  async updateOrderStatus(
    id: number,
    payment_status: 'completed' | 'pending' | 'refunded' | 'failed',
    notes?: string
  ): Promise<RecordedOrderSingleResponse> {
    const response = await apiClient.patch<RecordedOrderSingleResponse>(
      `/admin/recorded-session-orders/${id}/status`,
      { payment_status, notes }
    )
    return response.data
  },

  async deleteOrder(id: number): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/recorded-session-orders/${id}`)
    return response.data
  },

  async bulkDeleteOrders(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/recorded-session-orders/bulk-delete', { ids })
    return response.data
  },
}
