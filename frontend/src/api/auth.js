import apiClient from './client';

/**
 * Register a new user
 * @param {Object} userData - { name, username, email, password, role }
 */
export async function registerUser(userData) {
  const response = await apiClient.post('/auth/register', {
    name: userData.name,
    username: userData.username || userData.email.split('@')[0],
    email: userData.email,
    password: userData.password,
    role: userData.role || 'farmer',
    preferred_language: userData.preferred_language || 'en',
  });
  return response.data;
}

/**
 * Log in a user
 * @param {Object} credentials - { username, password }
 */
export async function loginUser(credentials) {
  // OAuth2PasswordRequestForm in FastAPI expects application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('username', credentials.username || credentials.email);
  params.append('password', credentials.password);

  const response = await apiClient.post('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token, refresh_token } = response.data;
  if (access_token) {
    localStorage.setItem('token', access_token);
  }
  if (refresh_token) {
    localStorage.setItem('refresh_token', refresh_token);
  }
  return response.data;
}

/**
 * Fetch current authenticated user details
 */
export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

/**
 * Log out user
 */
export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
}
