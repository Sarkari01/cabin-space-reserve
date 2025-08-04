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
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (isOpen && privateHall) {
      fetchImages();
    }
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
          {images.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images
              </h3>
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
            </Card>
          )}

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
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="font-medium">₹{privateHall.total_revenue}</span>
                </div>
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