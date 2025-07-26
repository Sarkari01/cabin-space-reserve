import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useLocation } from '@/hooks/useLocation';
import { formatDistance } from '@/utils/locationUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, Navigation, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudyHall {
  id: string;
  name: string;
  location: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  monthly_price: number;
  amenities: string[];
  image_url?: string;
  merchant_id: string;
}

interface StudyHallMapProps {
  onStudyHallSelect?: (studyHall: StudyHall) => void;
  className?: string;
}

export const StudyHallMap: React.FC<StudyHallMapProps> = ({
  onStudyHallSelect,
  className = '',
}) => {
  const { isLoaded, loadError, maps } = useGoogleMaps();
  const { coordinates, isLoading: locationLoading, error: locationError, getCurrentLocation, searchNearbyStudyHalls } = useLocation();
  const { toast } = useToast();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [studyHalls, setStudyHalls] = useState<StudyHall[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState('10');
  const [selectedStudyHall, setSelectedStudyHall] = useState<StudyHall | null>(null);

  const initializeMap = useCallback(() => {
    if (!maps || !mapRef.current) return;

    const defaultCenter = coordinates 
      ? { lat: coordinates.latitude, lng: coordinates.longitude }
      : { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

    const map = new maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Create info window
    infoWindowRef.current = new maps.InfoWindow();

    // Add user location marker if available
    if (coordinates) {
      new maps.Marker({
        position: { lat: coordinates.latitude, lng: coordinates.longitude },
        map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" fill="blue" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new maps.Size(24, 24),
        },
      });
    }
  }, [maps, coordinates]);

  const addStudyHallMarkers = useCallback(() => {
    if (!maps || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each study hall
    studyHalls.forEach((studyHall) => {
      const marker = new maps.Marker({
        position: { lat: studyHall.latitude, lng: studyHall.longitude },
        map: mapInstanceRef.current,
        title: studyHall.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="red" stroke="white"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new maps.Size(32, 32),
        },
      });

      marker.addListener('click', () => {
        setSelectedStudyHall(studyHall);
        
        const infoContent = `
          <div style="max-width: 300px; padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${studyHall.name}</h3>
            <p style="margin-bottom: 4px; color: #666;">${studyHall.formatted_address || studyHall.location}</p>
            <p style="margin-bottom: 8px; color: #333;">Distance: ${formatDistance(studyHall.distance_km)}</p>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 12px; font-size: 12px;">₹${studyHall.monthly_price}/month</span>
            </div>
            ${studyHall.amenities.length > 0 ? `
              <div style="margin-bottom: 8px;">
                <small style="color: #666;">Amenities: ${studyHall.amenities.slice(0, 3).join(', ')}${studyHall.amenities.length > 3 ? '...' : ''}</small>
              </div>
            ` : ''}
          </div>
        `;

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (studyHalls.length > 0) {
      const bounds = new maps.LatLngBounds();
      
      // Add user location to bounds if available
      if (coordinates) {
        bounds.extend({ lat: coordinates.latitude, lng: coordinates.longitude });
      }
      
      // Add all study hall locations to bounds
      studyHalls.forEach(studyHall => {
        bounds.extend({ lat: studyHall.latitude, lng: studyHall.longitude });
      });
      
      mapInstanceRef.current?.fitBounds(bounds);
    }
  }, [maps, studyHalls, coordinates]);

  const handleLocationRequest = async () => {
    try {
      await getCurrentLocation();
      toast({
        title: "Location detected",
        description: "Your current location has been found",
      });
    } catch (error) {
      toast({
        title: "Location access failed",
        description: "Please enable location access or enter a location manually",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    if (!coordinates) {
      toast({
        title: "Location required",
        description: "Please allow location access first",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchNearbyStudyHalls(parseInt(selectedRadius));
      setStudyHalls(results);
      
      if (results.length === 0) {
        toast({
          title: "No study halls found",
          description: `No study halls found within ${selectedRadius}km of your location`,
        });
      } else {
        toast({
          title: "Study halls found",
          description: `Found ${results.length} study halls nearby`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for nearby study halls",
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

  useEffect(() => {
    if (isLoaded && studyHalls.length > 0) {
      addStudyHallMarkers();
    }
  }, [isLoaded, studyHalls, addStudyHallMarkers]);

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
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Find Nearby Study Halls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleLocationRequest}
              disabled={locationLoading}
              variant="outline"
              size="sm"
            >
              {locationLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="mr-2 h-4 w-4" />
              )}
              Get My Location
            </Button>
            
            <Select value={selectedRadius} onValueChange={setSelectedRadius}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="20">20 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleSearch}
              disabled={!coordinates || isSearching}
              size="sm"
            >
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Search
            </Button>
          </div>
          
          {locationError && (
            <p className="text-sm text-destructive">{locationError}</p>
          )}
          
          {coordinates && (
            <p className="text-sm text-muted-foreground">
              Your location: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg"
          />
        </CardContent>
      </Card>

      {studyHalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Nearby Study Halls ({studyHalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studyHalls.map((studyHall) => (
              <div
                key={studyHall.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedStudyHall?.id === studyHall.id ? 'border-primary bg-muted/30' : ''
                }`}
                onClick={() => {
                  setSelectedStudyHall(studyHall);
                  onStudyHallSelect?.(studyHall);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{studyHall.name}</h3>
                  <Badge variant="secondary">
                    {formatDistance(studyHall.distance_km)}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {studyHall.formatted_address || studyHall.location}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    ₹{studyHall.monthly_price}/month
                  </span>
                </div>
                
                {studyHall.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {studyHall.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {studyHall.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{studyHall.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};