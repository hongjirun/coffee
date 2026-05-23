import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('coffee_token') || '',
    admin: null
  }),
  getters: {
    isLoggedIn: state => !!state.token
  },
  actions: {
    async login(username, password) {
      const res = await authApi.login({ username, password })
      this.token = res.data.token
      this.admin = res.data.admin
      localStorage.setItem('coffee_token', res.data.token)
    },
    async fetchInfo() {
      const res = await authApi.getInfo()
      this.admin = res.data
    },
    logout() {
      this.token = ''
      this.admin = null
      localStorage.removeItem('coffee_token')
    },
    updateAdmin(data) {
      if (this.admin) {
        Object.assign(this.admin, data)
      }
    }
  }
})
