import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Users, Calendar, DollarSign, Settings, BarChart3, BookOpen, Upload, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStudyHalls } from "@/hooks/useStudyHalls";
import { useMerchantPricingPlans } from "@/hooks/useMerchantPricingPlans";
import { useStudyHallImages } from "@/hooks/useStudyHallImages";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { SeatingConfigurator } from "./SeatingConfigurator";
import { OperatingHours } from "./OperatingHours";
import { StudyHallTemplates } from "./StudyHallTemplates";
import { StudyHallAnalytics } from "./StudyHallAnalytics";
import { Dialog as LocationDialog } from "@/components/ui/dialog";

import { StudyHallData } from "@/types/StudyHall";

interface EnhancedStudyHallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyHall?: StudyHallData | null;
  mode: "add" | "edit" | "view";
  onSuccess?: () => void;
}

export function EnhancedStudyHallModal({ 
  open, 
  onOpenChange, 
  studyHall, 
  mode, 
  onSuccess 
}: EnhancedStudyHallModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    formatted_address: "",
    latitude: 0,
    longitude: 0,
    total_seats: 1,
    rows: 1,
    seats_per_row: 1,
    custom_row_names: [] as string[],
    amenities: [] as string[],
    monthly_price: 0,
    image_url: "",
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [seatingLayout, setSeatingLayout] = useState<any[]>([]);
  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  
  const [pricingPlan, setPricingPlan] = useState({
    monthly_enabled: true,
    monthly_price: undefined as number | undefined,
  });

  const { toast } = useToast();
  const { createStudyHall, updateStudyHall } = useStudyHalls();
  const { getPricingPlan, savePricingPlan } = useMerchantPricingPlans();
  const { images: hallImages, loading: imagesLoading, uploadImages, fetchImages } = useStudyHallImages(studyHall?.id);

  // Initialize form data
  useEffect(() => {
    if (studyHall) {
      setFormData({
        name: studyHall.name,
        description: studyHall.description || "",
        location: studyHall.location,
        formatted_address: studyHall.formatted_address || "",
        latitude: studyHall.latitude || 0,
        longitude: studyHall.longitude || 0,
        total_seats: studyHall.total_seats,
        rows: studyHall.rows,
        seats_per_row: studyHall.seats_per_row,
        custom_row_names: studyHall.custom_row_names,
        amenities: studyHall.amenities,
        monthly_price: studyHall.monthly_price,
        image_url: studyHall.image_url || "",
      });
      setSelectedAmenities(studyHall.amenities);
    } else {
      // Reset for add mode
      setFormData({
        name: "",
        description: "",
        location: "",
        formatted_address: "",
        latitude: 0,
        longitude: 0,
        total_seats: 1,
        rows: 1,
        seats_per_row: 1,
        custom_row_names: [],
        amenities: [],
        monthly_price: 0,
        image_url: "",
      });
      setSelectedAmenities([]);
    }
  }, [studyHall]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (amenity: string) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenity)) {
        return prev.filter(a => a !== amenity);
      } else {
        return [...prev, amenity];
      }
    });
  };

  const handleTemplateSelect = (template: any) => {
    setFormData(prev => ({
      ...prev,
      total_seats: template.totalSeats,
      rows: template.layout.rows,
      seats_per_row: template.layout.seatsPerRow,
      monthly_price: template.defaultPrice,
    }));
    setSelectedAmenities(template.amenities);
    toast({
      title: "Template Applied",
      description: `${template.name} configuration has been applied`,
    });
  };

  const handleSeatingChange = (data: { layout: any[], totalSeats: number }) => {
    setSeatingLayout(data.layout);
    setFormData(prev => ({ ...prev, total_seats: data.totalSeats }));
  };

  const handleOperatingHoursChange = (hours: any[], holidayList: any[]) => {
    setOperatingHours(hours);
    setHolidays(holidayList);
  };

  const handleLocationSelect = (locationData: { latitude: number; longitude: number; formattedAddress: string }) => {
    setFormData(prev => ({ 
      ...prev, 
      location: locationData.formattedAddress,
      formatted_address: locationData.formattedAddress, 
      latitude: locationData.latitude, 
      longitude: locationData.longitude 
    }));
    setLocationPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "view") return;
    
    if (!formData.name || !formData.description || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const studyHallData = {
        ...formData,
        amenities: selectedAmenities,
        status: "active",
      };

      if (mode === "add") {
        const result = await createStudyHall(studyHallData);
        if (result?.data?.id) {
          // Save additional configurations
          await savePricingPlan({
            merchant_id: result.data.merchant_id || "", 
            study_hall_id: result.data.id,
            ...pricingPlan,
          });
        }
        toast({
          title: "Success",
          description: "Study hall created successfully with advanced configuration",
        });
      } else if (mode === "edit") {
        await updateStudyHall(studyHall!.id, studyHallData);
        await savePricingPlan({
          merchant_id: studyHall!.merchant_id!,
          study_hall_id: studyHall!.id,
          ...pricingPlan,
        });
        toast({
          title: "Success",
          description: "Study hall updated successfully",
        });
      }
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving study hall:', error);
      toast({
        title: "Error",
        description: "Failed to save study hall",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create Advanced Study Hall" : 
             mode === "edit" ? "Edit Study Hall" : "Study Hall Management"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Create a study hall with advanced configuration options" :
             mode === "edit" ? "Update the study hall with advanced settings" : 
             "Manage all aspects of your study hall"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="seating">Seating</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Study Hall Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        disabled={mode === "view"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["wifi", "coffee", "printer", "car", "monitor", "ac", "security", "charging"].map(amenity => (
                      <Button
                        key={amenity}
                        type="button"
                        variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                        onClick={() => handleAmenityChange(amenity)}
                        disabled={mode === "view"}
                        className="justify-start"
                      >
                        {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <StudyHallTemplates
                onTemplateSelect={handleTemplateSelect}
                onSaveTemplate={() => {}}
                disabled={mode === "view"}
              />
            </TabsContent>

            <TabsContent value="seating" className="space-y-6">
              <SeatingConfigurator
                totalSeats={formData.total_seats}
                onSeatingChange={handleSeatingChange}
                disabled={mode === "view"}
              />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_price">Monthly Price (₹)</Label>
                    <Input
                      id="monthly_price"
                      name="monthly_price"
                      type="number"
                      value={formData.monthly_price}
                      onChange={handleInputChange}
                      disabled={mode === "view"}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      disabled={mode === "view"}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => setLocationPickerOpen(true)}
                    disabled={mode === "view"}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Pick Location on Map
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="space-y-6">
              <OperatingHours
                onHoursChange={handleOperatingHoursChange}
                disabled={mode === "view"}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <StudyHallAnalytics
                studyHallId={studyHall?.id}
                disabled={mode === "view"}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {mode !== "view" && (
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Study Hall"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>

      {/* Location Picker Dialog */}
      <LocationDialog open={locationPickerOpen} onOpenChange={setLocationPickerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Study Hall Location</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </LocationDialog>
    </Dialog>
  );
}