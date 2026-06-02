import { Linking, Alert, Platform } from 'react-native';

const OSRM_BASE = 'https://router.project-osrm.org';
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export interface RouteGeometry {
  coordinates: [number, number][];
  distance: number;   // meters
  duration: number;   // seconds
}

export interface RouteResult {
  geometry: RouteGeometry;
  legs: Array<{
    distance: number;
    duration: number;
    steps: Array<{
      distance: number;
      duration: number;
      instruction: string;
      name: string;
    }>;
  }>;
}

/**
 * Fetch a driving route from OSRM (Open Source Routing Machine).
 */
export async function fetchRoute(
  origin: [number, number],
  destination: [number, number],
): Promise<RouteResult | null> {
  const [lng1, lat1] = origin;
  const [lng2, lat2] = destination;
  const url = `${OSRM_BASE}/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true&alternatives=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    return {
      geometry: {
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
      },
      legs: route.legs.map((leg: any) => ({
        distance: leg.distance,
        duration: leg.duration,
        steps: (leg.steps || []).map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.maneuver?.instruction || '',
          name: step.name || '',
        })),
      })),
    };
  } catch (err) {
    console.warn('Failed to fetch route:', err);
    return null;
  }
}

/**
 * Format duration (seconds) into a human-readable string.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder > 0 ? `${hrs}h ${remainder}m` : `${hrs}h`;
}

/**
 * Format distance (meters) into a human-readable string.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} mi`;
}

/**
 * Build a GeoJSON FeatureCollection for the route polyline.
 */
export function routeToGeoJSON(coordinates: [number, number][]) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
      },
    ],
  };
}

/**
 * Open turn-by-turn directions in an external navigation app.
 * Tries Google Maps first, falls back to OpenStreetMap directions.
 */
export async function openDirections(
  destination: { lat: number; lng: number; name?: string },
  origin?: { lat: number; lng: number },
) {
  const destParam = `${destination.lat},${destination.lng}`;
  const originParam = origin ? `${origin.lat},${origin.lng}` : undefined;

  // Try Google Maps
  const googleUrl = originParam
    ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;

  // OSM fallback
  const osmUrl = originParam
    ? `https://www.openstreetmap.org/directions?from=${originParam}&to=${destParam}&engine=fossgis_osrm_car`
    : `https://www.openstreetmap.org/directions?to=${destParam}&engine=fossgis_osrm_car`;

  try {
    const canOpenGoogle = await Linking.canOpenURL('https://www.google.com/maps');
    if (canOpenGoogle || Platform.OS === 'android') {
      await Linking.openURL(googleUrl);
    } else {
      await Linking.openURL(osmUrl);
    }
  } catch {
    // Fallback: try OSM directly
    try {
      await Linking.openURL(osmUrl);
    } catch {
      Alert.alert('Navigation', `Navigate to ${destination.name || destParam}`);
    }
  }
}
