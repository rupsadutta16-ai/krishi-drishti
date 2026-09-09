import apiClient from './client';

export const getFarms = async () => {
  const response = await apiClient.get('/farmer/farms');
  return response.data;
};

export const createFarm = async (farmData) => {
  const response = await apiClient.post('/farmer/farms', farmData);
  return response.data;
};

export const updateFarm = async (farmId, farmData) => {
  const response = await apiClient.patch(`/farmer/farms/${farmId}`, farmData);
  return response.data;
};

export const toggleFarmSensor = async (farmId) => {
  try {
    const response = await apiClient.post(`/farmer/farms/${farmId}/toggle-sensor`);
    return response.data;
  } catch (e) {
    console.warn('Fallback local sensor toggle:', e);
    return null;
  }
};

export const deleteFarm = async (farmId) => {
  const response = await apiClient.delete(`/farmer/farms/${farmId}`);
  return response.data;
};
