import { create } from 'zustand'
import { authApi } from '../services/api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('erp_user') || 'null'),
  token: localStorage.getItem('erp_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('erp_token', data.token)
    localStorage.setItem('erp_user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token, loading: false })
    return data.user
  },

  logout: () => {
    localStorage.removeItem('erp_token')
    localStorage.removeItem('erp_user')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'admin',
  isStaff: () => get().user?.role === 'staff',
}))

export default useAuthStore
