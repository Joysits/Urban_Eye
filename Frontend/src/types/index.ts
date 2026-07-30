export interface User {
  name: string;
  email: string;
  city: string;
  role: string;
}

export interface AlertMsg {
  message: string;
  type: 'success' | 'error';
}

export interface Zone {
  id: number;
  name: string;
  city: string;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
}

export type ZoneFeature = any;

export interface AnalysisData {
  city: string;
  zone_id: string | null;
  zone_name: string;
  risk_score: number;
  total_incidents: number;
  crime_breakdown: { category: string; count: number }[];
  infrastructure_summary: { type: string; count: number }[];
  population_info: {
    total_population: number | null;
    density: number | null;
    growth_rate: number | null;
  } | null;
  recent_incidents: Array<{
    id: number;
    properties?: { category: string; severity: string; description: string; reported_at: string };
    category?: string;
    severity?: string;
    description?: string;
    reported_at?: string;
  }>;
}

export interface CrimeTrendData {
  city: string;
  months: number;
  trend: Array<{ month: string; category: string; count: number }>;
  month_totals: Array<{ month: string; total: number }>;
}

export interface InfrastructureNearby {
  city: string;
  radius_km: number;
  total: number;
  infrastructure: Array<{ infra_type: string; count: number }>;
}

export interface IncidentPoint {
  id: number;
  lat: number;
  lng: number;
  intensity: number;
  category: string;
  severity: string;
}
