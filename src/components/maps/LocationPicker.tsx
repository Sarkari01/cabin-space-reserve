import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { geocodeAddress, reverseGeocode } from '@/utils/locationUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  className = '',
}) => {
  const { isLoaded, loadError, maps } = useGoogleMaps();
  const { toast } = useToast();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(initialLocation || null);

  const initializeMap = useCallback(() => {
    if (!maps || !mapRef.current) return;

    const defaultCenter = currentLocation 
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

    const map = new maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Create marker
    const marker = new maps.Marker({
      position: defaultCenter,
      map,
      draggable: true,
      title: 'Study Hall Location',
    });

    markerRef.current = marker;

    // Set up autocomplete
    if (searchInputRef.current) {
      const autocomplete = new maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'formatted_address'],
        types: ['establishment', 'geocode'],
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const location = place.geometry.location;
          const newLocation: LocationData = {
            latitude: location.lat(),
            longitude: location.lng(),
            formattedAddress: place.formatted_address || '',
          };
          
          updateLocation(newLocation);
        }
      });
    }

    // Handle marker drag
    marker.addListener('dragend', async () => {
      const position = marker.getPosition();
      if (position) {
        const geocoder = new maps.Geocoder();
        try {
          const address = await reverseGeocode(position.lat(), position.lng(), geocoder);
          const newLocation: LocationData = {
            latitude: position.lat(),
            longitude: position.lng(),
            formattedAddress: address || '',
          };
          updateLocation(newLocation);
        } catch (error) {
          console.error('Error getting address:', error);
        }
      }
    });

    // Handle map click
    map.addListener('click', async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const geocoder = new maps.Geocoder();
        try {
          const address = await reverseGeocode(event.latLng.lat(), event.latLng.lng(), geocoder);
          const newLocation: LocationData = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
            formattedAddress: address || '',
          };
          updateLocation(newLocation);
        } catch (error) {
          console.error('Error getting address:', error);
        }
      }
    });
  }, [maps, currentLocation]);

  const updateLocation = (location: LocationData) => {
    setCurrentLocation(location);
    setSearchValue(location.formattedAddress);
    
    if (mapInstanceRef.current && markerRef.current) {
      const position = { lat: location.latitude, lng: location.longitude };
      mapInstanceRef.current.setCenter(position);
      markerRef.current.setPosition(position);
    }
    
    onLocationSelect(location);
  };

  const handleSearch = async () => {
    if (!maps || !searchValue.trim()) return;
    
    setIsSearching(true);
    try {
      const geocoder = new maps.Geocoder();
      const result = await geocodeAddress(searchValue, geocoder);
      
      if (result) {
        const newLocation: LocationData = {
          latitude: result.lat,
          longitude: result.lng,
          formattedAddress: result.formattedAddress,
        };
        updateLocation(newLocation);
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different search term",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for location",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isLoaded && !loadError) {
      initializeMap();
    }
  }, [isLoaded, loadError, initializeMap]);

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <MapPin className="mx-auto h-12 w-12 mb-4" />
            <p>Failed to load Google Maps</p>
            <p className="text-sm text-muted-foreground mt-2">{loadError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin mb-4" />
            <p>Loading Google Maps...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              ref={searchInputRef}
              placeholder="Search for a location..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              size="icon"
              variant="outline"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div 
            ref={mapRef} 
            className="w-full h-64 rounded-lg border border-border"
          />
          
          {currentLocation && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Selected Location:</p>
              <p>{currentLocation.formattedAddress}</p>
              <p className="text-xs">
                Lat: {currentLocation.latitude.toFixed(6)}, 
                Lng: {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Click on the map or drag the marker to select a location
          </p>
        </div>
      </CardContent>
    </Card>
  );
};