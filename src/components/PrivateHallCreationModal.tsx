import React, { useState, useRef } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PrivateHall, CabinLayoutData } from '@/types/PrivateHall';

interface PrivateHallCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivateHallCreationModal: React.FC<PrivateHallCreationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { createPrivateHall } = usePrivateHalls();
  const { userRole } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    formatted_address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    monthly_price: 0,
    base_refundable_deposit: 0,
    merchant_id: '',
    status: 'draft' as const,
    amenities: [] as string[],
  });

const [images, setImages] = useState<Array<{ id: string; url: string; file: File; isMain: boolean }>>([]);
  const [cabinLayout, setCabinLayout] = useState<CabinLayoutData>({
    cabins: [],
    layout: { width: 800, height: 600, scale: 1 },
  });
  const [useRowBasedDesign, setUseRowBasedDesign] = useState(true);
  const [createdHallId, setCreatedHallId] = useState<string | null>(null);

  const [newAmenity, setNewAmenity] = useState('');
  const imageUploadRef = useRef<{ uploadImages: () => Promise<void> }>(null);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; formattedAddress: string }) => {
    setFormData(prev => ({
      ...prev,
      location: location.formattedAddress,
      formatted_address: location.formattedAddress,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity),
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!formData.name || !formData.location || formData.monthly_price <= 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (cabinLayout.cabins.length === 0) {
        toast.error('Please add at least one cabin to the layout');
        return;
      }

      const hallData = {
        ...formData,
        cabin_layout_json: cabinLayout,
        status: 'active' as const,
      };

      const createdHall = await createPrivateHall(hallData);
      
      if (createdHall) {
        setCreatedHallId(createdHall.id);
        
        // Create cabin records from layout
        const cabinsToCreate = cabinLayout.cabins.map((cabin, index) => ({
          private_hall_id: createdHall.id,
          cabin_number: index + 1,
          cabin_name: cabin.name,
          monthly_price: cabin.monthly_price || formData.monthly_price,
          refundable_deposit: cabin.refundable_deposit || formData.base_refundable_deposit,
          max_occupancy: 1,
          amenities: cabin.amenities || [],
          position_x: cabin.x,
          position_y: cabin.y,
          status: 'available' as const,
        }));

        const { error: cabinsError } = await supabase
          .from('cabins')
          .insert(cabinsToCreate);

        if (cabinsError) {
          console.error('Error creating cabins:', cabinsError);
          toast.error('Private hall created but failed to create cabins');
        }

        // Upload images if any are selected
        if (images.length > 0) {
          try {
            // Upload images directly using the new private hall ID
            const uploadPromises = images.map(async (img, index) => {
              const fileName = `private-halls/${createdHall.id}/${Date.now()}-${img.file.name}`;
              
              // Upload to Supabase Storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('private-hall-images')
                .upload(fileName, img.file);

              if (uploadError) throw uploadError;

              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('private-hall-images')
                .getPublicUrl(fileName);

              // Save to database
              const { data: imageData, error: dbError } = await supabase
                .from('private_hall_images')
                .insert({
                  private_hall_id: createdHall.id,
                  image_url: publicUrl,
                  file_path: fileName,
                  is_main: img.isMain,
                  display_order: index,
                  file_size: img.file.size,
                  mime_type: img.file.type
                })
                .select()
                .single();

              if (dbError) throw dbError;
              return imageData;
            });

            await Promise.all(uploadPromises);
            toast.success('Private hall, cabins, and images created successfully!');
          } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Private hall created but failed to upload images');
          }
        } else {
          toast.success('Private hall and cabins created successfully!');
        }

        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating private hall:', error);
      toast.error('Failed to create private hall');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      location: '',
      formatted_address: '',
      latitude: null,
      longitude: null,
      monthly_price: 0,
      base_refundable_deposit: 0,
      merchant_id: '',
      status: 'draft',
      amenities: [],
    });
    setImages([]);
    setCreatedHallId(null);
    setCabinLayout({
      cabins: [],
      layout: { width: 800, height: 600, scale: 1 },
    });
    setUseRowBasedDesign(true);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Private Hall Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter hall name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your private hall"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="monthly_price">Monthly Price per Cabin *</Label>
              <Input
                id="monthly_price"
                type="number"
                value={formData.monthly_price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: Number(e.target.value) }))}
                placeholder="Enter monthly price"
              />
            </div>

            <div>
              <Label htmlFor="base_refundable_deposit">Base Refundable Deposit per Cabin *</Label>
              <Input
                id="base_refundable_deposit"
                type="number"
                value={formData.base_refundable_deposit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, base_refundable_deposit: Number(e.target.value) }))}
                placeholder="Enter base deposit amount"
              />
            </div>

            {userRole === 'admin' && (
              <div>
                <Label htmlFor="merchant_id">Merchant ID *</Label>
                <Input
                  id="merchant_id"
                  value={formData.merchant_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, merchant_id: e.target.value }))}
                  placeholder="Enter merchant ID"
                />
              </div>
            )}

            <div>
              <Label>Amenities</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Add amenity"
                  onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                />
                <Button type="button" onClick={addAmenity} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="ml-1 text-primary hover:text-primary/80"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Location *</Label>
              <LocationPicker onLocationSelect={handleLocationSelect} />
              {formData.location && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {formData.location}
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Private Hall Images</Label>
              <PrivateHallImageUpload
                ref={imageUploadRef}
                onImagesChange={setImages}
                maxImages={10}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Private Hall - Step {step} of 4</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  stepNumber <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>

          {/* Step content */}
          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {step < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Private Hall'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};