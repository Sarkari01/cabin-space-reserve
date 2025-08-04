import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MapPin, Users, Building, DollarSign, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedRowBasedCabinDesigner } from '@/components/EnhancedRowBasedCabinDesigner';
import { useAuth } from '@/hooks/useAuth';
import type { PrivateHall } from '@/types/PrivateHall';

interface PrivateHallDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateHall: PrivateHall | null;
}

export const PrivateHallDetailModal: React.FC<PrivateHallDetailModalProps> = ({
  isOpen,
  onClose,
  privateHall,
}) => {
  const { userRole } = useAuth();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  const fetchImages = async () => {
    if (!privateHall) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('private_hall_images')
        .select('*')
        .eq('private_hall_id', privateHall.id)
        .order('display_order');

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      setImages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh images when modal opens or when explicitly requested
  const refreshImages = () => {
    setImageRefreshKey(prev => prev + 1);
    fetchImages();
  };

  useEffect(() => {
    if (isOpen && privateHall) {
      fetchImages();
    }
  }, [isOpen, privateHall, imageRefreshKey]);

  // Set up real-time subscription for image changes
  useEffect(() => {
    if (!isOpen || !privateHall) return;

    const channel = supabase
      .channel('private-hall-images-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_hall_images',
        filter: `private_hall_id=eq.${privateHall.id}`
      }, () => {
        refreshImages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, privateHall]);

  if (!privateHall) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {privateHall.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images
            </h3>
            {images.length > 0 ? (
              <Carousel className="w-full max-w-lg mx-auto">
                <CarouselContent>
                  {images.map((image, index) => (
                    <CarouselItem key={image.id}>
                      <div className="aspect-video relative overflow-hidden rounded-lg">
                        <img
                          src={image.image_url}
                          alt={`${privateHall.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.is_main && (
                          <Badge className="absolute top-2 left-2">
                            Main Image
                          </Badge>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            ) : (
              <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=400&fit=crop"
                  alt={privateHall.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Badge variant="secondary">No images uploaded yet</Badge>
                </div>
              </div>
            )}
          </Card>

          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={privateHall.status === 'active' ? 'default' : 'secondary'}>
                    {privateHall.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Cabins</span>
                  <span className="font-medium">{privateHall.cabin_count}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Price</span>
                  <span className="font-medium">₹{privateHall.monthly_price}</span>
                </div>
                
                {/* Only show Total Revenue to merchants and admins */}
                {(userRole === 'merchant' || userRole === 'admin') && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-medium">₹{privateHall.total_revenue}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Location</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {privateHall.formatted_address || privateHall.location}
                </p>
              </div>
            </Card>
          </div>

          {/* Description */}
          {privateHall.description && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{privateHall.description}</p>
            </Card>
          )}

          {/* Amenities */}
          {privateHall.amenities && privateHall.amenities.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {privateHall.amenities.map((amenity) => (
                  <Badge key={amenity} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Enhanced Cabin Layout */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Cabin Layout</h3>
            {privateHall.cabin_layout_json ? (
              <EnhancedRowBasedCabinDesigner
                layout={privateHall.cabin_layout_json}
                onChange={() => {}} // Read-only in detail view
                basePrice={privateHall.monthly_price}
                privateHallId={privateHall.id}
                showAvailability={true}
                readOnly={true}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No layout configured yet
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};