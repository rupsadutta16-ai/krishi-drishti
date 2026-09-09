import apiClient from './client';

/**
 * Create a new observation with an uploaded crop image file.
 * @param {FormData} formData - Contains farm_id, crop_id, file, latitude, longitude
 */
export const createObservation = async (formData) => {
  const response = await apiClient.post('/farmer/observations', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Trigger AI pathology & health analysis for an observation.
 * @param {number} observationId
 * @param {Object} [payload] - Optional context and model_version
 */
export const runAIAnalysis = async (observationId, payload = {}) => {
  const response = await apiClient.post(`/farmer/observations/${observationId}/analyze`, payload);
  return response.data;
};

/**
 * Fetch list of observations.
 * @param {Object} [params] - { farm_id, crop_id, status }
 */
export const getObservations = async (params = {}) => {
  const response = await apiClient.get('/farmer/observations', { params });
  return response.data;
};

/**
 * Fetch single observation details.
 * @param {number} observationId
 */
export const getObservationDetails = async (observationId) => {
  const response = await apiClient.get(`/farmer/observations/${observationId}`);
  return response.data;
};

/**
 * Fetch list of AI analysis records for an observation.
 * @param {number} observationId
 */
export const getAIAnalyses = async (observationId) => {
  const response = await apiClient.get(`/farmer/observations/${observationId}/analyses`);
  return response.data;
};

/**
 * Fetch latest AI analysis record for an observation.
 * @param {number} observationId
 */
export const getLatestAIAnalysis = async (observationId) => {
  const response = await apiClient.get(`/farmer/observations/${observationId}/analyses/latest`);
  return response.data;
};

/**
 * Fetch weather-based risk analysis for a crop plot based on lat/long.
 * @param {Object} payload - { latitude, longitude, crop_type }
 */
export const analyzeWeatherRisk = async (payload) => {
  const response = await apiClient.post('/farmer/weather/risk-analysis', payload);
  return response.data;
};
