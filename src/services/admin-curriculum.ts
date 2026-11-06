import { apiClient } from '@/lib/api-client'

export interface CourseLessonItem {
  id: number
  course_module_id: number
  recorded_session_id: number
  title: string
  video_url: string
  thumbnail?: string | null
  thumbnail_url?: string | null
  duration?: string | null
  description?: string | null
  is_free_preview: boolean
  order_column: number
  is_active: boolean
  is_locked?: boolean
  created_at?: string
  updated_at?: string
}

export interface CourseModuleItem {
  id: number
  recorded_session_id: number
  title: string
  description?: string | null
  order_column: number
  is_active: boolean
  lessons: CourseLessonItem[]
  created_at?: string
  updated_at?: string
}

export interface CurriculumResponse {
  status: boolean
  message: string
  data: CourseModuleItem[]
}

export const adminCurriculumService = {
  /**
   * Fetch complete curriculum (modules and lessons) for a recorded session.
   */
  async getCurriculum(sessionId: number | string): Promise<CourseModuleItem[]> {
    const res = await apiClient.get<CurriculumResponse>(
      `/admin/recorded-sessions/${sessionId}/curriculum`
    )
    return res.data.data || []
  },

  /**
   * Create a module/chapter.
   */
  async createModule(payload: {
    recorded_session_id: number | string
    title: string
    description?: string
    order_column?: number
  }): Promise<CourseModuleItem> {
    const res = await apiClient.post<{ status: boolean; data: CourseModuleItem }>(
      '/admin/course-modules',
      payload
    )
    return res.data.data
  },

  /**
   * Update a module.
   */
  async updateModule(
    id: number,
    payload: {
      title?: string
      description?: string
      order_column?: number
      is_active?: boolean
    }
  ): Promise<CourseModuleItem> {
    const res = await apiClient.put<{ status: boolean; data: CourseModuleItem }>(
      `/admin/course-modules/${id}`,
      payload
    )
    return res.data.data
  },

  /**
   * Delete a module.
   */
  async deleteModule(id: number): Promise<void> {
    await apiClient.delete(`/admin/course-modules/${id}`)
  },

  /**
   * Create a lesson with optional thumbnail file or URL.
   */
  async createLesson(formData: FormData): Promise<CourseLessonItem> {
    const res = await apiClient.post<{ status: boolean; data: CourseLessonItem }>(
      '/admin/course-lessons',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return res.data.data
  },

  /**
   * Update a lesson with optional thumbnail file or URL.
   */
  async updateLesson(id: number, formData: FormData): Promise<CourseLessonItem> {
    const res = await apiClient.post<{ status: boolean; data: CourseLessonItem }>(
      `/admin/course-lessons/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return res.data.data
  },

  /**
   * Delete a lesson.
   */
  async deleteLesson(id: number): Promise<void> {
    await apiClient.delete(`/admin/course-lessons/${id}`)
  },
}

