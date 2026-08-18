import api from './axios.js'

export const getApplications = (params = {}) =>
  api.get('/applications', { params })

export const createApplication = (data = {}) =>
  api.post('/applications', data)

export const getApplication = (id) =>
  api.get(`/applications/${id}`)

export const updateApplication = (id, data) =>
  api.patch(`/applications/${id}`, data)

export const submitApplication = (id) =>
  api.post(`/applications/${id}/submit`)

export const updateApplicationStatus = (id, status, note) =>
  api.patch(`/applications/${id}/status`, { status, note })

export const getStatusHistory = (id) =>
  api.get(`/applications/${id}/status-history`)

// Dependants
export const getDependants = (appId) =>
  api.get(`/applications/${appId}/dependants`)

export const addDependant = (appId, data) =>
  api.post(`/applications/${appId}/dependants`, data)

export const updateDependant = (appId, depId, data) =>
  api.patch(`/applications/${appId}/dependants/${depId}`, data)

export const removeDependant = (appId, depId) =>
  api.delete(`/applications/${appId}/dependants/${depId}`)

// Documents
export const getDocuments = (appId) =>
  api.get(`/applications/${appId}/documents`)

export const uploadDocument = (appId, documentType, file, onProgress) => {
  const form = new FormData()
  form.append('documentType', documentType)
  form.append('file', file)
  return api.post(`/applications/${appId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  })
}

export const deleteDocument = (appId, docId) =>
  api.delete(`/applications/${appId}/documents/${docId}`)

export const getDocumentUrl = (docId) =>
  `/api/documents/${docId}/download`
