import apiClient from './client';

export const getCrops = async (farmId = null) => {
  const params = farmId ? { farm_id: farmId } : {};
  const response = await apiClient.get('/farmer/crops', { params });
  return response.data;
};

export const createCrop = async (cropData) => {
  const response = await apiClient.post('/farmer/crops', cropData);
  return response.data;
};
