import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Edit3, Grid3X3, DollarSign } from "lucide-react";

interface Seat {
  id: string;
  row: string;
  number: number;
  isAvailable: boolean;
  pricing: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface StudyHall {
  id?: number;
  name: string;
  description: string;
  location: string;
  totalSeats: number;
  rows: number;
  seatsPerRow: number;
  seats: Seat[];
  status: "active" | "pending" | "suspended";
}

interface StudyHallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studyHall: StudyHall) => void;
  studyHall?: StudyHall;
  mode: "add" | "edit" | "view";
}

export function StudyHallModal({ isOpen, onClose, onSave, studyHall, mode }: StudyHallModalProps) {
  const [formData, setFormData] = useState<StudyHall>({
    name: "",
    description: "",
    location: "",
    totalSeats: 20,
    rows: 4,
    seatsPerRow: 5,
    seats: [],
    status: "pending"
  });

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [seatPricingOpen, setSeatPricingOpen] = useState(false);

  useEffect(() => {
    if (studyHall) {
      setFormData(studyHall);
    } else {
      // Generate default seat layout
      generateSeats(4, 5);
    }
  }, [studyHall, isOpen]);

  const generateSeats = (rows: number, seatsPerRow: number) => {
    const seats: Seat[] = [];
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    for (let r = 0; r < rows; r++) {
      for (let s = 1; s <= seatsPerRow; s++) {
        seats.push({
          id: `${rowLabels[r]}${s}`,
          row: rowLabels[r],
          number: s,
          isAvailable: true,
          pricing: {
            daily: 100,
            weekly: 500,
            monthly: 1500
          }
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      seats,
      totalSeats: rows * seatsPerRow,
      rows,
      seatsPerRow
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleLayoutChange = (field: 'rows' | 'seatsPerRow', value: number) => {
    const newRows = field === 'rows' ? value : formData.rows;
    const newSeatsPerRow = field === 'seatsPerRow' ? value : formData.seatsPerRow;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    generateSeats(newRows, newSeatsPerRow);
  };

  const handleSeatClick = (seat: Seat) => {
    if (mode === "view") return;
    setSelectedSeat(seat);
    setSeatPricingOpen(true);
  };

  const updateSeatPricing = (pricing: { daily: number; weekly: number; monthly: number }) => {
    if (!selectedSeat) return;
    
    setFormData(prev => ({
      ...prev,
      seats: prev.seats.map(seat =>
        seat.id === selectedSeat.id
          ? { ...seat, pricing }
          : seat
      )
    }));
    
    setSeatPricingOpen(false);
    setSelectedSeat(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isReadOnly = mode === "view";

  return (
    <>
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Basic Details</TabsTrigger>
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
                        onClick={() => handleLayoutChange('seatsPerRow', Math.max(1, formData.seatsPerRow - 1))}
                        disabled={isReadOnly}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{formData.seatsPerRow}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLayoutChange('seatsPerRow', Math.min(20, formData.seatsPerRow + 1))}
                        disabled={isReadOnly}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Total Seats</Label>
                    <div className="text-2xl font-bold text-center py-2">
                      {formData.totalSeats}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Grid3X3 className="h-5 w-5" />
                    <h4 className="font-semibold">Study Hall Seat Layout</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click on any seat to set individual pricing. Layout updates in real-time.
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
                    {Array.from({ length: formData.rows }, (_, rowIndex) => (
                      <div key={rowIndex} className="flex items-center space-x-3">
                        {/* Row Label */}
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {String.fromCharCode(65 + rowIndex)}
                        </div>
                        
                        {/* Seat Numbers */}
                        <div className="flex space-x-2">
                          {Array.from({ length: formData.seatsPerRow }, (_, seatIndex) => {
                            const seatId = `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;
                            const seat = formData.seats.find(s => s.id === seatId);
                            return (
                              <div key={seatId} className="relative group">
                                <Button
                                  type="button"
                                  variant={seat?.isAvailable ? "outline" : "secondary"}
                                  size="sm"
                                  className="w-12 h-12 p-0 relative hover:bg-primary/10 transition-colors"
                                  onClick={() => seat && handleSeatClick(seat)}
                                  disabled={isReadOnly}
                                >
                                  <div className="text-center">
                                    <div className="text-xs font-medium">{seatIndex + 1}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {seat ? `₹${seat.pricing.daily}` : '₹100'}
                                    </div>
                                  </div>
                                  {!isReadOnly && (
                                    <Edit3 className="h-3 w-3 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Row Number */}
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {String.fromCharCode(65 + rowIndex)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pricing Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground mb-1">Daily Range</div>
                        <div className="font-medium">
                          {formatCurrency(Math.min(...formData.seats.map(s => s.pricing.daily)))} - 
                          {formatCurrency(Math.max(...formData.seats.map(s => s.pricing.daily)))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground mb-1">Weekly Range</div>
                        <div className="font-medium">
                          {formatCurrency(Math.min(...formData.seats.map(s => s.pricing.weekly)))} - 
                          {formatCurrency(Math.max(...formData.seats.map(s => s.pricing.weekly)))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground mb-1">Monthly Range</div>
                        <div className="font-medium">
                          {formatCurrency(Math.min(...formData.seats.map(s => s.pricing.monthly)))} - 
                          {formatCurrency(Math.max(...formData.seats.map(s => s.pricing.monthly)))}
                        </div>
                      </div>
                    </div>
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

      {/* Seat Pricing Modal */}
      <Dialog open={seatPricingOpen} onOpenChange={setSeatPricingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Pricing for Seat {selectedSeat?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedSeat && (
            <SeatPricingForm
              seat={selectedSeat}
              onSave={updateSeatPricing}
              onCancel={() => setSeatPricingOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SeatPricingForm({ 
  seat, 
  onSave, 
  onCancel 
}: { 
  seat: Seat; 
  onSave: (pricing: { daily: number; weekly: number; monthly: number }) => void;
  onCancel: () => void;
}) {
  const [pricing, setPricing] = useState(seat.pricing);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(pricing);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="daily">Daily Rate (₹)</Label>
        <Input
          id="daily"
          type="number"
          value={pricing.daily}
          onChange={(e) => setPricing(prev => ({ ...prev, daily: Number(e.target.value) }))}
          min="1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="weekly">Weekly Rate (₹)</Label>
        <Input
          id="weekly"
          type="number"
          value={pricing.weekly}
          onChange={(e) => setPricing(prev => ({ ...prev, weekly: Number(e.target.value) }))}
          min="1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="monthly">Monthly Rate (₹)</Label>
        <Input
          id="monthly"
          type="number"
          value={pricing.monthly}
          onChange={(e) => setPricing(prev => ({ ...prev, monthly: Number(e.target.value) }))}
          min="1"
          required
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Pricing</Button>
      </div>
    </form>
  );
}