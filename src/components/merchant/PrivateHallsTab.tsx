import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrivateHalls } from '@/hooks/usePrivateHalls';
import { PrivateHallCreationModal } from '@/components/PrivateHallCreationModal';
import { PrivateHallDetailModal } from '@/components/PrivateHallDetailModal';
import { PrivateHallEditModal } from '@/components/PrivateHallEditModal';
import { Plus, MapPin, Calendar, DollarSign, Users, Eye, Edit, Trash, Activity } from 'lucide-react';
import { toast } from 'sonner';
import type { PrivateHall } from '@/types/PrivateHall';
import { CabinAvailabilityBadge } from '@/components/CabinAvailabilityBadge';
import { AutoExpireButton } from '@/components/AutoExpireButton';
import { useCombinedBookings } from '@/hooks/useCombinedBookings';

export const PrivateHallsTab: React.FC = () => {
  const { privateHalls, loading, updatePrivateHall, deletePrivateHall } = usePrivateHalls();
  const { bookings } = useCombinedBookings();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState<PrivateHall | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleStatus = async (hall: PrivateHall) => {
    const newStatus = hall.status === 'active' ? 'inactive' : 'active';
    await updatePrivateHall(hall.id, { status: newStatus });
  };

  const handleDelete = async (hall: PrivateHall) => {
    if (window.confirm(`Are you sure you want to delete "${hall.name}"? This action cannot be undone.`)) {
      await deletePrivateHall(hall.id);
    }
  };

  const getCabinOccupancyStatus = (privateHallId: string) => {
    const hallBookings = bookings.filter(b => 
      b.type === 'cabin' &&
      b.location_id === privateHallId && 
      b.status === 'active' && 
      b.payment_status === 'paid' &&
      !b.is_vacated
    );
    
    if (hallBookings.length === 0) return 'available';
    return 'booked';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Private Halls</h2>
            <p className="text-muted-foreground">Manage your cabin-style private halls</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Private Halls</h2>
          <p className="text-muted-foreground">Manage your cabin-style private halls for monthly bookings</p>
        </div>
        <div className="flex gap-2">
          <AutoExpireButton onCompleted={() => {
            // Refresh data after auto-expire
          }} />
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Private Hall
          </Button>
        </div>
      </div>

      {privateHalls.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Private Halls Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first private hall with cabin layouts for monthly bookings
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Private Hall
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {privateHalls.map((hall) => (
            <Card key={hall.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{hall.name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {hall.location}
                    </p>
                  </div>
                  <Badge className={getStatusColor(hall.status)}>
                    {hall.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monthly Price</span>
                    <span className="font-semibold">₹{hall.monthly_price.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Cabins</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{hall.cabin_count}</span>
                      <CabinAvailabilityBadge 
                        status={getCabinOccupancyStatus(hall.id)}
                        size="sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-semibold">₹{hall.total_revenue.toLocaleString()}</span>
                  </div>
                  
                  {hall.amenities && hall.amenities.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {hall.amenities.slice(0, 3).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {hall.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{hall.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                    <span>Created {new Date(hall.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedHall(hall);
                        setShowDetailModal(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedHall(hall);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(hall)}
                    >
                      {hall.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(hall)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PrivateHallCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <PrivateHallDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedHall(null);
        }}
        privateHall={selectedHall}
      />

      <PrivateHallEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedHall(null);
        }}
        privateHall={selectedHall}
      />
    </div>
  );
};