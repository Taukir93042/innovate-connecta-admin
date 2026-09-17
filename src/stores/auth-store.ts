import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import { adminAuthService, type AdminUser } from '@/services/admin-auth'

const ACCESS_TOKEN = 'admin_access_token'
const USER_KEY = 'admin_user_profile'

export interface AuthUser extends Partial<AdminUser> {
  accountNo?: string
  role?: string[] | string
  exp?: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    fetchProfile: () => Promise<AdminUser | null>
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieToken = getCookie(ACCESS_TOKEN)
  const initToken = cookieToken ? JSON.parse(cookieToken) : ''

  const cookieUser = getCookie(USER_KEY)
  let initUser: AuthUser | null = null
  if (cookieUser) {
    try {
      initUser = JSON.parse(cookieUser)
    } catch {
      initUser = null
    }
  }

  return {
    auth: {
      user: initUser,
      setUser: (user) =>
        set((state) => {
          if (user) {
            setCookie(USER_KEY, JSON.stringify(user))
          } else {
            removeCookie(USER_KEY)
          }
          return { ...state, auth: { ...state.auth, user } }
        }),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          removeCookie(USER_KEY)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
      fetchProfile: async () => {
        const token = get().auth.accessToken
        if (!token) return null
        try {
          const res = await adminAuthService.getProfile()
          if (res.status && res.data?.admin) {
            const admin = res.data.admin
            get().auth.setUser(admin)
            return admin
          }
        } catch {
          // Token might be invalid or expired
        }
        return null
      },
    },
  }
})
