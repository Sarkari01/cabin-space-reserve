import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Users, Building, DollarSign } from 'lucide-react';
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

          {/* Cabin Layout Preview */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Cabin Layout</h3>
            <div className="relative bg-muted/20 border-2 border-dashed border-border rounded-lg p-4 min-h-[300px]">
              {privateHall.cabin_layout_json?.cabins?.map((cabin: any) => (
                <div
                  key={cabin.id}
                  className="absolute bg-primary/20 border-2 border-primary/50 rounded text-xs p-1"
                  style={{
                    left: cabin.x,
                    top: cabin.y,
                    width: cabin.width,
                    height: cabin.height,
                  }}
                >
                  <div className="font-medium">{cabin.name}</div>
                  <div className="text-muted-foreground">₹{cabin.monthly_price}</div>
                </div>
              ))}
            </div>
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