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
