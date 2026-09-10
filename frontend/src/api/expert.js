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
 * @param {number} caseId - Case ID
 * @param {Object} data - Validation data {
 *   validation_result: 'confirmed' | 'corrected' | 'needs_investigation',
 *   corrected_disease?: string,
 *   corrected_pest?: string,
 *   comments?: string,
 *   treatment_recommendation?: string
 * }
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
