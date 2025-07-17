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
import { LocationPicker } from "@/components/maps/LocationPicker";
import { MultiImageUpload } from "@/components/MultiImageUpload";

interface Seat {
  id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

interface SectionRow {
  seats: number;
  startNum?: number;
}

interface SeatSection {
  name: string;
  rows: Record<string, SectionRow>;
  position: 'left' | 'right' | 'center';
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
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  layout_mode?: "fixed" | "custom" | "sectioned";
  row_seat_config?: Record<string, { seats: number }>;
  seat_sections?: SeatSection[];
  aisle_width?: number;
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
  
  // Helper function to extract only valid study hall database fields
  const extractStudyHallFields = (data: any): StudyHall => {
    const {
      id,
      name,
      description,
      location,
      total_seats,
      rows,
      seats_per_row,
      custom_row_names,
      amenities,
      daily_price,
      weekly_price,
      monthly_price,
      image_url,
      status,
      latitude,
      longitude,
      formatted_address,
      layout_mode,
      row_seat_config,
      seat_sections,
      aisle_width,
      // Explicitly exclude non-database fields
      // incharges, owner, profiles, etc. are excluded by not being listed
    } = data;
    
    return {
      id,
      name,
      description,
      location,
      total_seats,
      rows,
      seats_per_row,
      custom_row_names,
      amenities,
      daily_price,
      weekly_price,
      monthly_price,
      image_url,
      status,
      latitude,
      longitude,
      formatted_address,
      layout_mode,
      row_seat_config,
      seat_sections,
      aisle_width,
    };
  };
  
  const [formData, setFormData] = useState<StudyHall>({
    name: "",
    description: "",
    location: "",
    latitude: undefined,
    longitude: undefined,
    formatted_address: "",
    total_seats: 20,
    rows: 4,
    seats_per_row: 5,
    custom_row_names: ["A", "B", "C", "D"],
    amenities: [],
    daily_price: 100,
    weekly_price: 500,
    monthly_price: 1500,
        status: "active",
        layout_mode: "fixed",
        row_seat_config: undefined,
        seat_sections: undefined,
        aisle_width: 24
  });

  const { seats, loading: seatsLoading, fetchSeats } = useSeats(studyHall?.id);

  useEffect(() => {
    if (studyHall) {
      // Clean the study hall data to exclude non-database fields
      setFormData(extractStudyHallFields(studyHall));
      if (studyHall.id) {
        fetchSeats(studyHall.id);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        location: "",
        latitude: undefined,
        longitude: undefined,
        formatted_address: "",
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

  // Remove old image upload functions as they're now handled by MultiImageUpload

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

  const handleLayoutModeChange = (mode: "fixed" | "custom" | "sectioned") => {
    setFormData(prev => {
      if (mode === "custom" && !prev.row_seat_config) {
        // Initialize custom layout with current row configuration
        const config: Record<string, { seats: number }> = {};
        prev.custom_row_names.forEach(rowName => {
          config[rowName] = { seats: prev.seats_per_row };
        });
        
        return {
          ...prev,
          layout_mode: mode,
          row_seat_config: config
        };
      }
      
      if (mode === "sectioned" && !prev.seat_sections) {
        // Initialize sectioned layout with theater-style configuration
        const leftSection: SeatSection = {
          name: "Left Section",
          position: "left",
          rows: {
            "A": { seats: 7 },
            "B": { seats: 6 },
            "C": { seats: 7 },
            "D": { seats: 6 },
            "E": { seats: 7 },
            "F": { seats: 6 },
            "G": { seats: 7 },
            "H": { seats: 6 },
          }
        };
        
        const rightSection: SeatSection = {
          name: "Right Section", 
          position: "right",
          rows: {
            "A": { seats: 8 },
            "B": { seats: 9 },
            "C": { seats: 8 },
            "D": { seats: 9 },
            "E": { seats: 8 },
            "F": { seats: 9 },
            "G": { seats: 8 },
            "H": { seats: 9 },
          }
        };
        
        const totalSeats = Object.values(leftSection.rows).reduce((sum, row) => sum + row.seats, 0) +
                          Object.values(rightSection.rows).reduce((sum, row) => sum + row.seats, 0);
        
        return {
          ...prev,
          layout_mode: mode,
          seat_sections: [leftSection, rightSection],
          aisle_width: 24,
          total_seats: totalSeats
        };
      }
      
      return {
        ...prev,
        layout_mode: mode
      };
    });
  };

  const handleCustomRowSeatsChange = (rowName: string, seats: number) => {
    setFormData(prev => {
      const newConfig = { ...prev.row_seat_config };
      newConfig[rowName] = { seats };
      
      // Calculate total seats from custom configuration
      const totalSeats = Object.values(newConfig).reduce((sum, row) => sum + row.seats, 0);
      
      return {
        ...prev,
        row_seat_config: newConfig,
        total_seats: totalSeats
      };
    });
  };

  const addCustomRow = () => {
    if (!formData.row_seat_config) return;
    
    const existingRows = Object.keys(formData.row_seat_config);
    const nextRowLetter = String.fromCharCode(65 + existingRows.length);
    
    setFormData(prev => {
      const newConfig = { ...prev.row_seat_config };
      newConfig[nextRowLetter] = { seats: 5 }; // Default 5 seats
      
      const newCustomRowNames = [...prev.custom_row_names, nextRowLetter];
      const totalSeats = Object.values(newConfig).reduce((sum, row) => sum + row.seats, 0);
      
      return {
        ...prev,
        row_seat_config: newConfig,
        custom_row_names: newCustomRowNames,
        rows: newCustomRowNames.length,
        total_seats: totalSeats
      };
    });
  };

  const removeCustomRow = (rowName: string) => {
    setFormData(prev => {
      const newConfig = { ...prev.row_seat_config };
      delete newConfig[rowName];
      
      const newCustomRowNames = prev.custom_row_names.filter(name => name !== rowName);
      const totalSeats = Object.values(newConfig).reduce((sum, row) => sum + row.seats, 0);
      
      return {
        ...prev,
        row_seat_config: newConfig,
        custom_row_names: newCustomRowNames,
        rows: newCustomRowNames.length,
        total_seats: totalSeats
      };
    });
  };

  const handleRowNameChange = (index: number, newName: string) => {
    const newCustomRowNames = [...formData.custom_row_names];
    newCustomRowNames[index] = newName;
    setFormData(prev => ({
      ...prev,
      custom_row_names: newCustomRowNames
    }));
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; formattedAddress: string }) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      formatted_address: location.formattedAddress,
      // Also update the location field with formatted address for backwards compatibility
      location: location.formattedAddress || prev.location,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total seats if using custom layout
    let finalFormData = { ...formData };
    if (formData.layout_mode === 'custom' && formData.row_seat_config) {
      const totalSeats = Object.values(formData.row_seat_config).reduce((sum, row) => sum + row.seats, 0);
      finalFormData.total_seats = totalSeats;
    }
    
    // Clean the form data before saving to ensure only database fields are included
    const cleanData = extractStudyHallFields(finalFormData);
    onSave(cleanData);
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
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

              {/* Multi-Image Upload Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Study Hall Images
                </h4>
                <MultiImageUpload
                  studyHallId={formData.id}
                  disabled={isReadOnly}
                  maxImages={10}
                  onImagesChange={(images) => {
                    // Handle image changes if needed
                    console.log('Images changed:', images);
                  }}
                />
              </div>

              {/* Seat Layout Summary Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Seat Layout Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Layout Mode:</span>
                      <Badge variant={formData.layout_mode === 'custom' ? 'default' : 'secondary'}>
                        {formData.layout_mode === 'custom' ? 'Custom Layout' : 'Fixed Grid'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Seats:</span>
                      <span className="font-medium">
                        {formData.layout_mode === 'custom' && formData.row_seat_config
                          ? Object.values(formData.row_seat_config).reduce((total: number, config: any) => total + config.seats, 0)
                          : formData.total_seats
                        }
                      </span>
                    </div>
                    {formData.layout_mode === 'fixed' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Rows:</span>
                          <span className="font-medium">{formData.rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Seats per Row:</span>
                          <span className="font-medium">{formData.seats_per_row}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {formData.layout_mode === 'custom' && formData.row_seat_config && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Custom Rows:</span>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {Object.entries(formData.row_seat_config).map(([rowName, config]: [string, any]) => (
                          <div key={rowName} className="flex justify-between text-xs">
                            <span>{rowName}:</span>
                            <span>{config.seats} seats</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {!isReadOnly && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      To modify the seat layout, use the "Seat Layout" tab above.
                    </p>
                  </div>
                 )}
               </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Study Hall Location</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set the precise location of your study hall for better discoverability
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">Address/Location Name</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter study hall address or location name"
                      disabled={mode === "view"}
                    />
                  </div>

                  {mode !== "view" && (
                    <div>
                      <Label className="text-sm font-medium">Select Location on Map</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Click on the map or search for your location to set precise coordinates
                      </p>
                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        initialLocation={
                          formData.latitude && formData.longitude
                            ? {
                                latitude: formData.latitude,
                                longitude: formData.longitude,
                                formattedAddress: formData.formatted_address || formData.location,
                              }
                            : undefined
                        }
                      />
                    </div>
                  )}

                  {formData.latitude && formData.longitude && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Coordinates:</p>
                      <p className="text-xs text-muted-foreground">
                        Latitude: {formData.latitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Longitude: {formData.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
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
                  Choose between fixed grid layout or custom variable seats per row.
                </p>
              </div>

              {/* Layout Mode Selection */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3">Layout Mode</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={formData.layout_mode === "fixed" ? "default" : "outline"}
                    onClick={() => handleLayoutModeChange("fixed")}
                    disabled={isReadOnly}
                    className="flex items-center space-x-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Fixed Grid</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.layout_mode === "custom" ? "default" : "outline"}
                    onClick={() => handleLayoutModeChange("custom")}
                    disabled={isReadOnly}
                    className="flex items-center space-x-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Custom Layout</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.layout_mode === "sectioned" ? "default" : "outline"}
                    onClick={() => handleLayoutModeChange("sectioned")}
                    disabled={isReadOnly}
                    className="flex items-center space-x-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Sectioned Layout</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.layout_mode === "fixed" 
                    ? "All rows have the same number of seats" 
                    : formData.layout_mode === "custom"
                    ? "Each row can have a different number of seats"
                    : "Theater-style layout with left/right sections and center aisle"}
                </p>
              </div>

              {/* Fixed Layout Controls */}
              {formData.layout_mode === "fixed" && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold mb-3">Fixed Grid Settings</h4>
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
                </div>
              )}

              {/* Sectioned Layout Controls */}
              {formData.layout_mode === "sectioned" && formData.seat_sections && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Sectioned Layout Configuration</h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Aisle Width (px):</Label>
                        <Input
                          type="number"
                          value={formData.aisle_width || 24}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            aisle_width: Number(e.target.value) 
                          }))}
                          className="w-20"
                          min="12"
                          max="60"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {formData.seat_sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="space-y-3">
                        <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          {section.name}
                        </h5>
                        {Object.entries(section.rows).map(([rowName, rowConfig]) => (
                          <div key={rowName} className="flex items-center space-x-3 p-2 border rounded bg-background">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-bold">
                              {rowName}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newSections = [...formData.seat_sections!];
                                      newSections[sectionIndex].rows[rowName].seats = Math.max(1, rowConfig.seats - 1);
                                      const totalSeats = newSections.reduce((sum, sec) => 
                                        sum + Object.values(sec.rows).reduce((rowSum, row) => rowSum + row.seats, 0), 0);
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        seat_sections: newSections,
                                        total_seats: totalSeats
                                      }));
                                    }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                )}
                                <span className="w-8 text-center font-medium">{rowConfig.seats}</span>
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newSections = [...formData.seat_sections!];
                                      newSections[sectionIndex].rows[rowName].seats = Math.min(15, rowConfig.seats + 1);
                                      const totalSeats = newSections.reduce((sum, sec) => 
                                        sum + Object.values(sec.rows).reduce((rowSum, row) => rowSum + row.seats, 0), 0);
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        seat_sections: newSections,
                                        total_seats: totalSeats
                                      }));
                                    }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {rowName}1-{rowName}{rowConfig.seats}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Seats:</span>
                      <span className="text-lg font-bold">{formData.total_seats}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Layout Controls */}
              {formData.layout_mode === "custom" && formData.row_seat_config && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Custom Row Configuration</h4>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomRow}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Row</span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(formData.row_seat_config).map(([rowName, config]) => (
                      <div key={rowName} className="flex items-center space-x-3 p-3 border rounded-lg bg-background">
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-sm font-bold">
                          {rowName}
                        </div>
                        
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Row {rowName} Seats</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCustomRowSeatsChange(rowName, Math.max(1, config.seats - 1))}
                              disabled={isReadOnly}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{config.seats}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCustomRowSeatsChange(rowName, Math.min(30, config.seats + 1))}
                              disabled={isReadOnly}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Seats: {rowName}1 to {rowName}{config.seats}
                        </div>
                        
                        {!isReadOnly && Object.keys(formData.row_seat_config || {}).length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomRow(rowName)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Seats:</span>
                      <span className="text-lg font-bold">{formData.total_seats}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-background border-2 border-dashed border-muted-foreground/20 rounded-xl p-8">
                {/* Layout Controls */}
                <div className="flex justify-center mb-6">
                  <div className="bg-muted px-4 py-2 rounded-full text-sm font-medium">
                    Screen / Front of Hall
                  </div>
                </div>
                
                {/* Seat Grid */}
                <div className="flex flex-col items-center space-y-4">
                  {formData.layout_mode === "sectioned" && formData.seat_sections ? (
                    // Sectioned Layout Rendering
                    <div className="w-full max-w-4xl">
                      {/* Get all unique row names from all sections */}
                      {Array.from(new Set(
                        formData.seat_sections.flatMap(section => Object.keys(section.rows))
                      )).sort().map(rowName => {
                        const leftSection = formData.seat_sections!.find(s => s.position === 'left');
                        const rightSection = formData.seat_sections!.find(s => s.position === 'right');
                        const leftRowConfig = leftSection?.rows[rowName];
                        const rightRowConfig = rightSection?.rows[rowName];
                        
                        if (!leftRowConfig && !rightRowConfig) return null;
                        
                        return (
                          <div key={rowName} className="flex items-center justify-center space-x-4">
                            {/* Row Label */}
                            <div className="w-12 h-12 bg-muted/80 rounded-lg flex items-center justify-center text-sm font-bold text-muted-foreground">
                              {rowName}
                            </div>
                            
                            {/* Left Section Seats */}
                            <div className="flex space-x-2">
                              {leftRowConfig ? Array.from({ length: leftRowConfig.seats }, (_, seatIndex) => {
                                const seatId = `${rowName}${seatIndex + 1}`;
                                const seat = seats.find(s => s.seat_id === seatId);
                                const isAvailable = seat?.is_available ?? true;
                                
                                return (
                                  <div key={seatId} className="relative group">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className={`w-14 h-14 p-0 relative transition-all duration-200 border-2 ${
                                        isAvailable 
                                          ? "border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500" 
                                          : "bg-red-50 border-red-300 text-red-700"
                                      }`}
                                      disabled={true}
                                    >
                                      <div className="text-center leading-tight">
                                        <div className="text-xs font-bold">{seatIndex + 1}</div>
                                        <div className="text-xs opacity-70">{rowName}</div>
                                      </div>
                                      {!isAvailable && (
                                        <div className="absolute inset-0 bg-red-500/10 rounded" />
                                      )}
                                    </Button>
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                      Seat {rowName}{seatIndex + 1} - {isAvailable ? "Available" : "Occupied"}
                                    </div>
                                  </div>
                                );
                              }) : null}
                            </div>
                            
                            {/* Center Aisle */}
                            <div 
                              className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg flex items-center justify-center"
                              style={{ width: `${formData.aisle_width || 24}px`, height: '32px' }}
                            >
                              <div className="w-full h-0.5 bg-muted-foreground/20 rounded"></div>
                            </div>
                            
                            {/* Right Section Seats */}
                            <div className="flex space-x-2">
                              {rightRowConfig ? Array.from({ length: rightRowConfig.seats }, (_, seatIndex) => {
                                const seatId = `${rowName}${seatIndex + 1 + (leftRowConfig?.seats || 0)}`;
                                const seat = seats.find(s => s.seat_id === seatId);
                                const isAvailable = seat?.is_available ?? true;
                                
                                return (
                                  <div key={seatId} className="relative group">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className={`w-14 h-14 p-0 relative transition-all duration-200 border-2 ${
                                        isAvailable 
                                          ? "border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500" 
                                          : "bg-red-50 border-red-300 text-red-700"
                                      }`}
                                      disabled={true}
                                    >
                                      <div className="text-center leading-tight">
                                        <div className="text-xs font-bold">{seatIndex + 1 + (leftRowConfig?.seats || 0)}</div>
                                        <div className="text-xs opacity-70">{rowName}</div>
                                      </div>
                                      {!isAvailable && (
                                        <div className="absolute inset-0 bg-red-500/10 rounded" />
                                      )}
                                    </Button>
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                      Seat {rowName}{seatIndex + 1 + (leftRowConfig?.seats || 0)} - {isAvailable ? "Available" : "Occupied"}
                                    </div>
                                  </div>
                                );
                              }) : null}
                            </div>
                            
                            {/* Row Label */}
                            <div className="w-12 h-12 bg-muted/80 rounded-lg flex items-center justify-center text-sm font-bold text-muted-foreground">
                              {rowName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : formData.layout_mode === "custom" && formData.row_seat_config ? (
                    // Custom Layout Rendering
                    Object.entries(formData.row_seat_config).map(([rowName, config], rowIndex) => (
                      <div key={rowName} className="flex items-center space-x-3">
                        {/* Row Label */}
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {rowName}
                        </div>
                        
                        {/* Seat Numbers - Variable per row */}
                        <div className="flex space-x-2">
                          {Array.from({ length: config.seats }, (_, seatIndex) => {
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
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
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
                    ))
                  ) : (
                    // Fixed Layout Rendering
                    Array.from({ length: formData.rows }, (_, rowIndex) => {
                      const rowName = formData.custom_row_names[rowIndex] || String.fromCharCode(65 + rowIndex);
                      return (
                        <div key={rowIndex} className="flex items-center space-x-3">
                          {/* Row Label */}
                          <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {rowName}
                          </div>
                          
                          {/* Seat Numbers - Fixed per row */}
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
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
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
                    })
                  )}
                </div>

                {/* Seat Status Legend and Layout Info */}
                <div className="space-y-3 mt-6">
                  <div className="flex justify-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-emerald-400 rounded-md"></div>
                      <span className="text-sm text-muted-foreground font-medium">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-red-50 border-2 border-red-300 rounded-md"></div>
                      <span className="text-sm text-muted-foreground font-medium">Occupied</span>
                    </div>
                    {formData.layout_mode === "sectioned" && (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-2 bg-muted/50 rounded-full"></div>
                        <span className="text-sm text-muted-foreground font-medium">Aisle</span>
                      </div>
                    )}
                  </div>
                  
                  {formData.layout_mode === "sectioned" && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Theater-style sectioned layout with center aisle ({formData.aisle_width || 24}px width)
                      </p>
                    </div>
                  )}
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