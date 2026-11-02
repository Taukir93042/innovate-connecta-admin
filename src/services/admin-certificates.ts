import { apiClient } from '@/lib/api-client'
import { UserItem } from './admin-users'

export interface CertificateItem {
  id: number
  user_id: number
  title: string
  certificate_type: string
  certificate_no: string
  issue_date: string
  file_path?: string | null
  file_name?: string | null
  file_size?: string | null
  thumbnail_path?: string | null
  description?: string | null
  is_active: boolean
  file_url?: string | null
  thumbnail_url?: string | null
  created_at?: string
  updated_at?: string
  user?: UserItem | null
}

export interface CertificateListResponse {
  status: boolean
  message: string
  data: CertificateItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export const adminCertificateService = {
  async getCertificates(params?: {
    search?: string
    user_id?: number | string
    is_active?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<CertificateListResponse> {
    const res = await apiClient.get<CertificateListResponse>(
      '/admin/certificates',
      {
        params,
      }
    )
    return res.data
  },

  async getCertificate(
    id: number
  ): Promise<{ status: boolean; data: CertificateItem }> {
    const res = await apiClient.get<{ status: boolean; data: CertificateItem }>(
      `/admin/certificates/${id}`
    )
    return res.data
  },

  async createCertificate(
    formData: FormData
  ): Promise<{ status: boolean; message: string; data: CertificateItem }> {
    const res = await apiClient.post<{
      status: boolean
      message: string
      data: CertificateItem
    }>('/admin/certificates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  async updateCertificate(
    id: number,
    formData: FormData
  ): Promise<{ status: boolean; message: string; data: CertificateItem }> {
    const res = await apiClient.post<{
      status: boolean
      message: string
      data: CertificateItem
    }>(`/admin/certificates/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  async deleteCertificate(
    id: number
  ): Promise<{ status: boolean; message: string }> {
    const res = await apiClient.delete<{ status: boolean; message: string }>(
      `/admin/certificates/${id}`
    )
    return res.data
  },

  async toggleStatus(
    id: number
  ): Promise<{
    status: boolean
    message: string
    data: { id: number; is_active: boolean }
  }> {
    const res = await apiClient.patch<{
      status: boolean
      message: string
      data: { id: number; is_active: boolean }
    }>(`/admin/certificates/${id}/toggle-status`)
    return res.data
  },
}
