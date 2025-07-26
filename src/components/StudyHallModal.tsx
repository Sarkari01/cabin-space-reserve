import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Grid3X3, DollarSign, Upload, X, Wifi, Snowflake, Car, Coffee, Printer, Monitor, Settings } from "lucide-react";
import { QRCodeManager } from "@/components/QRCodeManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSeats } from "@/hooks/useStudyHalls";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { useMonthlyPricing, type MonthlyPricingPlan } from "@/hooks/useMonthlyPricing";

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
  monthly_price: number;
  image_url?: string;
  status: "active" | "inactive";
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  layout_mode?: "fixed" | "custom";
  row_seat_config?: Record<string, { seats: number }>;
}

interface StudyHallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyHall?: StudyHall | null;
  onSave: (studyHall: StudyHall) => Promise<boolean>;
  loading?: boolean;
}

export const StudyHallModal = ({ open, onOpenChange, studyHall, onSave, loading }: StudyHallModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getPricingPlan, savePricingPlan } = useMonthlyPricing();

  // Main form data
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
    monthly_price: 1500,
    status: "active",
    layout_mode: "fixed",
    row_seat_config: undefined
  });

  const { seats, loading: seatsLoading, fetchSeats } = useSeats(studyHall?.id);
  
  // Pricing plans state
  const [pricingPlan, setPricingPlan] = useState<MonthlyPricingPlan | null>(null);
  const [pricingFormData, setPricingFormData] = useState<MonthlyPricingPlan>({
    merchant_id: "",
    study_hall_id: "",
    months_1_enabled: true,
    months_1_price: 1500,
    months_2_enabled: true,
    months_2_price: 2800,
    months_3_enabled: true,
    months_3_price: 4200,
    months_6_enabled: true,
    months_6_price: 8000,
    months_12_enabled: true,
    months_12_price: 15000,
  });

  // Load study hall data when modal opens
  useEffect(() => {
    if (open && studyHall) {
      setFormData({
        name: studyHall.name || "",
        description: studyHall.description || "",
        location: studyHall.location || "",
        latitude: studyHall.latitude,
        longitude: studyHall.longitude,
        formatted_address: studyHall.formatted_address,
        total_seats: studyHall.total_seats || 20,
        rows: studyHall.rows || 4,
        seats_per_row: studyHall.seats_per_row || 5,
        custom_row_names: studyHall.custom_row_names || ["A", "B", "C", "D"],
        amenities: studyHall.amenities || [],
        monthly_price: studyHall.monthly_price || 1500,
        status: studyHall.status || "active",
        layout_mode: studyHall.layout_mode || "fixed",
        row_seat_config: studyHall.row_seat_config
      });

      // Load pricing plan if editing existing study hall
      if (studyHall.id) {
        loadPricingPlan(studyHall.id);
      }
    } else if (open && !studyHall) {
      // Reset form for new study hall
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
        monthly_price: 1500,
        status: "active",
        layout_mode: "fixed",
        row_seat_config: undefined
      });

      setPricingFormData({
        merchant_id: "",
        study_hall_id: "",
        months_1_enabled: true,
        months_1_price: 1500,
        months_2_enabled: true,
        months_2_price: 2800,
        months_3_enabled: true,
        months_3_price: 4200,
        months_6_enabled: true,
        months_6_price: 8000,
        months_12_enabled: true,
        months_12_price: 15000,
      });
      setPricingPlan(null);
    }
  }, [open, studyHall]);

  const loadPricingPlan = async (studyHallId: string) => {
    const plan = await getPricingPlan(studyHallId);
    if (plan) {
      setPricingPlan(plan);
      setPricingFormData({
        ...plan,
        months_1_enabled: plan.months_1_enabled,
        months_1_price: plan.months_1_price || 1500,
        months_2_enabled: plan.months_2_enabled,
        months_2_price: plan.months_2_price || 2800,
        months_3_enabled: plan.months_3_enabled,
        months_3_price: plan.months_3_price || 4200,
        months_6_enabled: plan.months_6_enabled,
        months_6_price: plan.months_6_price || 8000,
        months_12_enabled: plan.months_12_enabled,
        months_12_price: plan.months_12_price || 15000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Name and location are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.rows < 1 || formData.seats_per_row < 1) {
      toast({
        title: "Validation Error", 
        description: "Must have at least 1 row and 1 seat per row",
        variant: "destructive",
      });
      return;
    }

    try {
      const studyHallData: StudyHall = {
        ...formData,
        total_seats: formData.layout_mode === "custom" 
          ? Object.values(formData.row_seat_config || {}).reduce((sum, row) => sum + row.seats, 0)
          : formData.rows * formData.seats_per_row
      };

      const success = await onSave(studyHallData);
      
      if (success) {
        // Save pricing plan after study hall is saved
        if (studyHallData.id || studyHall?.id) {
          const studyHallId = studyHallData.id || studyHall!.id!;
          const pricingSuccess = await savePricingPlan({
            ...pricingFormData,
            study_hall_id: studyHallId,
          });

          if (!pricingSuccess) {
            toast({
              title: "Warning",
              description: "Study hall saved but pricing plan failed to save",
              variant: "destructive",
            });
          }
        }

        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving study hall:', error);
      toast({
        title: "Error",
        description: "Failed to save study hall",
        variant: "destructive",
      });
    }
  };

  const availableAmenities = [
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "ac", label: "Air Conditioning", icon: Snowflake },
    { id: "parking", label: "Parking", icon: Car },
    { id: "cafeteria", label: "Cafeteria", icon: Coffee },
    { id: "printer", label: "Printer", icon: Printer },
    { id: "projector", label: "Projector", icon: Monitor },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {studyHall ? "Edit Study Hall" : "Add New Study Hall"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Monthly Pricing</TabsTrigger>
              <TabsTrigger value="layout">Seat Layout</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Study Hall Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter study hall name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter study hall description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <LocationPicker
                  onLocationSelect={({ latitude, longitude, formattedAddress }) => {
                    setFormData(prev => ({
                      ...prev,
                      location: formattedAddress,
                      formatted_address: formattedAddress,
                      latitude: latitude,
                      longitude: longitude
                    }));
                  }}
                  initialLocation={formData.location ? {
                    latitude: formData.latitude || 0,
                    longitude: formData.longitude || 0,
                    formattedAddress: formData.location
                  } : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_price">Base Monthly Price (₹)</Label>
                <Input
                  id="monthly_price"
                  type="number"
                  value={formData.monthly_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: Number(e.target.value) }))}
                  placeholder="1500"
                  min="1"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This is the base monthly price. You can set different pricing tiers in the Pricing tab.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Monthly Pricing Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Set different pricing for various monthly subscription periods.
                </p>

                {[
                  { key: 'months_1', label: '1 Month', enabled: 'months_1_enabled', price: 'months_1_price' },
                  { key: 'months_2', label: '2 Months', enabled: 'months_2_enabled', price: 'months_2_price' },
                  { key: 'months_3', label: '3 Months', enabled: 'months_3_enabled', price: 'months_3_price' },
                  { key: 'months_6', label: '6 Months', enabled: 'months_6_enabled', price: 'months_6_price' },
                  { key: 'months_12', label: '12 Months', enabled: 'months_12_enabled', price: 'months_12_price' },
                ].map((period) => (
                  <Card key={period.key} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={pricingFormData[period.enabled as keyof MonthlyPricingPlan] as boolean}
                          onCheckedChange={(checked) => 
                            setPricingFormData(prev => ({ ...prev, [period.enabled]: checked }))
                          }
                        />
                        <Label className="text-base font-medium">{period.label}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <Input
                          type="number"
                          value={pricingFormData[period.price as keyof MonthlyPricingPlan] as number || ''}
                          onChange={(e) => 
                            setPricingFormData(prev => ({ 
                              ...prev, 
                              [period.price]: Number(e.target.value) 
                            }))
                          }
                          placeholder="Price"
                          className="w-32"
                          min="1"
                          disabled={!(pricingFormData[period.enabled as keyof MonthlyPricingPlan] as boolean)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label>Layout Mode:</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="fixed"
                        checked={formData.layout_mode === "fixed"}
                        onChange={(e) => setFormData(prev => ({ ...prev, layout_mode: e.target.value as "fixed" | "custom" }))}
                      />
                      <span>Fixed Grid</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="custom"
                        checked={formData.layout_mode === "custom"}
                        onChange={(e) => setFormData(prev => ({ ...prev, layout_mode: e.target.value as "fixed" | "custom" }))}
                      />
                      <span>Custom Layout</span>
                    </label>
                  </div>
                </div>

                {formData.layout_mode === "fixed" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rows">Number of Rows</Label>
                      <Input
                        id="rows"
                        type="number"
                        value={formData.rows}
                        onChange={(e) => {
                          const newRows = Number(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            rows: newRows,
                            total_seats: newRows * prev.seats_per_row,
                            custom_row_names: Array.from({ length: newRows }, (_, i) => 
                              String.fromCharCode(65 + i)
                            )
                          }));
                        }}
                        min="1"
                        max="10"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seats_per_row">Seats per Row</Label>
                      <Input
                        id="seats_per_row"
                        type="number"
                        value={formData.seats_per_row}
                        onChange={(e) => {
                          const newSeatsPerRow = Number(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            seats_per_row: newSeatsPerRow,
                            total_seats: prev.rows * newSeatsPerRow
                          }));
                        }}
                        min="1"
                        max="20"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Define custom rows with varying seat counts:
                    </p>
                    {/* Custom layout editor would go here */}
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-gray-500">Custom layout editor - Coming soon</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Total Seats: <span className="font-bold">{formData.total_seats}</span></Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="space-y-4">
              <div className="space-y-4">
                <Label>Available Amenities</Label>
                <div className="grid grid-cols-2 gap-4">
                  {availableAmenities.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = formData.amenities.includes(amenity.id);
                    
                    return (
                      <Card
                        key={amenity.id}
                        className={`p-4 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            amenities: isSelected
                              ? prev.amenities.filter(a => a !== amenity.id)
                              : [...prev.amenities, amenity.id]
                          }));
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={isSelected ? 'text-primary font-medium' : 'text-foreground'}>
                            {amenity.label}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <Label>Selected Amenities:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.amenities.map((amenityId) => {
                      const amenity = availableAmenities.find(a => a.id === amenityId);
                      return amenity ? (
                        <Badge key={amenityId} variant="secondary">
                          {amenity.label}
                        </Badge>
                      ) : null;
                    })}
                    {formData.amenities.length === 0 && (
                      <span className="text-muted-foreground text-sm">No amenities selected</span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : studyHall ? "Update Study Hall" : "Create Study Hall"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};