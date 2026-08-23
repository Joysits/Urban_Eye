import L from 'leaflet';
import { FALLBACK_HEIGIT_ROAD_GEOJSON } from '../../data/roadSurfaceGeoJson';

export interface RoadSurfaceLayerOptions {
  map: L.Map;
  customGeoJsonPath?: string; // e.g. '/data/heigit_KE_planet_roadsurface_lines.geojson'
  onLoaded?: (count: number) => void;
}

/**
  Creates and overlays the HDX HeiGIT Kenya Road Surface GeoJSON dataset on a Leaflet map.
 */
export async function addRoadSurfaceLayer({ map, customGeoJsonPath = '/data/heigit_KE_planet_roadsurface_lines.geojson', onLoaded }: RoadSurfaceLayerOptions): Promise<L.GeoJSON> {
  let geoData: any = FALLBACK_HEIGIT_ROAD_GEOJSON;

  try {
    const res = await fetch(customGeoJsonPath);
    if (res.ok) {
      const fetched = await res.json();
      if (fetched && fetched.type === 'FeatureCollection' && Array.isArray(fetched.features)) {
        geoData = fetched;
      }
    }
  } catch {
   
  }

  const parseIsPaved = (props: any): boolean => {
    if (!props) return true;
    if (props.DL_road_class_2024 === 'paved' || props.DL_road_class_2020 === 'paved') return true;
    if (props.OSM_surface_class === 'paved') return true;
    if (props.pred_class === 'paved' || props.combined_surface_osm_priority === 'paved') return true;
    if (props.DL_road_class_2024 === 'unpaved' || props.pred_class === 'unpaved' || props.OSM_surface_class === 'unpaved') return false;
    return true;
  };

  const parseHighway = (props: any): string => {
    return (props?.osm_tags_highway || props?.highway || 'unclassified').toLowerCase();
  };

  const parseHpi = (props: any): number => {
    if (typeof props?.Passability_Numerical_Risk_Score === 'number') return Math.round(props.Passability_Numerical_Risk_Score);
    if (typeof props?.HPI === 'number') return Math.round(props.HPI);
    return parseIsPaved(props) ? 1 : 4;
  };

  const getStyle = (feature?: GeoJSON.Feature<GeoJSON.Geometry, any>): L.PathOptions => {
    const props = feature?.properties;
    const isPaved = parseIsPaved(props);
    const highway = parseHighway(props);

    // Dynamic Line Weight by Highway Classification )
    let weight = 1.2;
    if (highway.includes('motorway') || highway.includes('trunk') || highway.includes('primary')) {
      weight = 3.0;
    } else if (highway.includes('secondary')) {
      weight = 2.2;
    } else if (highway.includes('tertiary')) {
      weight = 1.6;
    }

    // Color paved roads blue/green and unpaved roads brown/orange
    if (isPaved) {
      const color = (highway.includes('motorway') || highway.includes('trunk') || highway.includes('primary')) ? '#2563eb' : '#16a34a';
      return {
        color,
        weight,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      };
    } else {
      const color = (highway.includes('primary') || highway.includes('secondary') || highway.includes('trunk')) ? '#d97706' : '#b45309';
      return {
        color,
        weight,
        opacity: 0.85,
        dashArray: '5, 4',
        lineCap: 'round',
        lineJoin: 'round',
      };
    }
  };

  const getHpiBadge = (hpi: number) => {
    if (hpi <= 2) return { text: 'High Year-Round Passability (All-Weather Access)', color: '#16a34a', bg: '#dcfce7' };
    if (hpi <= 4) return { text: 'Moderate Rainy Season Hazard (Slowed Transit)', color: '#d97706', bg: '#fef3c7' };
    return { text: 'High Wet-Season Impassability (Flood & Mud Vulnerability)', color: '#dc2626', bg: '#fee2e2' };
  };

  const geoJsonLayer = L.geoJSON(geoData, {
    style: getStyle,
    onEachFeature: (feature: GeoJSON.Feature<GeoJSON.Geometry, any>, layer) => {
      const props = feature.properties || {};
      const isPaved = parseIsPaved(props);
      const hpi = parseHpi(props);
      const hpiBadge = getHpiBadge(hpi);
      const roadName = props.name || props.ref || (props.osm_id ? `Way ${props.osm_id.replace('way/', '')}` : 'Kenyan Road Corridor');
      const highwayType = parseHighway(props).replace('_', ' ');

      const popupHtml = `
        <div style="font-family: 'Outfit', sans-serif; padding: 4px 6px; min-width: 230px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; border-bottom: 1px solid rgba(124, 29, 36, 0.2); padding-bottom: 4px;">
            <span style="font-size: 0.88rem; font-weight: 800; color: #7c1d24;">
              📍 ${roadName}
            </span>
          </div>

          <div style="font-size: 0.7rem; color: #7c1d24; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
            ${highwayType} Primary Transit Corridor
          </div>

          <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
            <span style="background: ${isPaved ? '#dbeafe' : '#fef3c7'}; color: ${isPaved ? '#1d4ed8' : '#b45309'}; border: 1px solid ${isPaved ? '#93c5fd' : '#fcd34d'}; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 0.74rem;">
              ${isPaved ? '🛣️ PAVED ROAD (ALL-WEATHER)' : '🚵 UNPAVED ROAD (GRAVEL/EARTH)'}
            </span>
          </div>

          <div style="background: ${hpiBadge.bg}; color: ${hpiBadge.color}; border: 1px solid ${hpiBadge.color}40; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; margin-bottom: 8px; font-family: Inter, sans-serif;">
            HPI Passability Score: ${hpi} / 6 • ${hpiBadge.text}
          </div>

          <div style="font-size: 0.76rem; color: #361216; line-height: 1.5; font-family: Inter, sans-serif;">
            <div><strong>Surface Status:</strong> <span style="font-weight: 700; color: #7c1d24;">${isPaved ? 'Paved Road' : 'Unpaved Road'}</span></div>
            <div><strong>Highway Classification:</strong> <span style="text-transform: capitalize; font-weight: 700;">${highwayType}</span></div>
            ${props.OSM_length ? `<div><strong>Segment Length:</strong> <span style="font-weight: 700;">${(props.OSM_length / 1000).toFixed(2)} km</span></div>` : ''}
          </div>
        </div>
      `;

      layer.bindPopup(popupHtml, { maxWidth: 290, className: 'road-surface-popup' });
      layer.on('mouseover', (e: any) => {
        const target = e.target;
        target.setStyle({ weight: (getStyle(feature).weight as number) + 1.8, opacity: 1 });
      });
      layer.on('mouseout', (e: any) => {
        geoJsonLayer.resetStyle(e.target);
      });
    },
  }).addTo(map);

  if (onLoaded) {
    onLoaded(geoData.features.length);
  }

  return geoJsonLayer;
}
