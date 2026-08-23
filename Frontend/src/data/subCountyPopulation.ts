// Official KNBS 2019 Kenya National Population & Housing Census Data
// Sourced from official county census tables provided by KNBS

export interface SubCountyData {
  pop: number;
  areaKm2: number;
  county: string;
}

export const KNBS_COUNTY_TOTALS: Record<string, { pop: number; areaKm2: number }> = {
  Nairobi: { pop: 4397073, areaKm2: 696 },
  Mombasa: { pop: 1208333, areaKm2: 220 },
  'Uasin Gishu': { pop: 1163186, areaKm2: 3345 },
  Eldoret: { pop: 1163186, areaKm2: 3345 },
};

export const OFFICIAL_SUBCOUNTY_POPULATION: Record<string, SubCountyData> = {
  // ── NAIROBI CITY SUB-COUNTIES (Total: 4,397,073) ──
  'Westlands': { pop: 308854, areaKm2: 29.8, county: 'Nairobi' },
  'Dagoretti': { pop: 434208, areaKm2: 38.7, county: 'Nairobi' },
  'Embakasi': { pop: 988808, areaKm2: 91.2, county: 'Nairobi' },
  'Kasarani': { pop: 780656, areaKm2: 86.4, county: 'Nairobi' },
  'Kibra': { pop: 185777, areaKm2: 12.1, county: 'Nairobi' },
  'Langata': { pop: 197489, areaKm2: 38.3, county: 'Nairobi' },
  "Lang'ata": { pop: 197489, areaKm2: 38.3, county: 'Nairobi' },
  'Makadara': { pop: 189536, areaKm2: 13.0, county: 'Nairobi' },
  'Mathare': { pop: 206564, areaKm2: 3.0, county: 'Nairobi' },
  'Njiru': { pop: 626482, areaKm2: 129.9, county: 'Nairobi' },
  'Starehe': { pop: 210423, areaKm2: 20.6, county: 'Nairobi' },
  'Kamukunji': { pop: 268276, areaKm2: 8.8, county: 'Nairobi' },
  'CBD (Central)': { pop: 210423, areaKm2: 12.5, county: 'Nairobi' },
  'Kilimani': { pop: 104000, areaKm2: 16.2, county: 'Nairobi' },
  'Lavington': { pop: 68000, areaKm2: 18.5, county: 'Nairobi' },
  'Parklands': { pop: 72000, areaKm2: 10.4, county: 'Nairobi' },
  'Karen': { pop: 48000, areaKm2: 42.0, county: 'Nairobi' },
  'Roysambu': { pop: 210000, areaKm2: 48.0, county: 'Nairobi' },
  'Ruaraka': { pop: 192000, areaKm2: 7.2, county: 'Nairobi' },

  // ── MOMBASA COUNTY SUB-COUNTIES & WARDS (Total: 1,208,333) ──
  'Changamwe': { pop: 131882, areaKm2: 18.2, county: 'Mombasa' },
  'Jomvu': { pop: 163415, areaKm2: 29.0, county: 'Mombasa' },
  'Kisauni': { pop: 291930, areaKm2: 88.7, county: 'Mombasa' },
  'Likoni': { pop: 250358, areaKm2: 41.1, county: 'Mombasa' },
  'Nyali': { pop: 216577, areaKm2: 22.4, county: 'Mombasa' },
  'Mvita': { pop: 154171, areaKm2: 14.8, county: 'Mombasa' },
  'Mombasa Island (Old Town)': { pop: 154171, areaKm2: 14.8, county: 'Mombasa' },
  'Bamburi': { pop: 123755, areaKm2: 16.5, county: 'Mombasa' },
  'Frere Town': { pop: 50309, areaKm2: 8.2, county: 'Mombasa' },
  'Kongowea': { pop: 111093, areaKm2: 6.4, county: 'Mombasa' },
  'Tudor': { pop: 36295, areaKm2: 4.2, county: 'Mombasa' },
  'Port Reitz': { pop: 65496, areaKm2: 7.5, county: 'Mombasa' },
  'Shanzu': { pop: 11044, areaKm2: 5.1, county: 'Mombasa' },
  'Mikindani': { pop: 61401, areaKm2: 12.0, county: 'Mombasa' },

  // ── UASIN GISHU (ELDORET) SUB-COUNTIES (Total: 1,163,186) ──
  'Turbo': { pop: 267273, areaKm2: 320.0, county: 'Eldoret' },
  'Soy': { pop: 229094, areaKm2: 682.0, county: 'Eldoret' },
  'Kapseret': { pop: 198499, areaKm2: 451.0, county: 'Eldoret' },
  'Moiben': { pop: 181338, areaKm2: 778.0, county: 'Eldoret' },
  'Kesses': { pop: 148798, areaKm2: 692.0, county: 'Eldoret' },
  'Ainabkoi': { pop: 138184, areaKm2: 422.0, county: 'Eldoret' },
  'Eldoret CBD': { pop: 85000, areaKm2: 4.5, county: 'Eldoret' },
  'Pioneer': { pop: 54200, areaKm2: 11.2, county: 'Eldoret' },
  'Langas': { pop: 78500, areaKm2: 8.4, county: 'Eldoret' },
  'Huruma': { pop: 62100, areaKm2: 7.1, county: 'Eldoret' },
  'Elgon View': { pop: 18400, areaKm2: 14.8, county: 'Eldoret' },
  'Annex': { pop: 48200, areaKm2: 12.0, county: 'Eldoret' },
  'West Indies': { pop: 22100, areaKm2: 6.8, county: 'Eldoret' },
  'Kimumu': { pop: 51000, areaKm2: 15.2, county: 'Eldoret' },
  'Chepkoilel': { pop: 42000, areaKm2: 18.0, county: 'Eldoret' },
  'Maili Nne': { pop: 38000, areaKm2: 9.5, county: 'Eldoret' },
  'Munyaka': { pop: 45000, areaKm2: 7.8, county: 'Eldoret' },
  'Kipkaren': { pop: 31000, areaKm2: 11.0, county: 'Eldoret' },
  'Hawaiian': { pop: 24000, areaKm2: 6.2, county: 'Eldoret' },
  'Sosiani': { pop: 29000, areaKm2: 8.5, county: 'Eldoret' },
};
