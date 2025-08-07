import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrivateHallImageUpload } from '@/components/PrivateHallImageUpload';
import { CabinLayoutDesigner } from '@/components/CabinLayoutDesigner';
import { RowBasedCabinDesigner } from '@/components/RowBasedCabinDesigner';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { usePrivateHalls } from '@/hooks/usePrivateHalls';
import { toast } from 'sonner';
import type { PrivateHall, CabinLayoutData } from '@/types/PrivateHall';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface PrivateHallEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateHall: PrivateHall | null;
}

export const PrivateHallEditModal: React.FC<PrivateHallEditModalProps> = ({
  isOpen,
  onClose,
  privateHall,
}) => {
  const { updatePrivateHall } = usePrivateHalls();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    formatted_address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    monthly_price: 0,
    base_refundable_deposit: 0,
    status: 'draft' as 'active' | 'inactive' | 'draft',
    amenities: [] as string[],
  });

  const [images, setImages] = useState<any[]>([]);
  const [cabinLayout, setCabinLayout] = useState<CabinLayoutData>({
    cabins: [],
    layout: { width: 800, height: 600, scale: 1 },
  });
  const [useRowBasedDesign, setUseRowBasedDesign] = useState(true);
  const [newAmenity, setNewAmenity] = useState('');
  const [loading, setLoading] = useState(false);
  const imageUploadRef = useRef<{ uploadImages: () => Promise<void> }>(null);

  // Initialize form with private hall data
  useEffect(() => {
    if (privateHall) {
      setFormData({
        name: privateHall.name,
        description: privateHall.description || '',
        location: privateHall.location,
        formatted_address: privateHall.formatted_address || '',
        latitude: privateHall.latitude,
        longitude: privateHall.longitude,
        monthly_price: privateHall.monthly_price,
        base_refundable_deposit: 0, // Default value, can be updated from cabin data
        status: privateHall.status,
        amenities: privateHall.amenities || [],
      });

      if (privateHall.cabin_layout_json) {
        setCabinLayout(privateHall.cabin_layout_json);
      }
    }
  }, [privateHall]);

  const handleLocationSelect = (location: any) => {
    setFormData(prev => ({
      ...prev,
      location: location.name,
      formatted_address: location.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
    }));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = async () => {
    if (!privateHall) return;

    if (!formData.name || !formData.location || formData.monthly_price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (cabinLayout.cabins.length === 0) {
      toast.error('Please design at least one cabin in the layout');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        formatted_address: formData.formatted_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        monthly_price: formData.monthly_price,
        status: formData.status,
        amenities: formData.amenities,
        cabin_layout_json: cabinLayout,
        cabin_count: cabinLayout.cabins.length,
        total_revenue: cabinLayout.cabins.reduce((sum, cabin) => 
          sum + (cabin.monthly_price || formData.monthly_price), 0
        ),
        updated_at: new Date().toISOString(),
      };

      await updatePrivateHall(privateHall.id, updateData);

      // Upload any new images
      if (images.length > 0 && imageUploadRef.current) {
        try {
          await imageUploadRef.current.uploadImages();
          toast.success('Private hall and images updated successfully!');
        } catch (error) {
          console.error('Error uploading images:', error);
          toast.error('Private hall updated but failed to upload new images');
        }
      } else {
        toast.success('Private hall updated successfully!');
      }

      onClose();
    } catch (error) {
      console.error('Error updating private hall:', error);
      toast.error('Failed to update private hall');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form data
    setFormData({
      name: '',
      description: '',
      location: '',
      formatted_address: '',
      latitude: null,
      longitude: null,
      monthly_price: 0,
      base_refundable_deposit: 0,
      status: 'draft',
      amenities: [],
    });
    setImages([]);
    setCabinLayout({
      cabins: [],
      layout: { width: 800, height: 600, scale: 1 },
    });
    setUseRowBasedDesign(true);
    setNewAmenity('');
    onClose();
  };

  if (!privateHall) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Private Hall - {privateHall.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Hall Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter hall name"
              />
            </div>

            <div>
              <Label htmlFor="monthly_price">Monthly Price (₹) *</Label>
              <Input
                id="monthly_price"
                type="number"
                value={formData.monthly_price}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: Number(e.target.value) }))}
                placeholder="Enter monthly price"
              />
            </div>

            <div>
              <Label htmlFor="base_refundable_deposit">Base Refundable Deposit (₹) *</Label>
              <Input
                id="base_refundable_deposit"
                type="number"
                value={formData.base_refundable_deposit}
                onChange={(e) => setFormData(prev => ({ ...prev, base_refundable_deposit: Number(e.target.value) }))}
                placeholder="Enter base deposit amount"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your private hall..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label>Location *</Label>
            <LocationPicker onLocationSelect={handleLocationSelect} />
            {formData.location && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {formData.location}
              </p>
            )}
          </div>

          {/* Amenities */}
          <div>
            <Label>Amenities</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity"
                onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
              />
              <Button type="button" onClick={addAmenity}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {amenity}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeAmenity(amenity)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <Label>Private Hall Images</Label>
            <PrivateHallImageUpload
              ref={imageUploadRef}
              privateHallId={privateHall.id}
              onImagesChange={setImages}
              maxImages={10}
            />
          </div>

          {/* Cabin Layout Design */}
          <div>
            <Label>Cabin Layout Design</Label>
            
            {/* Layout Type Selection */}
            <div className="flex gap-4 mb-6">
              <Button
                type="button"
                variant={useRowBasedDesign ? "default" : "outline"}
                onClick={() => setUseRowBasedDesign(true)}
              >
                Theater-Style Layout
              </Button>
              <Button
                type="button"
                variant={!useRowBasedDesign ? "default" : "outline"}
                onClick={() => setUseRowBasedDesign(false)}
              >
                Custom Layout
              </Button>
            </div>

            {useRowBasedDesign ? (
              <RowBasedCabinDesigner
                layout={cabinLayout}
                onChange={setCabinLayout}
                basePrice={formData.monthly_price || 0}
                baseDeposit={formData.base_refundable_deposit || 0}
              />
            ) : (
              <CabinLayoutDesigner
                layout={cabinLayout}
                onChange={setCabinLayout}
                basePrice={formData.monthly_price || 0}
                baseDeposit={formData.base_refundable_deposit || 0}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Private Hall'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};