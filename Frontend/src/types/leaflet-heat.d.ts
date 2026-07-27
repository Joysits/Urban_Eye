import * as L from 'leaflet';

declare module 'leaflet' {
  interface HeatLatLng extends Array<number> {
    0: number; // lat
    1: number; // lng
    2?: number; // intensity 0-1
  }

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(latlngs: HeatLatLng[], options?: HeatLayerOptions): Layer;
}
