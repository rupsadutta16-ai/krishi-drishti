import apiClient from './client';

/**
 * Fetch official dashboard overview statistics.
 */
export async function getOfficialDashboardOverview() {
  const response = await apiClient.get('/official/dashboard/overview');
  return response.data;
}

/**
 * Fetch filterable case list for officials.
 * @param {Object} filters - { status, crop_type, risk_level, case_type, state, district, date_from, date_to, skip, limit }
 */
export async function getOfficialCases(filters = {}) {
  const params = {};
  if (filters.status)     params.status     = filters.status;
  if (filters.crop_type)  params.crop_type  = filters.crop_type;
  if (filters.risk_level) params.risk_level = filters.risk_level;
  if (filters.case_type)  params.case_type  = filters.case_type;
  if (filters.state)      params.state      = filters.state;
  if (filters.district)   params.district   = filters.district;
  if (filters.date_from)  params.date_from  = filters.date_from;
  if (filters.date_to)    params.date_to    = filters.date_to;
  params.skip  = filters.skip  ?? 0;
  params.limit = filters.limit ?? 50;

  const response = await apiClient.get('/official/dashboard/cases', { params });
  return response.data;
}

/**
 * Fetch official case detail.
 * @param {number} caseId
 */
export async function getOfficialCaseDetail(caseId) {
  const response = await apiClient.get(`/official/dashboard/cases/${caseId}`);
  return response.data;
}

/**
 * Step 3 — Farmer report & expert validation monitoring.
 * @param {Object} filters - { validation_result, crop_type, state, district, skip, limit }
 */
export async function getOfficialValidations(filters = {}) {
  const params = {};
  if (filters.validation_result) params.validation_result = filters.validation_result;
  if (filters.crop_type)         params.crop_type         = filters.crop_type;
  if (filters.state)             params.state             = filters.state;
  if (filters.district)          params.district          = filters.district;
  params.skip  = filters.skip  ?? 0;
  params.limit = filters.limit ?? 50;
  const response = await apiClient.get('/official/dashboard/validations', { params });
  return response.data;
}

/**
 * Step 4 — Fetch all expert profiles for officials.
 */
export async function getOfficialExperts() {
  const response = await apiClient.get('/official/experts');
  return response.data;
}

/**
 * Step 4 — Verify or update expert verification status.
 * @param {number} expertId
 * @param {boolean} isVerified
 */
export async function verifyOfficialExpert(expertId, isVerified = true) {
  const response = await apiClient.post(`/official/experts/${expertId}/verify`, { is_verified: isVerified });
  return response.data;
}

/**
 * Step 4 — Geographic Hotspots & Risk Areas
 * @param {Object} filters - { case_type, crop_type, risk_level, state, district, date_from, date_to }
 */
export async function getOfficialHotspots(filters = {}) {
  const params = {};
  if (filters.case_type)  params.case_type  = filters.case_type;
  if (filters.crop_type)  params.crop_type  = filters.crop_type;
  if (filters.risk_level) params.risk_level = filters.risk_level;
  if (filters.state)      params.state      = filters.state;
  if (filters.district)   params.district   = filters.district;
  if (filters.date_from)  params.date_from  = filters.date_from;
  if (filters.date_to)    params.date_to    = filters.date_to;

  const response = await apiClient.get('/official/dashboard/hotspots', { params });
  return response.data;
}

/**
 * Step 5 — Agricultural Trend Analysis.
 * @param {string} period - '7d' | '30d' | '3m' | '6m' | '1y'
 */
export async function getOfficialTrends(period = '30d') {
  const response = await apiClient.get('/official/dashboard/trends', { params: { period } });
  return response.data;
}

/**
 * Step 6 — Weather Forecast for Officials.
 * @param {number} forecastDays - Number of forecast days (1-14)
 */
export async function getOfficialForecast(forecastDays = 5) {
  const response = await apiClient.get('/official/dashboard/forecast', {
    params: { forecast_days: forecastDays },
  });
  return response.data;
}


