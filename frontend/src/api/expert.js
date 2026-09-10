import apiClient from './client';

/**
 * Get all cases pending expert review
 */
export const getExpertReviewQueue = async () => {
  try {
    const response = await apiClient.get('/expert/cases');
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get detailed information for a specific case
 */
export const getExpertCaseDetail = async (caseId) => {
  try {
    const response = await apiClient.get(`/expert/cases/${caseId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Submit expert validation for a case
 */
export const validateCase = async (caseId, data) => {
  try {
    const response = await apiClient.post(`/expert/cases/${caseId}/validate`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get AI analysis details for an observation
 */
export const getAIAnalysis = async (observationId) => {
  try {
    const response = await apiClient.get(`/expert/observations/${observationId}/ai-analysis`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get weather data for a farm
 */
export const getWeatherData = async (farmId) => {
  try {
    const response = await apiClient.get(`/farmer/farms/${farmId}/weather`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get soil data for a farm
 */
export const getSoilData = async (farmId) => {
  try {
    const response = await apiClient.get(`/farmer/farms/${farmId}/soil`);
    return response;
  } catch (error) {
    throw error;
  }
};

// ── Public Expert Directory ────────────────────────────────────────────────

/**
 * Get all expert public profiles (any authenticated user)
 */
export const getExpertDirectory = async () => {
  const response = await apiClient.get('/expert/directory');
  return response.data;
};

/**
 * Get a single expert's public profile by user ID
 */
export const getExpertPublicProfile = async (expertId) => {
  const response = await apiClient.get(`/expert/directory/${expertId}`);
  return response.data;
};

// ── Farmer Public Profile (for expert view) ────────────────────────────────

/**
 * Get a farmer's public profile — called by experts when reviewing a case
 */
export const getFarmerPublicProfile = async (farmerId) => {
  const response = await apiClient.get(`/expert/farmers/${farmerId}`);
  return response.data;
};
