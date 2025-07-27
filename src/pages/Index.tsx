import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudyHalls } from "@/hooks/useStudyHalls";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { MapPin, Users, Calendar, DollarSign, Star, Search, Filter, Map, List } from "lucide-react";
import { StudyHallDetailModal } from "@/components/StudyHallDetailModal";
import AdvancedSearch from "@/components/AdvancedSearch";
import { BannerCarousel } from "@/components/BannerCarousel";
import { StudyHallMainImage } from "@/components/StudyHallMainImage";
import { RatingDisplay } from "@/components/reviews/RatingDisplay";

const Index = () => {
  const { studyHalls, loading, fetchStudyHalls } = useStudyHalls();
  const { user } = useAuth();
  const { coordinates } = useLocation();
  const [searchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [selectedStudyHall, setSelectedStudyHall] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Handle deep linking from search parameters
  useEffect(() => {
    const hallId = searchParams.get('hall');
    if (hallId && studyHalls.length > 0) {
      const hall = studyHalls.find(h => h.id === hallId);
      if (hall) {
        setSelectedStudyHall(hall);
        setDetailModalOpen(true);
      }
    }
  }, [searchParams, studyHalls]);

  // Filter study halls based on search criteria
  const filteredStudyHalls = studyHalls.filter(studyHall => {
    const matchesSearch = studyHall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         studyHall.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !selectedLocation || 
                           studyHall.location.toLowerCase().includes(selectedLocation.toLowerCase());
    
    let matchesPrice = true;
    if (priceRange) {
      const dailyPrice = studyHall.daily_price;
      switch (priceRange) {
        case "0-100":
          matchesPrice = dailyPrice <= 100;
          break;
        case "100-200":
          matchesPrice = dailyPrice > 100 && dailyPrice <= 200;
          break;
        case "200-500":
          matchesPrice = dailyPrice > 200 && dailyPrice <= 500;
          break;
        case "500+":
          matchesPrice = dailyPrice > 500;
          break;
      }
    }
    
    return matchesSearch && matchesLocation && matchesPrice && studyHall.status === 'active';
  });

  const handleViewDetails = async (studyHall: any) => {
    // Use the current data from studyHalls state which already has incharges
    const currentStudyHall = studyHalls.find(hall => hall.id === studyHall.id) || studyHall;
    
    console.log('🎯 Index: Opening study hall detail:', {
      id: currentStudyHall.id,
      name: currentStudyHall.name,
      hasIncharges: currentStudyHall.incharges?.length > 0,
      inchargeCount: currentStudyHall.incharges?.length || 0,
      inchargesList: currentStudyHall.incharges?.map(i => i.full_name) || []
    });
    
    setSelectedStudyHall(currentStudyHall);
    setDetailModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUniqueLocations = () => {
    const locations = studyHalls
      .filter(hall => hall.status === 'active')
      .map(hall => hall.location)
      .filter((location, index, self) => self.indexOf(location) === index);
    return locations;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading study halls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Carousel */}
      <BannerCarousel targetAudience="user" className="mb-8" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find Your Perfect Study Space
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover quiet, comfortable study halls near you. Book your seat and focus on what matters most.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {getUniqueLocations().map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Prices</SelectItem>
                <SelectItem value="0-100">₹0 - ₹100</SelectItem>
                <SelectItem value="100-200">₹100 - ₹200</SelectItem>
                <SelectItem value="200-500">₹200 - ₹500</SelectItem>
                <SelectItem value="500+">₹500+</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedSearch(true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="px-3"
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle and Content */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "map")}>
          <TabsContent value="list" className="space-y-6">
            {/* Results Summary */}
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">
                {filteredStudyHalls.length} study hall{filteredStudyHalls.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Study Halls Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudyHalls.map((studyHall) => (
                <Card key={studyHall.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <div onClick={() => handleViewDetails(studyHall)}>
                    <div className="aspect-video rounded-lg overflow-hidden mb-4">
                      <StudyHallMainImage studyHallId={studyHall.id} alt={studyHall.name} />
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {studyHall.name}
                          </h3>
                          <div className="flex items-center text-muted-foreground text-sm mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{studyHall.location}</span>
                          </div>
                          {(studyHall as any).average_rating && (
                            <div className="mt-2">
                              <RatingDisplay 
                                rating={(studyHall as any).average_rating} 
                                totalReviews={(studyHall as any).total_reviews || 0}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {studyHall.status}
                        </Badge>
                      </div>

                      {studyHall.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {studyHall.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{studyHall.total_seats} seats</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Available</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-primary mr-1" />
                            <span className="font-semibold text-foreground">
                              ₹{studyHall.daily_price}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">/day</span>
                          </div>
                          
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(studyHall);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredStudyHalls.length === 0 && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No study halls found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters to find more options.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedLocation("");
                      setPriceRange("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Map view coming soon</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <Dialog open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Search</DialogTitle>
            </DialogHeader>
            <AdvancedSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={{
                priceRange: [0, 1000],
                capacity: undefined,
                location: selectedLocation,
                amenities: [],
                rating: undefined,
                sortBy: 'name',
                sortOrder: 'asc'
              }}
              onFiltersChange={(filters) => {
                // Apply advanced filters
                setSelectedLocation(filters.location || '');
                console.log("Advanced search filters:", filters);
              }}
              locations={getUniqueLocations()}
              amenities={[]}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Study Hall Detail Modal */}
      <StudyHallDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        studyHall={selectedStudyHall}
        seats={[]} // This would come from useSeats hook
        userRole={user?.role}
      />
    </div>
  );
};

export default Index;