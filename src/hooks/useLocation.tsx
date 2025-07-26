import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface UseLocationReturn {
  coordinates: LocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  searchNearbyStudyHalls: (radius?: number) => Promise<any[]>;
}

export const useLocation = (): UseLocationReturn => {
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCoordinates(coords);
    } catch (err) {
      console.error('Error getting location:', err);
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied by user');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable');
            break;
          case err.TIMEOUT:
            setError('Location request timed out');
            break;
          default:
            setError('An unknown error occurred while getting location');
            break;
        }
      } else {
        setError('Failed to get current location');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchNearbyStudyHalls = useCallback(async (radius: number = 10) => {
    if (!coordinates) {
      throw new Error('Location not available');
    }

    try {
      const { data, error } = await supabase.rpc('get_nearby_study_halls_with_monthly_pricing', {
        p_latitude: coordinates.latitude,
        p_longitude: coordinates.longitude,
        p_radius_km: radius,
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching nearby study halls:', err);
      throw err;
    }
  }, [coordinates]);

  return {
    coordinates,
    isLoading,
    error,
    getCurrentLocation,
    searchNearbyStudyHalls,
  };
};