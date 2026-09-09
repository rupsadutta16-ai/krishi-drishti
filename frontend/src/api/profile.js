import apiClient from './client';

export const getProfile = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const updateFarmerProfile = async (profileData) => {
  const response = await apiClient.patch('/auth/profile/farmer', profileData);
  return response.data;
};

export const updateExpertProfile = async (profileData) => {
  const response = await apiClient.patch('/auth/profile/expert', profileData);
  return response.data;
};

export const updateOfficialProfile = async (profileData) => {
  const response = await apiClient.patch('/auth/profile/official', profileData);
  return response.data;
};

export const updateUserBasicInfo = async (userData) => {
  const response = await apiClient.patch('/auth/me', userData);
  return response.data;
};

export const updateProfile = async (profileData) => {
  return await updateFarmerProfile(profileData);
};
