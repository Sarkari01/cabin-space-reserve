import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

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
        // Fetch the API key from Supabase edge function
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');

        if (error) {
          throw new Error(`Failed to fetch API key: ${error.message}`);
        }

        if (!data?.apiKey) {
          throw new Error('Google Maps API key not found in secrets');
        }

        const loader = new Loader({
          apiKey: data.apiKey,
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