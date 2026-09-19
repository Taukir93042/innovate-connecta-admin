import { apiClient } from '@/lib/api-client'

export interface ContactItem {
  id: number
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  message?: string | null
  is_read: boolean
  created_at?: string
  updated_at?: string
}

export interface ContactListResponse {
  status: boolean
  message: string
  data: ContactItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface ContactSingleResponse {
  status: boolean
  message: string
  data: ContactItem
}

export const adminContactService = {
  async getContacts(params?: {
    search?: string
    is_read?: boolean
    all?: boolean
  }): Promise<ContactListResponse> {
    const response = await apiClient.get<ContactListResponse>(
      '/admin/contacts',
      {
        params: {
          all: true,
          ...params,
        },
      }
    )
    return response.data
  },

  async getContact(id: number): Promise<ContactSingleResponse> {
    const response = await apiClient.get<ContactSingleResponse>(
      `/admin/contacts/${id}`
    )
    return response.data
  },

  async deleteContact(id: number): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/contacts/${id}`)
    return response.data
  },

  async bulkDeleteContacts(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/contacts/bulk-delete', { ids })
    return response.data
  },
}
