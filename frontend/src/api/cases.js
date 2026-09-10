import apiClient from './client';

export const createCase = (data) => apiClient.post('/farmer/cases', data);

export const getCases = (params = {}) => apiClient.get('/farmer/cases', { params });

export const getCaseDetail = (caseId) => apiClient.get(`/farmer/cases/${caseId}`);

export const updateCase = (caseId, data) => apiClient.patch(`/farmer/cases/${caseId}`, data);

export const submitCaseToExpert = (caseId, data = {}) =>
  apiClient.post(`/farmer/cases/${caseId}/submit-to-expert`, data);

export const reportObservationToExpert = (observationId) =>
  apiClient.post(`/farmer/observations/${observationId}/report-to-expert`);

export const linkFollowUp = (caseId, observationId) =>
  apiClient.post(`/farmer/cases/${caseId}/follow-up/${observationId}`);

export const addFollowUpObservationWithUpload = (caseId, file, latitude = null, longitude = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (latitude !== null && latitude !== undefined) formData.append('latitude', latitude);
  if (longitude !== null && longitude !== undefined) formData.append('longitude', longitude);

  return apiClient.post(`/farmer/cases/${caseId}/observations`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getCaseHistory = (caseId) =>
  apiClient.get(`/farmer/cases/${caseId}/history`);
