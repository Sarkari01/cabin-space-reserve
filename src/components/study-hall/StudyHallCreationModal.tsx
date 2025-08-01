import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudyHallCreation } from '@/hooks/useStudyHallCreation';
import { StudyHallCreationFormData, DEFAULT_AMENITIES } from '@/types/StudyHallCreation';
import { MapPin, Users, Rows3, DollarSign, Plus } from 'lucide-react';

interface StudyHallCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const StudyHallCreationModal = ({ open, onOpenChange, onSuccess }: StudyHallCreationModalProps) => {
  const { createStudyHall, loading } = useStudyHallCreation();
  
  const [formData, setFormData] = useState<StudyHallCreationFormData>({
    name: '',
    description: '',
    location: '',
    total_seats: '',
    rows: '',
    seats_per_row: '',
    monthly_price: '',
    amenities: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof StudyHallCreationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    const totalSeats = parseInt(formData.total_seats);
    const rows = parseInt(formData.rows);
    const seatsPerRow = parseInt(formData.seats_per_row);
    const monthlyPrice = parseFloat(formData.monthly_price);

    if (!totalSeats || totalSeats < 1) newErrors.total_seats = 'Total seats must be at least 1';
    if (!rows || rows < 1) newErrors.rows = 'Rows must be at least 1';
    if (!seatsPerRow || seatsPerRow < 1) newErrors.seats_per_row = 'Seats per row must be at least 1';
    if (!monthlyPrice || monthlyPrice < 1) newErrors.monthly_price = 'Monthly price must be at least ₹1';

    // Check if calculated seats match total seats
    if (totalSeats && rows && seatsPerRow && (rows * seatsPerRow !== totalSeats)) {
      newErrors.total_seats = `Total seats (${totalSeats}) should equal rows × seats per row (${rows * seatsPerRow})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const rows = parseInt(formData.rows);
    const customRowNames = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));

    const result = await createStudyHall({
      name: formData.name.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      total_seats: parseInt(formData.total_seats),
      rows: rows,
      seats_per_row: parseInt(formData.seats_per_row),
      monthly_price: parseFloat(formData.monthly_price),
      amenities: formData.amenities,
      custom_row_names: customRowNames
    });

    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setFormData({
        name: '',
        description: '',
        location: '',
        total_seats: '',
        rows: '',
        seats_per_row: '',
        monthly_price: '',
        amenities: []
      });
      setErrors({});
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Study Hall
          </DialogTitle>
          <DialogDescription>
            Set up your study hall with basic information and seating configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Study Hall Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter study hall name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your study hall"
                  rows={3}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter location address"
                  className={errors.location ? 'border-destructive' : ''}
                />
                {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Seating Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Seating Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_seats">Total Seats *</Label>
                  <Input
                    id="total_seats"
                    type="number"
                    min="1"
                    value={formData.total_seats}
                    onChange={(e) => handleInputChange('total_seats', e.target.value)}
                    placeholder="e.g., 20"
                    className={errors.total_seats ? 'border-destructive' : ''}
                  />
                  {errors.total_seats && <p className="text-sm text-destructive mt-1">{errors.total_seats}</p>}
                </div>

                <div>
                  <Label htmlFor="rows" className="flex items-center gap-2">
                    <Rows3 className="h-4 w-4" />
                    Rows *
                  </Label>
                  <Input
                    id="rows"
                    type="number"
                    min="1"
                    value={formData.rows}
                    onChange={(e) => handleInputChange('rows', e.target.value)}
                    placeholder="e.g., 4"
                    className={errors.rows ? 'border-destructive' : ''}
                  />
                  {errors.rows && <p className="text-sm text-destructive mt-1">{errors.rows}</p>}
                </div>

                <div>
                  <Label htmlFor="seats_per_row">Seats per Row *</Label>
                  <Input
                    id="seats_per_row"
                    type="number"
                    min="1"
                    value={formData.seats_per_row}
                    onChange={(e) => handleInputChange('seats_per_row', e.target.value)}
                    placeholder="e.g., 5"
                    className={errors.seats_per_row ? 'border-destructive' : ''}
                  />
                  {errors.seats_per_row && <p className="text-sm text-destructive mt-1">{errors.seats_per_row}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="monthly_price">Monthly Price (₹) *</Label>
                <Input
                  id="monthly_price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.monthly_price}
                  onChange={(e) => handleInputChange('monthly_price', e.target.value)}
                  placeholder="e.g., 2500"
                  className={errors.monthly_price ? 'border-destructive' : ''}
                />
                {errors.monthly_price && <p className="text-sm text-destructive mt-1">{errors.monthly_price}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DEFAULT_AMENITIES.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm font-normal cursor-pointer">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>

              {formData.amenities.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Selected amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Study Hall'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};