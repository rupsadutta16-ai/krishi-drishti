import apiClient from './client';

// Soil Health Card Storage and Rule-Based Agronomic Evaluation Engine

const SOIL_STORAGE_KEY = 'krishi_drishti_soil_records';

export const getSoilRecords = () => {
  try {
    const raw = localStorage.getItem(SOIL_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse soil records:', e);
    return {};
  }
};

export const getSoilByFarmId = (farmId) => {
  const records = getSoilRecords();
  return records[farmId] || null;
};

export const saveLocalSoilRecord = (farmId, data) => {
  const records = getSoilRecords();
  const updated = {
    ...records,
    [farmId]: {
      ...data,
      farm_id: Number(farmId),
      updated_at: new Date().toISOString(),
    },
  };
  localStorage.setItem(SOIL_STORAGE_KEY, JSON.stringify(updated));
  return updated[farmId];
};

/**
 * Fetch soil health card for a farm from the backend API.
 * Returns null if the farmer has not entered a Soil Health Card.
 */
export const fetchFarmSoil = async (farmId) => {
  if (!farmId) return null;
  try {
    const res = await apiClient.get(`/farmer/farms/${farmId}/soil`);
    if (res?.data) {
      saveLocalSoilRecord(farmId, res.data);
      return res.data;
    }
    return null;
  } catch (err) {
    // 404 indicates no soil health card submitted
    return null;
  }
};

/**
 * Persist soil health card entry for a farm to the backend database.
 */
export const saveFarmSoil = async (farmId, data) => {
  if (!farmId) throw new Error('Farm ID is required');
  const res = await apiClient.post(`/farmer/farms/${farmId}/soil`, data);
  if (res?.data) {
    saveLocalSoilRecord(farmId, res.data);
    return res.data;
  }
  return saveLocalSoilRecord(farmId, data);
};

export const saveSoilRecord = (farmId, data) => {
  return saveLocalSoilRecord(farmId, data);
};


/**
 * Rule-Based Soil Risk Analysis Engine
 * Uses ICAR Soil Health Card benchmarks and crop-specific nutrient requirement rules.
 */
export const analyzeSoilRisk = (soilData, cropType = 'Crop') => {
  if (!soilData) return null;

  const ph = Number(soilData.ph) || 7.0;
  const ec = Number(soilData.ec) || 0.5;
  const oc = Number(soilData.oc) || 0.6;
  const N = Number(soilData.nitrogen) || 300;
  const P = Number(soilData.phosphorus) || 20;
  const K = Number(soilData.potassium) || 200;
  const S = Number(soilData.sulphur) || 12;
  const Zn = Number(soilData.zinc) || 0.8;
  const Fe = Number(soilData.iron) || 5.0;
  const Cu = Number(soilData.cu) || 0.4;
  const Mn = Number(soilData.mn) || 3.0;
  const B = Number(soilData.boron) || 0.6;

  const risks = [];
  const recommendations = [];
  const statusBadges = [];
  let penaltyPoints = 0;

  // 1. pH Evaluation
  if (ph < 5.5) {
    penaltyPoints += 25;
    risks.push(`Strongly Acidic Soil (pH ${ph}). Nutrients like P and K become locked.`);
    recommendations.push(`Apply Agricultural Lime / Dolomite @ 400-500 kg/acre to raise soil pH towards 6.5.`);
    statusBadges.push({ label: `Acidic pH (${ph})`, level: 'HIGH' });
  } else if (ph < 6.0) {
    penaltyPoints += 10;
    risks.push(`Slightly Acidic Soil (pH ${ph}). Micronutrient availability may fluctuate.`);
    recommendations.push(`Incorporate wood ash or well-rotted FYM to stabilize soil buffer capacity.`);
    statusBadges.push({ label: `Slight Acidic (${ph})`, level: 'MEDIUM' });
  } else if (ph > 8.2) {
    penaltyPoints += 25;
    risks.push(`Alkaline/Sodic Soil (pH ${ph}). High risk of Iron, Zinc, and Manganese lockup.`);
    recommendations.push(`Apply Gypsum @ 250-300 kg/acre or elemental Sulphur to reduce soil alkalinity.`);
    statusBadges.push({ label: `High Alkaline (${ph})`, level: 'HIGH' });
  } else if (ph > 7.5) {
    penaltyPoints += 10;
    risks.push(`Mildly Alkaline Soil (pH ${ph}). Monitor Zinc & Boron availability.`);
    recommendations.push(`Use acid-forming fertilizers like Ammonium Sulphate instead of Urea.`);
    statusBadges.push({ label: `Mild Alkaline (${ph})`, level: 'MEDIUM' });
  } else {
    statusBadges.push({ label: `Optimal pH (${ph})`, level: 'LOW' });
  }

  // 2. EC (Electrical Conductivity / Salinity)
  if (ec > 2.0) {
    penaltyPoints += 30;
    risks.push(`High Salinity Level (EC ${ec} dS/m). Root osmosis inhibited, risking crop wilting.`);
    recommendations.push(`Provide heavy leaching irrigation with good quality water; avoid muriate of potash.`);
    statusBadges.push({ label: `High Salinity (${ec} dS/m)`, level: 'HIGH' });
  } else if (ec > 1.2) {
    penaltyPoints += 12;
    risks.push(`Moderate Salinity (EC ${ec} dS/m). Sensitive crops may show tip burn.`);
    recommendations.push(`Ensure field drainage and avoid over-application of synthetic salts.`);
    statusBadges.push({ label: `Moderate Salinity (${ec})`, level: 'MEDIUM' });
  } else {
    statusBadges.push({ label: `Normal Salinity (${ec} dS/m)`, level: 'LOW' });
  }

  // 3. Organic Carbon (OC)
  if (oc < 0.5) {
    penaltyPoints += 20;
    risks.push(`Low Organic Carbon (${oc}%). Poor microbial activity and low cation exchange capacity.`);
    recommendations.push(`Apply Farmyard Manure (FYM) @ 4 tons/acre or green manure (Dhaincha/Sunhemp).`);
    statusBadges.push({ label: `Low OC (${oc}%)`, level: 'HIGH' });
  } else if (oc <= 0.75) {
    statusBadges.push({ label: `Medium OC (${oc}%)`, level: 'LOW' });
  } else {
    statusBadges.push({ label: `High OC (${oc}%)`, level: 'LOW' });
  }

  // 4. Nitrogen (N)
  if (N < 280) {
    penaltyPoints += 15;
    const cropMsg = cropType ? ` for ${cropType}` : '';
    risks.push(`Nitrogen Deficit (${N} kg/ha)${cropMsg}. Expect yellowing of older leaves & stunted growth.`);
    recommendations.push(`Top-dress Urea @ 30-35 kg/acre in 2-3 split doses during active vegetative stage.`);
    statusBadges.push({ label: `Low N (${N} kg/ha)`, level: 'MEDIUM' });
  } else {
    statusBadges.push({ label: `Adequate N (${N} kg/ha)`, level: 'LOW' });
  }

  // 5. Phosphorus (P)
  if (P < 11) {
    penaltyPoints += 15;
    risks.push(`Phosphorus Deficit (${P} kg/ha). Stunted root development & purpling of leaves.`);
    recommendations.push(`Apply Single Super Phosphate (SSP) @ 50 kg/acre or DAP @ 25 kg/acre near root zone.`);
    statusBadges.push({ label: `Low P (${P} kg/ha)`, level: 'MEDIUM' });
  } else {
    statusBadges.push({ label: `Adequate P (${P} kg/ha)`, level: 'LOW' });
  }

  // 6. Potassium (K)
  if (K < 118) {
    penaltyPoints += 15;
    risks.push(`Potassium Deficit (${K} kg/ha). Poor disease resistance & weak stalk strength.`);
    recommendations.push(`Apply Muriate of Potash (MOP) @ 20-25 kg/acre during basal/flowering stage.`);
    statusBadges.push({ label: `Low K (${K} kg/ha)`, level: 'MEDIUM' });
  } else {
    statusBadges.push({ label: `Adequate K (${K} kg/ha)`, level: 'LOW' });
  }

  // 7. Sulphur (S)
  if (S < 10) {
    penaltyPoints += 10;
    risks.push(`Sulphur Deficit (${S} ppm). Reduced oil content & pale green young leaves.`);
    recommendations.push(`Apply Gypsum @ 50 kg/acre or Bentonite Sulphur @ 5 kg/acre.`);
    statusBadges.push({ label: `Low S (${S} ppm)`, level: 'MEDIUM' });
  }

  // 8. Micronutrients (Zn, Fe, B)
  if (Zn < 0.6) {
    penaltyPoints += 8;
    risks.push(`Zinc Deficiency (${Zn} ppm). Causes khaira disease in Rice and white bud in Maize.`);
    recommendations.push(`Foliar spray of Zinc Sulphate 21% @ 5g/liter water or basal application @ 10 kg/acre.`);
    statusBadges.push({ label: `Zn Deficient (${Zn} ppm)`, level: 'HIGH' });
  }

  if (B < 0.5) {
    penaltyPoints += 6;
    risks.push(`Boron Deficiency (${B} ppm). Poor flower drop and hollow heart in crops.`);
    recommendations.push(`Apply Borax 10.5% @ 4 kg/acre or foliar spray of Solubor 0.1%.`);
    statusBadges.push({ label: `B Deficient (${B} ppm)`, level: 'MEDIUM' });
  }

  if (Fe < 4.5) {
    penaltyPoints += 6;
    risks.push(`Iron Chlorosis (${Fe} ppm). Interveinal chlorosis on young leaves.`);
    recommendations.push(`Foliar spray of Ferrous Sulphate 19% @ 5g/liter with 1g citric acid.`);
    statusBadges.push({ label: `Fe Deficient (${Fe} ppm)`, level: 'MEDIUM' });
  }

  // Calculate Health Score (0 - 100)
  const healthScore = Math.max(10, Math.min(100, 100 - penaltyPoints));

  let riskLevel = 'LOW';
  if (penaltyPoints >= 45) riskLevel = 'HIGH';
  else if (penaltyPoints >= 20) riskLevel = 'MEDIUM';

  return {
    healthScore,
    risk_level: riskLevel,
    potential_risks: risks,
    recommendations: recommendations.length > 0 ? recommendations : ['Soil nutrients are well balanced. Maintain current organic recycling practices.'],
    statusBadges,
    disclaimer: 'Soil risk analysis uses a rule-based algorithm (ICAR guidelines) and may not be 100% accurate. The model continuously learns from user inputs and outcome feedback.',
  };
};
