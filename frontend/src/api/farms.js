import apiClient from './client';

export const getFarms = async () => {
  const response = await apiClient.get('/farmer/farms');
  return response.data;
};

export const createFarm = async (farmData) => {
  const response = await apiClient.post('/farmer/farms', farmData);
  return response.data;
};
