import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Grid3X3, DollarSign, Upload, X, Wifi, Snowflake, Car, Coffee, Printer, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSeats } from "@/hooks/useStudyHalls";

interface Seat {
  id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

interface StudyHall {
  id?: string;
  name: string;
  description: string;
  location: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names: string[];
  amenities: string[];
  daily_price: number;
  weekly_price: number;
  monthly_price: number;
  image_url?: string;
  status: "active" | "inactive";
}

interface StudyHallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studyHall: StudyHall) => void;
  studyHall?: StudyHall;
  mode: "add" | "edit" | "view";
}

export function StudyHallModal({ isOpen, onClose, onSave, studyHall, mode }: StudyHallModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<StudyHall>({
    name: "",
    description: "",
    location: "",
    total_seats: 20,
    rows: 4,
    seats_per_row: 5,
    custom_row_names: ["A", "B", "C", "D"],
    amenities: [],
    daily_price: 100,
    weekly_price: 500,
    monthly_price: 1500,
    status: "active"
  });

  const { seats, loading: seatsLoading, fetchSeats } = useSeats(studyHall?.id);

  useEffect(() => {
    if (studyHall) {
      setFormData(studyHall);
      if (studyHall.id) {
        fetchSeats(studyHall.id);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        location: "",
        total_seats: 20,
        rows: 4,
        seats_per_row: 5,
        custom_row_names: ["A", "B", "C", "D"],
        amenities: [],
        daily_price: 100,
        weekly_price: 500,
        monthly_price: 1500,
        status: "active"
      });
    }
  }, [studyHall, isOpen]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `study-hall-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study-hall-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('study-hall-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: undefined }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleLayoutChange = (field: 'rows' | 'seats_per_row', value: number) => {
    const newRows = field === 'rows' ? value : formData.rows;
    const newSeatsPerRow = field === 'seats_per_row' ? value : formData.seats_per_row;
    
    // Update custom row names array when rows change
    if (field === 'rows') {
      const newCustomRowNames = Array.from({ length: value }, (_, i) => {
        return formData.custom_row_names[i] || String.fromCharCode(65 + i);
      });
      
      setFormData(prev => ({
        ...prev,
        rows: value,
        total_seats: value * prev.seats_per_row,
        custom_row_names: newCustomRowNames
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        seats_per_row: value,
        total_seats: prev.rows * value
      }));
    }
  };

  const handleRowNameChange = (index: number, newName: string) => {
    const newCustomRowNames = [...formData.custom_row_names];
    newCustomRowNames[index] = newName;
    setFormData(prev => ({
      ...prev,
      custom_row_names: newCustomRowNames
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create New Study Hall" : 
             mode === "edit" ? "Edit Study Hall" : "Study Hall Details"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="layout">Seat Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Study Hall Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter study hall name"
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                    disabled={isReadOnly}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your study hall"
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>

              {/* Study Hall Pricing Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Study Hall Pricing (₹)
                </h4>
                <div className="text-sm text-muted-foreground mb-3">
                  Set display prices. Users will see: "Base Price + 2% Remaining Discount" format
                </div>
                <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dailyPrice">Daily Display Rate (₹)</Label>
                  <Input
                    id="dailyPrice"
                    type="number"
                    value={formData.daily_price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      daily_price: Number(e.target.value)
                    }))}
                    placeholder="100"
                    min="1"
                    disabled={isReadOnly}
                    required
                  />
                  {!isReadOnly && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Users see: ₹{Math.round(formData.daily_price * 0.98)} + 2% Remaining Discount
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="weeklyPrice">Weekly Display Rate (₹)</Label>
                  <Input
                    id="weeklyPrice"
                    type="number"
                    value={formData.weekly_price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      weekly_price: Number(e.target.value)
                    }))}
                    placeholder="500"
                    min="1"
                    disabled={isReadOnly}
                    required
                  />
                  {!isReadOnly && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Users see: ₹{Math.round(formData.weekly_price * 0.98)} + 2% Remaining Discount
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="monthlyPrice">Monthly Display Rate (₹)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      monthly_price: Number(e.target.value)
                    }))}
                    placeholder="1500"
                    min="1"
                    disabled={isReadOnly}
                    required
                  />
                  {!isReadOnly && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Users see: ₹{Math.round(formData.monthly_price * 0.98)} + 2% Remaining Discount
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Study Hall Image
                </h4>
                <div className="space-y-4">
                  {formData.image_url ? (
                    <div className="relative">
                      <img 
                        src={formData.image_url} 
                        alt="Study hall" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">Upload study hall image</p>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? "Uploading..." : "Choose Image"}
                        </Button>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Rows</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLayoutChange('rows', Math.max(1, formData.rows - 1))}
                      disabled={isReadOnly}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{formData.rows}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLayoutChange('rows', Math.min(10, formData.rows + 1))}
                      disabled={isReadOnly}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Seats per Row</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLayoutChange('seats_per_row', Math.max(1, formData.seats_per_row - 1))}
                      disabled={isReadOnly}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{formData.seats_per_row}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLayoutChange('seats_per_row', Math.min(20, formData.seats_per_row + 1))}
                      disabled={isReadOnly}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Total Seats</Label>
                  <div className="text-2xl font-bold text-center py-2">
                    {formData.total_seats}
                  </div>
                </div>
              </div>

              {/* Custom Row Names */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3">Custom Row Names</h4>
                <div className="grid grid-cols-5 gap-2">
                  {formData.custom_row_names.map((rowName, index) => (
                    <div key={index}>
                      <Label className="text-xs">Row {index + 1}</Label>
                      <Input
                        value={rowName}
                        onChange={(e) => handleRowNameChange(index, e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        maxLength={2}
                        className="text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Study Hall Amenities</h4>
                <p className="text-sm text-muted-foreground">
                  Select amenities available in your study hall to help students find the perfect study space.
                </p>
              </div>
              
              {/* Predefined Amenities */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Popular Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {[
                      { name: "WiFi", icon: Wifi },
                      { name: "Air Conditioning", icon: Snowflake },
                      { name: "Parking", icon: Car },
                      { name: "Cafeteria", icon: Coffee },
                      { name: "Printer/Scanner", icon: Printer },
                      { name: "Projector/Screen", icon: Monitor },
                    ].map((amenity) => {
                      const isSelected = formData.amenities.includes(amenity.name);
                      const IconComponent = amenity.icon;
                      
                      return (
                        <Button
                          key={amenity.name}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className="h-auto p-3 flex flex-col items-center space-y-2"
                          onClick={() => {
                            if (isReadOnly) return;
                            
                            const newAmenities = isSelected
                              ? formData.amenities.filter(a => a !== amenity.name)
                              : [...formData.amenities, amenity.name];
                              
                            setFormData(prev => ({ ...prev, amenities: newAmenities }));
                          }}
                          disabled={isReadOnly}
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="text-xs text-center">{amenity.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Amenities */}
                <div>
                  <Label className="text-base font-medium">Custom Amenities</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities
                        .filter(amenity => !["WiFi", "Air Conditioning", "Parking", "Cafeteria", "Printer/Scanner", "Projector/Screen"].includes(amenity))
                        .map((amenity, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <span>{amenity}</span>
                            {!isReadOnly && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => {
                                  const newAmenities = formData.amenities.filter(a => a !== amenity);
                                  setFormData(prev => ({ ...prev, amenities: newAmenities }));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </Badge>
                        ))}
                    </div>
                    
                    {!isReadOnly && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add custom amenity..."
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && !formData.amenities.includes(value)) {
                                setFormData(prev => ({
                                  ...prev,
                                  amenities: [...prev.amenities, value]
                                }));
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            const value = input.value.trim();
                            if (value && !formData.amenities.includes(value)) {
                              setFormData(prev => ({
                                ...prev,
                                amenities: [...prev.amenities, value]
                              }));
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Amenities Preview */}
                {formData.amenities.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h5 className="font-medium mb-2">Selected Amenities ({formData.amenities.length})</h5>
                    <div className="flex flex-wrap gap-1">
                      {formData.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Grid3X3 className="h-5 w-5" />
                  <h4 className="font-semibold">Study Hall Seat Layout</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customize your seat layout. All seats use the pricing set in Basic Details.
                </p>
              </div>
              
              <div className="bg-background border-2 border-dashed border-muted-foreground/20 rounded-xl p-8">
                {/* Layout Controls */}
                <div className="flex justify-center mb-6">
                  <div className="bg-muted px-4 py-2 rounded-full text-sm font-medium">
                    Screen / Front of Hall
                  </div>
                </div>
                
                {/* Seat Grid */}
                <div className="flex flex-col items-center space-y-3">
                  {Array.from({ length: formData.rows }, (_, rowIndex) => {
                    const rowName = formData.custom_row_names[rowIndex] || String.fromCharCode(65 + rowIndex);
                    return (
                      <div key={rowIndex} className="flex items-center space-x-3">
                        {/* Row Label */}
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {rowName}
                        </div>
                        
                        {/* Seat Numbers */}
                        <div className="flex space-x-2">
                          {Array.from({ length: formData.seats_per_row }, (_, seatIndex) => {
                            const seatId = `${rowName}${seatIndex + 1}`;
                            const seat = seats.find(s => s.seat_id === seatId);
                            const isAvailable = seat?.is_available ?? true;
                            
                            return (
                              <div key={seatId} className="relative group">
                                <Button
                                  type="button"
                                  variant={isAvailable ? "outline" : "secondary"}
                                  size="sm"
                                  className={`w-12 h-12 p-0 relative transition-colors ${
                                    isAvailable 
                                      ? "border-green-500 text-green-700 hover:bg-green-50" 
                                      : "bg-red-100 border-red-300 text-red-700"
                                  }`}
                                  disabled={true}
                                >
                                  <div className="text-center">
                                    <div className="text-xs font-medium">{seatIndex + 1}</div>
                                    <div className="text-xs">
                                      {rowName}
                                    </div>
                                  </div>
                                  {!isAvailable && (
                                    <div className="absolute inset-0 bg-red-500/20 rounded" />
                                  )}
                                </Button>
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  {isAvailable ? "Available" : "Occupied"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Row Number */}
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {rowName}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Seat Status Legend */}
                <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-green-500 rounded"></div>
                    <span className="text-sm text-muted-foreground">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                    <span className="text-sm text-muted-foreground">Occupied</span>
                  </div>
                </div>
              </div>

              {/* Study Hall Pricing Display */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Study Hall Pricing
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1">Daily Rate</div>
                      <div className="font-medium text-lg">
                        {formatCurrency(formData.daily_price)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1">Weekly Rate</div>
                      <div className="font-medium text-lg">
                        {formatCurrency(formData.weekly_price)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1">Monthly Rate</div>
                      <div className="font-medium text-lg">
                        {formatCurrency(formData.monthly_price)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    These rates apply to all seats in this study hall
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {!isReadOnly && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === "add" ? "Create Study Hall" : "Update Study Hall"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}