import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

// This should be replaced with the actual API key from Supabase secrets
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE'; // Replace with actual key

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
  maps: typeof google.maps | null;
}

export const useGoogleMaps = (): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [maps, setMaps] = useState<typeof google.maps | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry'],
        });

        await loader.load();
        setMaps(google.maps);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load Google Maps');
      }
    };

    if (!isLoaded && !loadError) {
      loadGoogleMaps();
    }
  }, [isLoaded, loadError]);

  return { isLoaded, loadError, maps };
};