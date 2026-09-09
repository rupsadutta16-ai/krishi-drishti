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

export const updateCrop = async (cropId, cropData) => {
  const response = await apiClient.put(`/farmer/crops/${cropId}`, cropData);
  return response.data;
};

export const deleteCrop = async (cropId) => {
  const response = await apiClient.delete(`/farmer/crops/${cropId}`);
  return response.data;
};

