import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Edit3 } from "lucide-react";

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
                <div className="text-center">
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Study Hall Layout</h4>
                    <p className="text-sm text-muted-foreground">
                      Click on any seat to set individual pricing
                    </p>
                  </div>
                  
                  <div className="inline-block bg-background border rounded-lg p-6">
                    <div className="space-y-2">
                      {Array.from({ length: formData.rows }, (_, rowIndex) => (
                        <div key={rowIndex} className="flex items-center justify-center space-x-2">
                          <span className="w-6 text-sm font-medium text-muted-foreground">
                            {String.fromCharCode(65 + rowIndex)}
                          </span>
                          {Array.from({ length: formData.seatsPerRow }, (_, seatIndex) => {
                            const seatId = `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;
                            const seat = formData.seats.find(s => s.id === seatId);
                            return (
                              <Button
                                key={seatId}
                                type="button"
                                variant={seat?.isAvailable ? "outline" : "secondary"}
                                size="sm"
                                className="w-10 h-10 p-0 relative"
                                onClick={() => seat && handleSeatClick(seat)}
                                disabled={isReadOnly}
                              >
                                <span className="text-xs">{seatIndex + 1}</span>
                                {!isReadOnly && (
                                  <Edit3 className="h-2 w-2 absolute top-0 right-0" />
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Front of Hall</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Pricing Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Daily Range:</span>
                        <span className="ml-1 font-medium">
                          ₹{Math.min(...formData.seats.map(s => s.pricing.daily))} - 
                          ₹{Math.max(...formData.seats.map(s => s.pricing.daily))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Weekly Range:</span>
                        <span className="ml-1 font-medium">
                          ₹{Math.min(...formData.seats.map(s => s.pricing.weekly))} - 
                          ₹{Math.max(...formData.seats.map(s => s.pricing.weekly))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Monthly Range:</span>
                        <span className="ml-1 font-medium">
                          ₹{Math.min(...formData.seats.map(s => s.pricing.monthly))} - 
                          ₹{Math.max(...formData.seats.map(s => s.pricing.monthly))}
                        </span>
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