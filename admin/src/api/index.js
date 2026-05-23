import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: 'https://api.xianshihuodong.xyz/api',
  timeout: 15000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('coffee_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || '网络请求失败'
    if (err.response?.status === 401) {
      localStorage.removeItem('coffee_token')
      window.location.href = '/login'
    } else {
      ElMessage.error(msg)
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: data => api.post('/auth/login', data),
  getInfo: () => api.get('/auth/info'),
  updatePassword: data => api.put('/auth/password', data),
  updateUsername: data => api.put('/auth/username', data)
}

export const settingsApi = {
  getAll: () => api.get('/settings'),
  uploadQrcode: (type, file) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    return api.post('/settings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: data => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: id => api.delete(`/categories/${id}`)
}

export const productApi = {
  getList: params => api.get('/products', { params }),
  getActive: params => api.get('/products/active', { params }),
  getById: id => api.get(`/products/${id}`),
  create: data => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  toggle: id => api.patch(`/products/${id}/toggle`),
  remove: id => api.delete(`/products/${id}`),
  upload: formData => api.post('/products/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const orderApi = {
  getList: params => api.get('/orders', { params }),
  getById: id => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  delete: id => api.delete(`/orders/${id}`),
  getDashboard: () => api.get('/orders/stats/dashboard')
}

export default api
