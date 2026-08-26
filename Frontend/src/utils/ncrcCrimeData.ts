export interface NCRCCrimeCategory {
  category: string;
  originalName: string;
  percentage: number;
  severityWeight: number; // Scale 0.0 - 1.0 based on Statistics Canada CSI & FBI UCR Offense Gravity
}

export interface NCRCCityData {
  cityName: string;
  countyName: string;
  dataSource: string;
  sourceUrl: string;
  reportName: string;
  incidents: NCRCCrimeCategory[];
}

export const NCRC_CITY_DATA: Record<string, NCRCCityData> = {
  Nairobi: {
    cityName: 'Nairobi',
    countyName: 'Nairobi County',
    dataSource: 'National Crime Research Centre (NCRC Kenya)',
    sourceUrl: 'https://crimeresearch.go.ke/nairobi-2/',
    reportName: 'Nairobi County Crime Outlook',
    incidents: [
      { category: 'Illegal Drug Possession', originalName: 'Possession of narcotic drugs', percentage: 55.8, severityWeight: 0.35 },
      { category: 'Stealing & Theft', originalName: 'Stealing', percentage: 53.3, severityWeight: 0.45 },
      { category: 'Illicit Alcohol Possession', originalName: 'Possession of illicit brews', percentage: 49.3, severityWeight: 0.25 },
      { category: 'Public Drunkenness', originalName: 'Being Drunk and Disorderly', percentage: 48.2, severityWeight: 0.25 },
      { category: 'House Burglary', originalName: 'Burglary and House Breaking', percentage: 47.6, severityWeight: 0.55 },
      { category: 'Armed / Violent Robbery', originalName: 'Robbery with Violence', percentage: 44.6, severityWeight: 1.00 },
      { category: 'Domestic & Gender Violence', originalName: 'Gender-Based Violence', percentage: 44.6, severityWeight: 0.75 },
      { category: 'Street Mugging & Robbery', originalName: 'Robbery(Including mugging)', percentage: 36.4, severityWeight: 0.70 },
      { category: 'Child Abuse & Neglect', originalName: 'Child Abuse (including child neglect)', percentage: 27.5, severityWeight: 0.45 },
      { category: 'Physical Assault', originalName: 'Assault Causing Actual Bodily Harm', percentage: 24.7, severityWeight: 0.75 },
      { category: 'Defilement', originalName: 'Defilement', percentage: 24.1, severityWeight: 0.85 },
      { category: 'Murder', originalName: 'Murder', percentage: 23.9, severityWeight: 1.00 },
      { category: 'Rape', originalName: 'Rape', percentage: 23.9, severityWeight: 0.95 },
      { category: 'Livestock Theft', originalName: 'Theft of stock', percentage: 1.3, severityWeight: 0.40 },
    ]
  },
  Mombasa: {
    cityName: 'Mombasa',
    countyName: 'Mombasa County',
    dataSource: 'National Crime Research Centre (NCRC Kenya)',
    sourceUrl: 'https://crimeresearch.go.ke/mombasa/#tab-c72df404bd4008dbd64',
    reportName: 'Mombasa County Crime Outlook',
    incidents: [
      { category: 'Stealing & Theft', originalName: 'Stealing', percentage: 91.4, severityWeight: 0.45 },
      { category: 'Illicit Alcohol Possession', originalName: 'Possession of illicit brews', percentage: 87.0, severityWeight: 0.25 },
      { category: 'Illegal Drug Possession', originalName: 'Possession of narcotic drugs', percentage: 83.3, severityWeight: 0.35 },
      { category: 'Domestic & Gender Violence', originalName: 'Gender-Based Violence', percentage: 82.1, severityWeight: 0.75 },
      { category: 'Child Abuse & Neglect', originalName: 'Child Abuse (including child neglect)', percentage: 80.2, severityWeight: 0.45 },
      { category: 'House Burglary', originalName: 'Burglary and House Breaking', percentage: 78.4, severityWeight: 0.55 },
      { category: 'Physical Assault', originalName: 'Assault Causing Actual Bodily Harm', percentage: 73.5, severityWeight: 0.75 },
      { category: 'Street Mugging & Robbery', originalName: 'Robbery(Including mugging)', percentage: 61.1, severityWeight: 0.70 },
      { category: 'Rape', originalName: 'Rape', percentage: 29.6, severityWeight: 0.95 },
      { category: 'Public Drunkenness', originalName: 'Being Drunk and Disorderly', percentage: 26.5, severityWeight: 0.25 },
      { category: 'Murder', originalName: 'Murder', percentage: 16.0, severityWeight: 1.00 },
      { category: 'Armed / Violent Robbery', originalName: 'Robbery with Violence', percentage: 6.8, severityWeight: 1.00 },
      { category: 'Defilement', originalName: 'Defilement', percentage: 3.7, severityWeight: 0.85 },
    ]
  },
  Eldoret: {
    cityName: 'Eldoret',
    countyName: 'Uasin Gishu County',
    dataSource: 'National Crime Research Centre (NCRC Kenya)',
    sourceUrl: 'https://crimeresearch.go.ke/uasin-gishu/',
    reportName: 'Uasin Gishu County Crime Outlook',
    incidents: [
      { category: 'House Burglary', originalName: 'Burglary and House Breaking', percentage: 84.2, severityWeight: 0.55 },
      { category: 'Stealing & Theft', originalName: 'Stealing', percentage: 84.2, severityWeight: 0.45 },
      { category: 'Illicit Alcohol Possession', originalName: 'Possession of illicit brews', percentage: 72.3, severityWeight: 0.25 },
      { category: 'Defilement', originalName: 'Defilement', percentage: 69.3, severityWeight: 0.85 },
      { category: 'Domestic & Gender Violence', originalName: 'Gender-Based Violence', percentage: 62.4, severityWeight: 0.75 },
      { category: 'Public Drunkenness', originalName: 'Being Drunk and Disorderly', percentage: 59.4, severityWeight: 0.25 },
      { category: 'Illegal Drug Possession', originalName: 'Possession of narcotic drugs', percentage: 50.5, severityWeight: 0.35 },
      { category: 'Child Abuse & Neglect', originalName: 'Child Abuse (including child neglect)', percentage: 49.5, severityWeight: 0.45 },
      { category: 'Armed / Violent Robbery', originalName: 'Robbery with Violence', percentage: 44.6, severityWeight: 1.00 },
      { category: 'Street Mugging & Robbery', originalName: 'Robbery(Including mugging)', percentage: 33.7, severityWeight: 0.70 },
      { category: 'Murder', originalName: 'Murder', percentage: 31.7, severityWeight: 1.00 },
      { category: 'Rape', originalName: 'Rape', percentage: 27.7, severityWeight: 0.95 },
      { category: 'Physical Assault', originalName: 'Assault Causing Actual Bodily Harm', percentage: 27.7, severityWeight: 0.75 },
    ]
  }
};

/**
 * Calculation of the baseline Crime Severity Index from NCRC data
 */
export function calculateCityRiskSeverity(city: string, topCount: number = 6) {
  const normalizedCity = Object.keys(NCRC_CITY_DATA).find(
    c => c.toLowerCase() === city.toLowerCase()
  ) || 'Nairobi';

  const cityData = NCRC_CITY_DATA[normalizedCity];
  const sortedIncidents = [...cityData.incidents].sort((a, b) => b.percentage - a.percentage);
  const topIncidents = sortedIncidents.slice(0, topCount);

  let numeratorSum = 0;
  let denominatorWeightSum = 0;

  for (const item of topIncidents) {
    numeratorSum += item.percentage * item.severityWeight;
    denominatorWeightSum += item.severityWeight;
  }

  const score = denominatorWeightSum > 0 ? Number((numeratorSum / denominatorWeightSum).toFixed(1)) : 0;

  return {
    cityName: cityData.cityName,
    countyName: cityData.countyName,
    dataSource: cityData.dataSource,
    sourceUrl: cityData.sourceUrl,
    reportName: cityData.reportName,
    score,
    topIncidents,
    allIncidents: sortedIncidents,
  };
}


export function calculateSpatialMLRiskSeverity(
  city: string,
  lat?: number | null,
  lng?: number | null,
  radiusKm: number = 5,
  incidentsList: Array<{ lat: number; lng: number; intensity?: number; severity?: string }> = []
) {
  const baseResult = calculateCityRiskSeverity(city, 6);
  const baseScore = baseResult.score;

  if (!lat || !lng || incidentsList.length === 0) {
    return {
      score: baseScore,
      isSpatialML: false,
      modelType: 'NCRC Baseline Model',
      topIncidents: baseResult.topIncidents,
    };
  }

  const sigma = Math.max(1.5, radiusKm / 2); // Spatial decay kernel bandwidth
  const lambda = 0.18; // Spatial weighting coefficient

  let spatialDensitySum = 0;
  let pointCount = 0;

  for (const point of incidentsList) {
    if (!point.lat || !point.lng) continue;
    const distKm = getHaversineDistanceKm(lat, lng, point.lat, point.lng);
    if (distKm <= radiusKm * 1.5) {
      const weight = point.intensity || 0.6;
      const kernelValue = Math.exp(-Math.pow(distKm, 2) / (2 * Math.pow(sigma, 2)));
      spatialDensitySum += weight * kernelValue;
      pointCount++;
    }
  }

  const spatialFactor = pointCount > 0 ? (spatialDensitySum / Math.sqrt(pointCount)) * lambda : 0;
  const rawMLScore = baseScore * (1 + spatialFactor);
  const finalMLScore = Number(Math.min(100, Math.max(10, rawMLScore)).toFixed(1));

  return {
    score: finalMLScore,
    isSpatialML: true,
    modelType: 'Spatial ML Kernel Density (KDE)',
    topIncidents: baseResult.topIncidents,
  };
}

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Official KNBS Economic Survey 2026 (Table 17.2: Crimes Reported to Police by Command Station, 2021-2025)
export interface KNBSCommandStationData {
  commandStation: string;
  cityName: string;
  data: Record<number, number>; // 2021..2025
  fiveYearTotal: number;
  fiveYearAvg: number;
  latestYear: number; // 2025
  pctChange2021To2025: number;
}

export const KNBS_ECONOMIC_SURVEY_2026_CRIMES: Record<string, KNBSCommandStationData> = {
  Nairobi: {
    commandStation: 'Nairobi City Command Station',
    cityName: 'Nairobi',
    data: { 2021: 6686, 2022: 8512, 2023: 11108, 2024: 9717, 2025: 9958 },
    fiveYearTotal: 45981,
    fiveYearAvg: 9196,
    latestYear: 9958,
    pctChange2021To2025: 48.9,
  },
  Mombasa: {
    commandStation: 'Mombasa Command Station',
    cityName: 'Mombasa',
    data: { 2021: 2358, 2022: 2321, 2023: 2671, 2024: 2689, 2025: 2541 },
    fiveYearTotal: 12580,
    fiveYearAvg: 2516,
    latestYear: 2541,
    pctChange2021To2025: 7.8,
  },
  Eldoret: {
    commandStation: 'Uasin Gishu Command Station (Eldoret)',
    cityName: 'Eldoret',
    data: { 2021: 2175, 2022: 2270, 2023: 2325, 2024: 2304, 2025: 2324 },
    fiveYearTotal: 11398,
    fiveYearAvg: 2280,
    latestYear: 2324,
    pctChange2021To2025: 6.9,
  },
  Nakuru: {
    commandStation: 'Nakuru Command Station',
    cityName: 'Nakuru',
    data: { 2021: 4281, 2022: 4514, 2023: 5072, 2024: 4664, 2025: 4719 },
    fiveYearTotal: 23250,
    fiveYearAvg: 4650,
    latestYear: 4719,
    pctChange2021To2025: 10.2,
  },
  Kiambu: {
    commandStation: 'Kiambu Command Station',
    cityName: 'Kiambu',
    data: { 2021: 5715, 2022: 7844, 2023: 9532, 2024: 8865, 2025: 7364 },
    fiveYearTotal: 39320,
    fiveYearAvg: 7864,
    latestYear: 7364,
    pctChange2021To2025: 28.9,
  },
  Machakos: {
    commandStation: 'Machakos Command Station',
    cityName: 'Machakos',
    data: { 2021: 3275, 2022: 3813, 2023: 4780, 2024: 4028, 2025: 4200 },
    fiveYearTotal: 20096,
    fiveYearAvg: 4019,
    latestYear: 4200,
    pctChange2021To2025: 28.2,
  },
  Meru: {
    commandStation: 'Meru Command Station',
    cityName: 'Meru',
    data: { 2021: 5032, 2022: 5698, 2023: 6037, 2024: 5487, 2025: 5534 },
    fiveYearTotal: 27788,
    fiveYearAvg: 5558,
    latestYear: 5534,
    pctChange2021To2025: 10.0,
  },
  Kisii: {
    commandStation: 'Kisii Command Station',
    cityName: 'Kisii',
    data: { 2021: 2822, 2022: 2641, 2023: 3133, 2024: 3012, 2025: 3129 },
    fiveYearTotal: 14737,
    fiveYearAvg: 2947,
    latestYear: 3129,
    pctChange2021To2025: 10.9,
  },
  Kilifi: {
    commandStation: 'Kilifi Command Station',
    cityName: 'Kilifi',
    data: { 2021: 2330, 2022: 2209, 2023: 2342, 2024: 2725, 2025: 2397 },
    fiveYearTotal: 12003,
    fiveYearAvg: 2401,
    latestYear: 2397,
    pctChange2021To2025: 2.9,
  },
  Kwale: {
    commandStation: 'Kwale Command Station',
    cityName: 'Kwale',
    data: { 2021: 901, 2022: 840, 2023: 1094, 2024: 1006, 2025: 936 },
    fiveYearTotal: 4777,
    fiveYearAvg: 955,
    latestYear: 936,
    pctChange2021To2025: 3.9,
  },
  Kenya: {
    commandStation: 'Kenya (National Total)',
    cityName: 'Kenya Total',
    data: { 2021: 81272, 2022: 88083, 2023: 104842, 2024: 101220, 2025: 96038 },
    fiveYearTotal: 471455,
    fiveYearAvg: 94291,
    latestYear: 96038,
    pctChange2021To2025: 18.2,
  },
};

export function getKnbsCrimeDataForCity(cityName: string): KNBSCommandStationData {
  const norm = Object.keys(KNBS_ECONOMIC_SURVEY_2026_CRIMES).find(
    k => k.toLowerCase() === cityName.toLowerCase()
  ) || 'Nairobi';
  return KNBS_ECONOMIC_SURVEY_2026_CRIMES[norm];
}
