import apiClient from './client';

export const getFieldOptions = async () => {
  try {
    const response = await apiClient.get('/options/profile-fields');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch field options, fallback to defaults', error);
    return null;
  }
};
