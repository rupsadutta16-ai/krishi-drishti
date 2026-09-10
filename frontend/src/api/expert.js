import apiClient from './client';

export const getExpertReviewQueue = () => apiClient.get('/expert/cases');

export const getExpertCaseDetail = (caseId) => apiClient.get(`/expert/cases/${caseId}`);

export const validateCase = (caseId, data) =>
  apiClient.post(`/expert/cases/${caseId}/validate`, data);
