import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach stored access token if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fieldlink_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — try token refresh on 401
let isRefreshing = false
let failQueue = []

function processQueue(error, token = null) {
  failQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (
      err.response?.status === 401 &&
      err.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failQueue.push({
            resolve: token => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            },
            reject,
          })
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        localStorage.setItem('fieldlink_token', data.accessToken)
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('fieldlink_token')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
