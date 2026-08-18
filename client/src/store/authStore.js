import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth.js'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await apiLogin(email, password)
          localStorage.setItem('fieldlink_token', data.accessToken)
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false })
          return data.user
        } catch (err) {
          const msg = err.response?.data?.error || 'Login failed. Please try again.'
          set({ error: msg, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try { await apiLogout() } catch {}
        localStorage.removeItem('fieldlink_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      refreshUser: async () => {
        try {
          const { data } = await getMe()
          set({ user: data.user, isAuthenticated: true })
        } catch {
          localStorage.removeItem('fieldlink_token')
          set({ user: null, token: null, isAuthenticated: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'fieldlink-auth',
      partialize: state => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
