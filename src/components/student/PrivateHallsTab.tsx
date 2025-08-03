import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building, MapPin, Users, DollarSign, Search, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PrivateHallDetailModal } from '@/components/PrivateHallDetailModal';
import { PrivateHallBookingModal } from '@/components/student/PrivateHallBookingModal';
import { toast } from 'sonner';
import type { PrivateHall } from '@/types/PrivateHall';

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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Private Halls</h2>
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

      {/* Private Halls List */}
      {filteredHalls.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Private Halls Available</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No halls match your search criteria.' : 'No private halls are currently available for booking.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => (
            <Card key={hall.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{hall.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {hall.location}
                    </div>
                  </div>
                  <Badge variant="default">Available</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{hall.cabin_count} cabins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>₹{hall.monthly_price}/month</span>
                  </div>
                </div>

                {hall.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {hall.description}
                  </p>
                )}

                {hall.amenities && hall.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hall.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {hall.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{hall.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(hall)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBook(hall)}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
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