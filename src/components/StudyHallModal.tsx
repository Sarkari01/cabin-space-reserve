import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Users, Calendar, DollarSign, Wifi, Car, Coffee, Printer, Monitor, Plus, X, Upload, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStudyHalls } from "@/hooks/useStudyHalls";
import { useMerchantPricingPlans } from "@/hooks/useMerchantPricingPlans";
// MapLocationPicker component will be implemented when needed

import { StudyHallData } from "@/types/StudyHall";

interface StudyHallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyHall?: StudyHallData | null;
  mode: "add" | "edit" | "view";
  onSuccess?: () => void;
}

export function StudyHallModal({ open, onOpenChange, studyHall, mode, onSuccess }: StudyHallModalProps) {
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
    daily_price: 0,
    weekly_price: 0,
    monthly_price: 0,
    image_url: "",
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [seatingCapacity, setSeatingCapacity] = useState(1);
  
  // Add pricing plan state
  const [pricingPlan, setPricingPlan] = useState({
    daily_enabled: true,
    daily_price: undefined as number | undefined,
    weekly_enabled: true,
    weekly_price: undefined as number | undefined,
    monthly_enabled: true,
    monthly_price: undefined as number | undefined,
  });
  const [pricingPlanLoading, setPricingPlanLoading] = useState(false);

  const { toast } = useToast();
  const { createStudyHall, updateStudyHall } = useStudyHalls();
  const { getPricingPlan, savePricingPlan } = useMerchantPricingPlans();

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
        daily_price: studyHall.daily_price,
        weekly_price: studyHall.weekly_price,
        monthly_price: studyHall.monthly_price,
        image_url: studyHall.image_url || "",
      });
      setSelectedAmenities(studyHall.amenities);
      setSeatingCapacity(studyHall.total_seats);
    } else {
      // Reset form data when studyHall is null (for add mode)
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
        custom_row_names: [] as string[],
        amenities: [] as string[],
        daily_price: 0,
        weekly_price: 0,
        monthly_price: 0,
        image_url: "",
      });
      setSelectedAmenities([]);
      setSeatingCapacity(1);
    }
  }, [studyHall]);

  // Load pricing plan for existing study halls
  useEffect(() => {
    const loadPricingPlan = async () => {
      if (studyHall?.id && (mode === "edit" || mode === "view")) {
        setPricingPlanLoading(true);
        try {
          const plan = await getPricingPlan(studyHall.id);
          if (plan) {
            setPricingPlan({
              daily_enabled: plan.daily_enabled,
              daily_price: plan.daily_price || undefined,
              weekly_enabled: plan.weekly_enabled,
              weekly_price: plan.weekly_price || undefined,
              monthly_enabled: plan.monthly_enabled,
              monthly_price: plan.monthly_price || undefined,
            });
          }
        } catch (error) {
          console.error('Error loading pricing plan:', error);
        } finally {
          setPricingPlanLoading(false);
        }
      }
    };

    loadPricingPlan();
  }, [studyHall?.id, mode, getPricingPlan]);

  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      setPreviewImage(null);
    }
  }, [selectedImage]);

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

  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast({
        title: "Error",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setImageUploadLoading(true);

    try {
      // For now, we'll just show the preview - actual upload functionality to be implemented
      setFormData(prev => ({ ...prev, image_url: previewImage || "" }));
      toast({
        title: "Success",
        description: "Image selected successfully",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
    setSelectedImage(null);
    setPreviewImage(null);
  };

  const handleLocationSelect = (location: string, address: string, latitude: number, longitude: number) => {
    setFormData(prev => ({ ...prev, location, formatted_address: address, latitude, longitude }));
    setLocationPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "view") return;
    
    if (!formData.name || !formData.description || !formData.location || !formData.formatted_address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      let studyHallId = studyHall?.id;
      
      if (mode === "add") {
        // Create new study hall
        const result = await createStudyHall({
          name: formData.name,
          description: formData.description,
          location: formData.location,
          formatted_address: formData.formatted_address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          total_seats: seatingCapacity,
          rows: Math.ceil(seatingCapacity / 10),
          seats_per_row: Math.min(seatingCapacity, 10),
          custom_row_names: formData.custom_row_names,
          amenities: selectedAmenities,
          daily_price: formData.daily_price,
          weekly_price: formData.weekly_price,
          monthly_price: formData.monthly_price,
          image_url: formData.image_url,
          status: "active",
        });
        
        if (result?.data?.id) {
          studyHallId = result.data.id;
        
          // Save pricing plan after creating study hall
          try {
            await savePricingPlan({
              merchant_id: result.data.merchant_id || "", 
              study_hall_id: studyHallId,
              ...pricingPlan,
            });
          } catch (error) {
            console.error('Error saving pricing plan:', error);
          }
        }
        
        toast({
          title: "Success",
          description: "Study hall created successfully with pricing plan",
        });
      } else if (mode === "edit") {
        // Update existing study hall
        await updateStudyHall(studyHall!.id, {
          name: formData.name,
          description: formData.description,
          location: formData.location,
          formatted_address: formData.formatted_address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          total_seats: seatingCapacity,
          amenities: selectedAmenities,
          daily_price: formData.daily_price,
          weekly_price: formData.weekly_price,
          monthly_price: formData.monthly_price,
          image_url: formData.image_url,
        });
        
        // Update pricing plan
        if (studyHallId) {
          await savePricingPlan({
            merchant_id: studyHall!.merchant_id,
            study_hall_id: studyHallId,
            ...pricingPlan,
            daily_price: pricingPlan.daily_enabled ? pricingPlan.daily_price : null,
            weekly_price: pricingPlan.weekly_enabled ? pricingPlan.weekly_price : null,
            monthly_price: pricingPlan.monthly_enabled ? pricingPlan.monthly_price : null,
          });
        }
        
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

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setSeatingCapacity(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create New Study Hall" : 
             mode === "edit" ? "Edit Study Hall" : "Study Hall Details"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Fill in the details to create a new study hall" :
             mode === "edit" ? "Update the study hall information" : 
             "View study hall information"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="seating">Seating</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    General information about the study hall.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
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
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Amenities
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select the amenities available at the study hall.
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["wifi", "coffee", "printer", "car", "monitor"].map(amenity => (
                      <Button
                        key={amenity}
                        variant={selectedAmenities.includes(amenity) ? "secondary" : "outline"}
                        onClick={() => handleAmenityChange(amenity)}
                        disabled={mode === "view"}
                      >
                        {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Images
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload images of the study hall.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="space-y-2">
                      <Label htmlFor="image">Select Image</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedImage(file);
                        }}
                        disabled={mode === "view"}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={imageUploadLoading || mode === "view"}
                    >
                      {imageUploadLoading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>

                  {previewImage && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="object-cover rounded-md"
                      />
                    </div>
                  )}

                  {formData.image_url && (
                    <div className="relative max-w-md">
                      <img
                        src={formData.image_url}
                        alt="Study Hall"
                        className="object-cover rounded-md aspect-video w-full"
                      />
                      {mode !== "view" && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 rounded-full"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seating" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Seating Capacity
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set the seating capacity for the study hall.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                      <Label htmlFor="total_seats">Total Seats</Label>
                      <Input
                        id="total_seats"
                        type="number"
                        min="1"
                        value={seatingCapacity}
                        onChange={handleCapacityChange}
                        required
                        disabled={mode === "view"}
                      />
                    </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Custom Pricing Plans
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure custom pricing for different booking periods. If disabled, default study hall prices will be used.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pricingPlanLoading ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-muted-foreground">Loading pricing plans...</div>
                    </div>
                  ) : (
                    <>
                      {/* Daily Pricing */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">Daily Pricing</h4>
                            <p className="text-xs text-muted-foreground">Price per day</p>
                          </div>
                          <Switch
                            checked={pricingPlan.daily_enabled}
                            onCheckedChange={(checked) => 
                              setPricingPlan(prev => ({ ...prev, daily_enabled: checked }))
                            }
                            disabled={mode === "view"}
                          />
                        </div>
                        {pricingPlan.daily_enabled && (
                          <div>
                            <Label htmlFor="daily_price">Daily Price (₹)</Label>
                            <Input
                              id="daily_price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={pricingPlan.daily_price || ''}
                              onChange={(e) => 
                                setPricingPlan(prev => ({ 
                                  ...prev, 
                                  daily_price: e.target.value ? parseFloat(e.target.value) : undefined 
                                }))
                              }
                              placeholder="Enter daily price"
                              disabled={mode === "view"}
                            />
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Weekly Pricing */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">Weekly Pricing</h4>
                            <p className="text-xs text-muted-foreground">Price per week</p>
                          </div>
                          <Switch
                            checked={pricingPlan.weekly_enabled}
                            onCheckedChange={(checked) => 
                              setPricingPlan(prev => ({ ...prev, weekly_enabled: checked }))
                            }
                            disabled={mode === "view"}
                          />
                        </div>
                        {pricingPlan.weekly_enabled && (
                          <div>
                            <Label htmlFor="weekly_price">Weekly Price (₹)</Label>
                            <Input
                              id="weekly_price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={pricingPlan.weekly_price || ''}
                              onChange={(e) => 
                                setPricingPlan(prev => ({ 
                                  ...prev, 
                                  weekly_price: e.target.value ? parseFloat(e.target.value) : undefined 
                                }))
                              }
                              placeholder="Enter weekly price"
                              disabled={mode === "view"}
                            />
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Monthly Pricing */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">Monthly Pricing</h4>
                            <p className="text-xs text-muted-foreground">Price per month</p>
                          </div>
                          <Switch
                            checked={pricingPlan.monthly_enabled}
                            onCheckedChange={(checked) => 
                              setPricingPlan(prev => ({ ...prev, monthly_enabled: checked }))
                            }
                            disabled={mode === "view"}
                          />
                        </div>
                        {pricingPlan.monthly_enabled && (
                          <div>
                            <Label htmlFor="monthly_price">Monthly Price (₹)</Label>
                            <Input
                              id="monthly_price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={pricingPlan.monthly_price || ''}
                              onChange={(e) => 
                                setPricingPlan(prev => ({ 
                                  ...prev, 
                                  monthly_price: e.target.value ? parseFloat(e.target.value) : undefined 
                                }))
                              }
                              placeholder="Enter monthly price"
                              disabled={mode === "view"}
                            />
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">Pricing Notes:</p>
                            <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                              <li>Enabled periods with valid prices will be available for booking</li>
                              <li>Disabled periods will fall back to default study hall pricing</li>
                              <li>Leave price empty to disable that pricing period</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set the location of the study hall.
                  </p>
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
                  <div className="space-y-2">
                    <Label htmlFor="formatted_address">Address</Label>
                    <Input
                      id="formatted_address"
                      name="formatted_address"
                      value={formData.formatted_address}
                      onChange={handleInputChange}
                      required
                      disabled={mode === "view"}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => setLocationPickerOpen(true)}
                    disabled={mode === "view"}
                  >
                    Pick Location on Map
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {mode !== "view" && (
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>

      {/* MapLocationPicker component will be implemented when needed */}
    </Dialog>
  );
}
