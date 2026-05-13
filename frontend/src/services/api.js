import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('erp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  listUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
}

// ── Contacts ─────────────────────────────────────────────────────────
export const contactsApi = {
  list: (params) => api.get('/contacts', { params }),
  get: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  remove: (id) => api.delete(`/contacts/${id}`),
  ledger: (id) => api.get(`/contacts/${id}/ledger`),
}

// ── Items ─────────────────────────────────────────────────────────────
export const itemsApi = {
  list: (params) => api.get('/items', { params }),
  get: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  remove: (id) => api.delete(`/items/${id}`),
  uploadImage: (id, formData) => api.post(`/items/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ── Warehouses ────────────────────────────────────────────────────────
export const warehousesApi = {
  list: () => api.get('/warehouses'),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
}

// ── Inventory ─────────────────────────────────────────────────────────
export const inventoryApi = {
  stockSummary: () => api.get('/inventory/stock'),
  itemStock: (itemId) => api.get(`/inventory/stock/${itemId}`),
  movements: (params) => api.get('/inventory/movements', { params }),
  adjustment: (data) => api.post('/inventory/adjustment', data),
  lowStock: () => api.get('/inventory/low-stock'),
}

// ── Sales ─────────────────────────────────────────────────────────────
export const salesApi = {
  list: (params) => api.get('/sales', { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  confirm: (id) => api.put(`/sales/${id}/confirm`),
  cancel: (id) => api.put(`/sales/${id}/cancel`),
  convert: (id, targetType) => api.post(`/sales/${id}/convert`, { targetType }),
  pdf: (id) => api.get(`/sales/${id}/pdf`, { responseType: 'blob' }),
  priceMemory: (customerId, itemId) => api.get(`/sales/price-memory/${customerId}/${itemId}`),
}

// ── Purchases ─────────────────────────────────────────────────────────
export const purchasesApi = {
  list: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  confirm: (id) => api.put(`/purchases/${id}/confirm`),
  cancel: (id) => api.put(`/purchases/${id}/cancel`),
  convert: (id, targetType) => api.post(`/purchases/${id}/convert`, { targetType }),
  pdf: (id) => api.get(`/purchases/${id}/pdf`, { responseType: 'blob' }),
}

// ── Accounting ────────────────────────────────────────────────────────
export const accountingApi = {
  listAccounts: () => api.get('/accounting/accounts'),
  createAccount: (data) => api.post('/accounting/accounts', data),
  updateAccount: (id, data) => api.put(`/accounting/accounts/${id}`, data),
  listJournal: (params) => api.get('/accounting/journal', { params }),
  getJournal: (id) => api.get(`/accounting/journal/${id}`),
  createJournal: (data) => api.post('/accounting/journal', data),
}

// ── Reports ───────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  balanceSheet: () => api.get('/reports/balance-sheet'),
  stockSummary: () => api.get('/reports/stock-summary'),
  taxReport: (params) => api.get('/reports/tax-report', { params }),
  receivables: () => api.get('/reports/receivables'),
  payables: () => api.get('/reports/payables'),
  salesAnalysis: (params) => api.get('/reports/sales-analysis', { params }),
}

// ── CRM ───────────────────────────────────────────────────────────────
export const crmApi = {
  getProfile: (customerId) => api.get(`/crm/${customerId}/profile`),
  updateProfile: (customerId, data) => api.put(`/crm/${customerId}/profile`, data),
  analytics: (customerId) => api.get(`/crm/${customerId}/analytics`),
}

// ── LSP ───────────────────────────────────────────────────────────────
export const lspApi = {
  list: () => api.get('/lsp'),
  check: (customerId, itemId, price) => api.get('/lsp/check', { params: { customerId, itemId, price } }),
  create: (data) => api.post('/lsp', data),
  delete: (id) => api.delete(`/lsp/${id}`),
}
