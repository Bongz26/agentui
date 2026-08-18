import api from './axios.js'

export const getProducts = () => api.get('/products')
export const getProduct = (id) => api.get(`/products/${id}`)

export const getSupervisorDashboard = () => api.get('/supervisor/dashboard')
export const getSupervisorAgents = () => api.get('/supervisor/agents')
