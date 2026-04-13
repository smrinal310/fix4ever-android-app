// Service area coordinates (center points of cities + 50km radius)
export const SERVICE_AREAS = {
  Bangalore: { lat: 12.9716, lng: 77.5946, radius: 50 },
  Chennai: { lat: 13.0827, lng: 80.2707, radius: 50 },
  Delhi: { lat: 28.7041, lng: 77.1025, radius: 50 },
  Mumbai: { lat: 19.076, lng: 72.8777, radius: 50 },
  Hyderabad: { lat: 17.385, lng: 78.4867, radius: 50 },
  Pune: { lat: 18.5204, lng: 73.8567, radius: 50 },
  Kolkata: { lat: 22.5726, lng: 88.3639, radius: 50 },
  Gurgaon: { lat: 28.4595, lng: 77.0266, radius: 50 },
  Noida: { lat: 28.5355, lng: 77.391, radius: 50 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, radius: 50 },
};

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if a location is within service area
export function isWithinServiceArea(
  lat: number,
  lng: number
): {
  isAvailable: boolean;
  nearestCity?: string;
  distance?: number;
} {
  let nearestCity = '';
  let minDistance = Infinity;

  for (const [cityName, area] of Object.entries(SERVICE_AREAS)) {
    const distance = calculateDistance(lat, lng, area.lat, area.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = cityName;
    }

    // If within service area, return immediately
    if (distance <= area.radius) {
      return {
        isAvailable: true,
        nearestCity: cityName,
        distance: Math.round(distance * 10) / 10,
      };
    }
  }

  return {
    isAvailable: false,
    nearestCity,
    distance: Math.round(minDistance * 10) / 10,
  };
}

// Get service area info for display
export function getServiceAreaInfo(
  lat: number,
  lng: number
): {
  isAvailable: boolean;
  message: string;
  nearestCity?: string;
  distance?: number;
} {
  const result = isWithinServiceArea(lat, lng);

  if (result.isAvailable) {
    return {
      isAvailable: true,
      message: `Service available in ${result.nearestCity}`,
      nearestCity: result.nearestCity,
      distance: result.distance,
    };
  } else {
    return {
      isAvailable: false,
      message: `Service not available at your location. We will come there soon! Nearest service area: ${result.nearestCity} (${result.distance}km away)`,
      nearestCity: result.nearestCity,
      distance: result.distance,
    };
  }
}
