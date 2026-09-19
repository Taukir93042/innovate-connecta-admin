import { apiClient } from '@/lib/api-client'

export interface GalleryCategoryInfo {
  id: number
  name: string
  slug: string
  is_active?: boolean
}

export interface GalleryItem {
  id: number
  gallery_category_id?: number
  title: string
  category?: GalleryCategoryInfo | string | null
  location?: string | null
  image: string
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface GalleryListResponse {
  status: boolean
  message: string
  data: GalleryItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export interface GallerySingleResponse {
  status: boolean
  message: string
  data: GalleryItem
}

export const adminGalleryService = {
  async getGalleries(params?: {
    search?: string
    category?: string
    is_active?: boolean
    page?: number
    per_page?: number
    all?: boolean
  }): Promise<GalleryListResponse> {
    const response = await apiClient.get<GalleryListResponse>('/admin/galleries', {
      params,
    })
    return response.data
  },

  async getGallery(id: number): Promise<GallerySingleResponse> {
    const response = await apiClient.get<GallerySingleResponse>(
      `/admin/galleries/${id}`
    )
    return response.data
  },

  async createGallery(formData: FormData): Promise<GallerySingleResponse> {
    const response = await apiClient.post<GallerySingleResponse>(
      '/admin/galleries',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async updateGallery(
    id: number,
    formData: FormData
  ): Promise<GallerySingleResponse> {
    const response = await apiClient.post<GallerySingleResponse>(
      `/admin/galleries/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async deleteGallery(id: number): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/galleries/${id}`)
    return response.data
  },

  async bulkDeleteGalleries(
    ids: number[]
  ): Promise<{ status: boolean; message: string; data?: { deleted_count: number } }> {
    const response = await apiClient.post('/admin/galleries/bulk-delete', { ids })
    return response.data
  },

  async toggleStatus(id: number): Promise<{
    status: boolean
    message: string
    data: { id: number; is_active: boolean }
  }> {
    const response = await apiClient.patch(`/admin/galleries/${id}/toggle-status`)
    return response.data
  },
}
