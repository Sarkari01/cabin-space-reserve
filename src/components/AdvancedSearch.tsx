import { useState } from "react";
import { Search, Filter, MapPin, Users, Calendar, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SearchFilters {
  priceRange: [number, number];
  capacity?: string;
  location?: string;
  amenities: string[];
  rating?: string;
  sortBy: 'price' | 'rating' | 'capacity' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  locations: string[];
  amenities: string[];
  className?: string;
}

const AdvancedSearch = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  locations,
  amenities,
  className
}: AdvancedSearchProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities;
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    handleFilterChange('amenities', newAmenities);
  };

  const clearFilters = () => {
    onFiltersChange({
      priceRange: [0, 1000],
      capacity: undefined,
      location: undefined,
      amenities: [],
      rating: undefined,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const activeFiltersCount = [
    filters.capacity,
    filters.location,
    filters.rating,
    filters.amenities.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 1000
  ].filter(Boolean).length;

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search study halls by name or location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Search Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Price Range */}
              <div className="space-y-3">
                <Label>Price Range (per day)</Label>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => handleFilterChange('priceRange', value)}
                    max={1000}
                    min={0}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>₹{filters.priceRange[0]}</span>
                    <span>₹{filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <Label>Location</Label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => handleFilterChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any location</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capacity */}
              <div className="space-y-3">
                <Label>Capacity</Label>
                <Select 
                  value={filters.capacity} 
                  onValueChange={(value) => handleFilterChange('capacity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any capacity</SelectItem>
                    <SelectItem value="small">Small (1-20 seats)</SelectItem>
                    <SelectItem value="medium">Medium (21-50 seats)</SelectItem>
                    <SelectItem value="large">Large (50+ seats)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-3">
                <Label>Sort by</Label>
                <div className="flex gap-2">
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="capacity">Capacity</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.sortOrder} 
                    onValueChange={(value) => handleFilterChange('sortOrder', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">↑</SelectItem>
                      <SelectItem value="desc">↓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                      <Button
                        key={amenity}
                        variant={filters.amenities.includes(amenity) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAmenityToggle(amenity)}
                      >
                        {amenity}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;