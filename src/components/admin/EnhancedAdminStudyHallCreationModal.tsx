import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { StudyHallCreationFormData, DEFAULT_AMENITIES } from '@/types/StudyHallCreation';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { SeatingConfigurator } from '@/components/study-hall/SeatingConfigurator';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Users, DollarSign, Plus, Camera, Settings, CheckCircle, Shield } from 'lucide-react';

interface EnhancedFormData extends StudyHallCreationFormData {
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
}

interface EnhancedAdminStudyHallCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EnhancedAdminStudyHallCreationModal = ({ open, onOpenChange, onSuccess }: EnhancedAdminStudyHallCreationModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState('merchant');
  const [formData, setFormData] = useState<EnhancedFormData>({
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
  const [seatingLayout, setSeatingLayout] = useState<any[]>([]);
  const [customRowNames, setCustomRowNames] = useState<string[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Load merchants when modal opens
  React.useEffect(() => {
    if (open) {
      loadMerchants();
    }
  }, [open]);

  const loadMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'merchant')
        .order('full_name');

      if (error) throw error;
      setMerchants(data || []);
    } catch (error) {
      console.error('Failed to load merchants:', error);
    }
  };

  const handleInputChange = (field: keyof EnhancedFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMerchantSelect = (merchantId: string) => {
    setSelectedMerchant(merchantId);
    if (merchantId) {
      setCompletedSteps(prev => new Set([...prev, 'merchant']));
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

  const handleLocationSelect = (location: any) => {
    setFormData(prev => ({
      ...prev,
      location: location.formattedAddress,
      latitude: location.latitude,
      longitude: location.longitude,
      formatted_address: location.formattedAddress
    }));
    setCompletedSteps(prev => new Set([...prev, 'location']));
  };

  const handleSeatingChange = (seating: { layout: any[]; totalSeats: number; }) => {
    setSeatingLayout(seating.layout);
    if (seating.layout.length > 0) {
      const rows = Math.max(...seating.layout.map(seat => seat.row));
      const seatsPerRow = Math.max(...seating.layout.map(seat => seat.number));
      
      setFormData(prev => ({
        ...prev,
        total_seats: seating.totalSeats.toString(),
        rows: rows.toString(),
        seats_per_row: seatsPerRow.toString()
      }));
      
      const rowNames = Array.from(new Set(seating.layout.map(seat => seat.rowName))).sort();
      setCustomRowNames(rowNames);
      setCompletedSteps(prev => new Set([...prev, 'seating']));
    }
  };

  const handleImagesChange = (newImages: any[]) => {
    setImages(newImages);
    if (newImages.length > 0) {
      setCompletedSteps(prev => new Set([...prev, 'images']));
    }
  };

  const validateBasicInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.monthly_price || parseFloat(formData.monthly_price) < 1) {
      newErrors.monthly_price = 'Monthly price must be at least ₹1';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, 'basic']));
    }
    
    return isValid;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedMerchant) newErrors.merchant = 'Please select a merchant';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const insertData = {
        merchant_id: selectedMerchant,
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        formatted_address: formData.formatted_address,
        total_seats: parseInt(formData.total_seats),
        rows: parseInt(formData.rows),
        seats_per_row: parseInt(formData.seats_per_row),
        monthly_price: parseFloat(formData.monthly_price),
        amenities: formData.amenities,
        custom_row_names: customRowNames.length > 0 ? customRowNames : 
          Array.from({ length: parseInt(formData.rows) }, (_, i) => String.fromCharCode(65 + i)),
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: 'active'
      };

      const { data: studyHall, error } = await supabase
        .from('study_halls')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Upload images if any
      if (images.length > 0 && studyHall) {
        console.log('Images ready for upload:', images);
        // Images will be handled by the MultiImageUpload component
      }

      toast({
        title: "Success!",
        description: `Study hall "${formData.name}" created successfully`,
        variant: "default"
      });

      onOpenChange(false);
      onSuccess?.();
      resetForm();

    } catch (error: any) {
      console.error('Failed to create study hall:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create study hall",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    setSelectedMerchant('');
    setErrors({});
    setSeatingLayout([]);
    setCustomRowNames([]);
    setImages([]);
    setCompletedSteps(new Set());
    setActiveTab('merchant');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setErrors({});
  };

  const getTabIcon = (tab: string) => {
    if (completedSteps.has(tab)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    switch (tab) {
      case 'merchant': return <Shield className="h-4 w-4" />;
      case 'basic': return <Settings className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'seating': return <Users className="h-4 w-4" />;
      case 'images': return <Camera className="h-4 w-4" />;
      default: return null;
    }
  };

  const selectedMerchantData = merchants.find(m => m.id === selectedMerchant);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin: Create Study Hall
          </DialogTitle>
          <DialogDescription>
            Create a study hall on behalf of a merchant with comprehensive configuration.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="merchant" className="flex items-center gap-2">
              {getTabIcon('merchant')}
              Merchant
            </TabsTrigger>
            <TabsTrigger value="basic" className="flex items-center gap-2">
              {getTabIcon('basic')}
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              {getTabIcon('location')}
              Location
            </TabsTrigger>
            <TabsTrigger value="seating" className="flex items-center gap-2">
              {getTabIcon('seating')}
              Seating
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              {getTabIcon('images')}
              Images
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="merchant" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Merchant Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="merchant">Select Merchant *</Label>
                    <Select value={selectedMerchant} onValueChange={handleMerchantSelect}>
                      <SelectTrigger className={errors.merchant ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Choose a merchant" />
                      </SelectTrigger>
                      <SelectContent>
                        {merchants.map((merchant) => (
                          <SelectItem key={merchant.id} value={merchant.id}>
                            {merchant.full_name} ({merchant.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.merchant && <p className="text-sm text-destructive mt-1">{errors.merchant}</p>}
                  </div>

                  {selectedMerchantData && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium">Selected Merchant:</h4>
                      <p className="text-sm text-muted-foreground">{selectedMerchantData.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMerchantData.email}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setActiveTab('basic')}
                      disabled={!selectedMerchant}
                    >
                      Continue to Basic Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="basic" className="space-y-6 mt-0">
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
                      placeholder="Describe the study hall"
                      rows={3}
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <Label htmlFor="monthly_price" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monthly Price (₹) *
                    </Label>
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

                  <div>
                    <Label className="text-lg mb-4 block">Amenities</Label>
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
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('merchant')}>
                      Back
                    </Button>
                    <Button onClick={validateBasicInfo}>
                      Continue to Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Setup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={formData.latitude && formData.longitude ? {
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                      formattedAddress: formData.location
                    } : undefined}
                  />
                  
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setActiveTab('basic')}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('seating')}
                      disabled={!formData.location}
                    >
                      Continue to Seating
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seating" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Seating Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SeatingConfigurator
                    totalSeats={parseInt(formData.total_seats) || 20}
                    onSeatingChange={handleSeatingChange}
                  />
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setActiveTab('location')}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('images')}
                      disabled={seatingLayout.length === 0}
                    >
                      Continue to Images
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Study Hall Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MultiImageUpload
                    studyHallId=""
                    onImagesChange={handleImagesChange}
                    maxImages={10}
                  />
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setActiveTab('seating')}>
                      Back
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={handleCancel} disabled={loading}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Study Hall'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};