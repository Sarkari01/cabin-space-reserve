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
import { useStudyHallImages } from "@/hooks/useStudyHallImages";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { Dialog as LocationDialog } from "@/components/ui/dialog";

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
    monthly_price: 0,
    image_url: "",
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [seatingCapacity, setSeatingCapacity] = useState(1);
  
  // Add pricing plan state
  const [pricingPlan, setPricingPlan] = useState({
    monthly_enabled: true,
    monthly_price: undefined as number | undefined,
  });
  const [pricingPlanLoading, setPricingPlanLoading] = useState(false);

  const { toast } = useToast();
  const { createStudyHall, updateStudyHall } = useStudyHalls();
  const { getPricingPlan, savePricingPlan } = useMerchantPricingPlans();
  const { images: hallImages, loading: imagesLoading, uploadImages, fetchImages } = useStudyHallImages(studyHall?.id);

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
        console.log('Loading pricing plan for study hall:', studyHall.id);
        setPricingPlanLoading(true);
        try {
          const plan = await getPricingPlan(studyHall.id);
          if (plan) {
            console.log('Loaded pricing plan:', plan);
            setPricingPlan({
              monthly_enabled: plan.monthly_enabled,
              monthly_price: plan.monthly_price || undefined,
            });
          } else {
            console.log('No pricing plan found, using defaults');
            setPricingPlan({
              monthly_enabled: true,
              monthly_price: studyHall.monthly_price || undefined,
            });
          }
        } catch (error) {
          console.error('Error loading pricing plan:', error);
          // Set defaults on error to prevent infinite loops
          setPricingPlan({
            monthly_enabled: true,
            monthly_price: studyHall.monthly_price || undefined,
          });
        } finally {
          setPricingPlanLoading(false);
        }
      } else if (mode === "add") {
        // Reset to defaults for new study halls
        setPricingPlan({
          monthly_enabled: true,
          monthly_price: undefined,
        });
      }
    };

    loadPricingPlan();
  }, [studyHall?.id, studyHall?.monthly_price, mode]); // Removed getPricingPlan from dependencies to prevent infinite loops

  useEffect(() => {
    if (selectedImages.length > 0) {
      const previews: string[] = [];
      selectedImages.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === selectedImages.length) {
            setPreviewImages(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setPreviewImages([]);
    }
  }, [selectedImages]);

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
    if (selectedImages.length === 0) {
      toast({
        title: "Error",
        description: "Please select images to upload",
        variant: "destructive",
      });
      return;
    }

    if (!studyHall?.id && mode !== "add") {
      toast({
        title: "Error",
        description: "Study hall must be created first before uploading images",
        variant: "destructive",
      });
      return;
    }

    setImageUploadLoading(true);

    try {
      // Validate image files
      for (const file of selectedImages) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Image ${file.name} is too large. Maximum size is 5MB.`);
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`Image ${file.name} has invalid format. Only JPEG, PNG, and WebP are allowed.`);
        }
      }

      if (studyHall?.id) {
        // Upload images for existing study hall
        await uploadImages(studyHall.id, selectedImages);
        setSelectedImages([]);
        setPreviewImages([]);
        await fetchImages(studyHall.id);
      } else {
        // For new study halls, store images temporarily (will be uploaded after creation)
        toast({
          title: "Images Ready",
          description: "Images will be uploaded after creating the study hall",
        });
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImages([]);
    setPreviewImages([]);
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
          monthly_price: formData.monthly_price,
          image_url: formData.image_url,
        });
        
        // Update pricing plan
        if (studyHallId) {
          await savePricingPlan({
            merchant_id: studyHall!.merchant_id!,
            study_hall_id: studyHallId,
            ...pricingPlan,
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
                   <div className="space-y-4">
                     <div className="flex items-center space-x-4">
                       <div className="space-y-2 flex-1">
                         <Label htmlFor="images">Select Images (Multiple)</Label>
                         <Input
                           id="images"
                           type="file"
                           accept="image/*"
                           multiple
                           onChange={(e) => {
                             const files = Array.from(e.target.files || []);
                             setSelectedImages(files);
                           }}
                           disabled={mode === "view"}
                         />
                         <p className="text-xs text-muted-foreground">
                           Max 5MB per image. JPEG, PNG, WebP supported.
                         </p>
                       </div>
                       <Button
                         type="button"
                         onClick={handleImageUpload}
                         disabled={imageUploadLoading || selectedImages.length === 0 || mode === "view"}
                       >
                         {imageUploadLoading ? "Uploading..." : "Upload"}
                       </Button>
                     </div>

                     {/* Preview selected images */}
                     {previewImages.length > 0 && (
                       <div className="space-y-2">
                         <Label>Selected Images Preview</Label>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                           {previewImages.map((preview, index) => (
                             <div key={index} className="relative">
                               <img
                                 src={preview}
                                 alt={`Preview ${index + 1}`}
                                 className="w-full h-24 object-cover rounded-md"
                               />
                               <Button
                                 variant="destructive"
                                 size="icon"
                                 className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                 onClick={() => {
                                   const newImages = selectedImages.filter((_, i) => i !== index);
                                   setSelectedImages(newImages);
                                 }}
                               >
                                 <X className="h-3 w-3" />
                               </Button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Existing uploaded images */}
                     {studyHall?.id && (
                       <div className="space-y-2">
                         <Label>Uploaded Images</Label>
                         {imagesLoading ? (
                           <div className="text-center py-4">
                             <div className="text-sm text-muted-foreground">Loading images...</div>
                           </div>
                         ) : hallImages.length > 0 ? (
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                             {hallImages.map((image) => (
                               <div key={image.id} className="relative">
                                 <img
                                   src={image.image_url}
                                   alt="Study Hall"
                                   className="w-full h-24 object-cover rounded-md"
                                 />
                                 {image.is_main && (
                                   <Badge className="absolute top-1 left-1 text-xs">Main</Badge>
                                 )}
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="text-center py-4 text-sm text-muted-foreground">
                             No images uploaded yet
                           </div>
                         )}
                       </div>
                     )}
                   </div>
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
                      {/* Note: Daily and weekly pricing has been replaced with monthly-only pricing */}

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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="latitude">Latitude</Label>
                       <Input
                         id="latitude"
                         name="latitude"
                         type="number"
                         step="any"
                         value={formData.latitude || ''}
                         onChange={handleInputChange}
                         disabled={mode === "view"}
                         placeholder="e.g., 28.6139"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="longitude">Longitude</Label>
                       <Input
                         id="longitude"
                         name="longitude"
                         type="number"
                         step="any"
                         value={formData.longitude || ''}
                         onChange={handleInputChange}
                         disabled={mode === "view"}
                         placeholder="e.g., 77.2090"
                       />
                     </div>
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
