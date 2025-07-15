import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { geocodeAddress, reverseGeocode } from '@/utils/locationUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, Search, Crosshair, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<LocationData | null>(null);

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
      zoomControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Create custom marker with enhanced styling
    const marker = new maps.Marker({
      position: defaultCenter,
      map,
      draggable: true,
      title: 'Study Hall Location',
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      animation: maps.Animation.DROP,
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

    // Handle map center change for crosshair
    map.addListener('center_changed', () => {
      const center = map.getCenter();
      if (center) {
        setMapCenter({
          latitude: center.lat(),
          longitude: center.lng(),
          formattedAddress: '',
        });
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
      
      // Add bounce animation
      markerRef.current.setAnimation(maps!.Animation.BOUNCE);
      setTimeout(() => {
        markerRef.current?.setAnimation(null);
      }, 1000);
    }
    
    onLocationSelect(location);
  };

  const handleMyLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const geocoder = new maps!.Geocoder();
            const address = await reverseGeocode(latitude, longitude, geocoder);
            
            const newLocation: LocationData = {
              latitude,
              longitude,
              formattedAddress: address || '',
            };
            
            updateLocation(newLocation);
          } catch (error) {
            console.error('Error getting address:', error);
          } finally {
            setIsGettingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location access denied",
            description: "Please enable location access to use this feature",
            variant: "destructive",
          });
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setIsGettingLocation(false);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const zoom = mapInstanceRef.current.getZoom() || 15;
      mapInstanceRef.current.setZoom(zoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const zoom = mapInstanceRef.current.getZoom() || 15;
      mapInstanceRef.current.setZoom(Math.max(zoom - 1, 1));
    }
  };

  const handleUseCrosshair = async () => {
    if (mapCenter && maps) {
      const geocoder = new maps.Geocoder();
      try {
        const address = await reverseGeocode(mapCenter.latitude, mapCenter.longitude, geocoder);
        const newLocation: LocationData = {
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          formattedAddress: address || '',
        };
        updateLocation(newLocation);
      } catch (error) {
        console.error('Error getting address:', error);
      }
    }
  };

  const handleReset = () => {
    setCurrentLocation(null);
    setSearchValue('');
    setMapCenter(null);
    
    if (mapInstanceRef.current && markerRef.current) {
      const defaultCenter = { lat: 28.6139, lng: 77.2090 };
      mapInstanceRef.current.setCenter(defaultCenter);
      mapInstanceRef.current.setZoom(15);
      markerRef.current.setPosition(defaultCenter);
    }
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
          
          <div className="relative">
            <div 
              ref={mapRef} 
              className="w-full h-80 rounded-lg border border-border"
            />
            
            {/* Crosshair overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative">
                <Crosshair className="h-8 w-8 text-primary opacity-80" />
                <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-primary opacity-40 animate-pulse" />
              </div>
            </div>
            
            {/* Map controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm"
                onClick={handleMyLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            </div>
            
          </div>
          
          {/* Location display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentLocation && (
              <div className="text-sm space-y-2">
                <p className="font-medium text-foreground">📍 Selected Location:</p>
                <p className="text-muted-foreground break-words">{currentLocation.formattedAddress}</p>
                <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  <p>Lat: {currentLocation.latitude.toFixed(8)}</p>
                  <p>Lng: {currentLocation.longitude.toFixed(8)}</p>
                </div>
              </div>
            )}
            
            {mapCenter && (
              <div className="text-sm space-y-2">
                <p className="font-medium text-foreground">🎯 Center Point:</p>
                <p className="text-muted-foreground text-xs">Move map to position crosshair</p>
                <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  <p>Lat: {mapCenter.latitude.toFixed(8)}</p>
                  <p>Lng: {mapCenter.longitude.toFixed(8)}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <p>🖱️ Click map or drag marker to select location</p>
            {currentLocation && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onLocationSelect(currentLocation)}
                className="ml-2"
              >
                Confirm Location
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};