import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, Search, Eye, Heart, Grid3X3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PrivateHallDetailModal } from '@/components/PrivateHallDetailModal';
import { PrivateHallBookingModal } from '@/components/student/PrivateHallBookingModal';
import { usePrivateHallImages } from '@/hooks/usePrivateHallImages';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import type { PrivateHall } from '@/types/PrivateHall';

interface PrivateHallCardProps {
  hall: PrivateHall;
  onView: (hall: PrivateHall) => void;
  onBook: (hall: PrivateHall) => void;
}

const PrivateHallCard: React.FC<PrivateHallCardProps> = ({ hall, onView, onBook }) => {
  const { getMainImage } = usePrivateHallImages(hall.id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const mainImage = getMainImage();

  // Calculate layout info from cabin_layout_json
  const getLayoutInfo = () => {
    try {
      if (hall.cabin_layout_json && typeof hall.cabin_layout_json === 'object') {
        const layout = hall.cabin_layout_json as any;
        if (layout.cabins && Array.isArray(layout.cabins)) {
          return `${layout.cabins.length} cabins`;
        }
      }
    } catch (error) {
      console.error('Error parsing layout:', error);
    }
    return `${hall.cabin_count || 0} cabins`;
  };

  return (
    <Card className="overflow-hidden bg-card hover:shadow-lg transition-all duration-300 group">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={mainImage?.image_url || "/api/placeholder/400/200"}
          alt={hall.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "/api/placeholder/400/200";
          }}
        />
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(hall.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
        >
          <Heart 
            className={`h-4 w-4 ${
              isFavorite(hall.id) 
                ? 'text-red-500 fill-red-500' 
                : 'text-white'
            }`} 
          />
        </button>
        {/* Price Badge */}
        <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
          ₹{hall.monthly_price}/month
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground line-clamp-1">
          {hall.name}
        </h3>

        {/* Layout Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Grid3X3 className="h-4 w-4" />
          <span>{getLayoutInfo()}</span>
        </div>

        {/* Location */}
        <div className="text-sm text-muted-foreground line-clamp-1">
          {hall.location}
        </div>

        {/* View Button */}
        <Button
          onClick={() => onView(hall)}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium"
          size="sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      </CardContent>
    </Card>
  );
};

export const PrivateHallsTab: React.FC = () => {
  const [privateHalls, setPrivateHalls] = useState<PrivateHall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHall, setSelectedHall] = useState<PrivateHall | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const fetchPrivateHalls = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('private_halls')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching private halls:', error);
        toast.error('Failed to fetch private halls');
        return;
      }

      setPrivateHalls(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch private halls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivateHalls();
  }, []);

  const filteredHalls = privateHalls.filter(hall =>
    hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (hall: PrivateHall) => {
    setSelectedHall(hall);
    setIsDetailModalOpen(true);
  };

  const handleBook = (hall: PrivateHall) => {
    setSelectedHall(hall);
    setIsBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-muted animate-pulse"></div>
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Private Halls</h2>
        <p className="text-muted-foreground">Browse and book private study halls</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search private halls by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Private Halls Grid */}
      {filteredHalls.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No Private Halls Available</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No halls match your search criteria.' : 'No private halls are currently available for booking.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHalls.map((hall) => (
            <PrivateHallCard
              key={hall.id}
              hall={hall}
              onView={handleView}
              onBook={handleBook}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PrivateHallDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        privateHall={selectedHall}
      />

      <PrivateHallBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        privateHall={selectedHall}
      />
    </div>
  );
};