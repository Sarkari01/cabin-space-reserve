import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Minus, Grid, RotateCcw } from "lucide-react";

interface SeatConfig {
  id: string;
  row: string;
  number: number;
  type: 'regular' | 'vip' | 'disabled';
  available: boolean;
}

interface SeatingConfiguratorProps {
  totalSeats: number;
  onSeatingChange: (seating: { layout: SeatConfig[], totalSeats: number }) => void;
  disabled?: boolean;
  initialLayout?: SeatConfig[];
}

export function SeatingConfigurator({ 
  totalSeats, 
  onSeatingChange, 
  disabled = false,
  initialLayout = []
}: SeatingConfiguratorProps) {
  const [rows, setRows] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [layout, setLayout] = useState<SeatConfig[]>([]);
  const [customRowNames, setCustomRowNames] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  // Generate layout based on rows and seats per row
  const generateLayout = () => {
    const newLayout: SeatConfig[] = [];
    const rowNames = customRowNames.length > 0 ? customRowNames : 
      Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)); // A, B, C...

    for (let r = 0; r < rows; r++) {
      const rowName = rowNames[r] || String.fromCharCode(65 + r);
      for (let s = 1; s <= seatsPerRow; s++) {
        newLayout.push({
          id: `${rowName}${s}`,
          row: rowName,
          number: s,
          type: 'regular',
          available: true
        });
      }
    }
    return newLayout;
  };

  // Initialize layout
  useEffect(() => {
    if (initialLayout.length > 0) {
      setLayout(initialLayout);
    } else {
      const newLayout = generateLayout();
      setLayout(newLayout);
      onSeatingChange({ layout: newLayout, totalSeats: newLayout.length });
    }
  }, []);

  // Update layout when rows or seatsPerRow changes
  useEffect(() => {
    if (layout.length === 0) return; // Don't update during initial load
    const newLayout = generateLayout();
    setLayout(newLayout);
    onSeatingChange({ layout: newLayout, totalSeats: newLayout.length });
  }, [rows, seatsPerRow, customRowNames]);

  const handleSeatTypeChange = (seatId: string, type: 'regular' | 'vip' | 'disabled') => {
    const newLayout = layout.map(seat => 
      seat.id === seatId ? { ...seat, type } : seat
    );
    setLayout(newLayout);
    onSeatingChange({ layout: newLayout, totalSeats: newLayout.length });
  };

  const handleRowNameChange = (index: number, name: string) => {
    const newNames = [...customRowNames];
    newNames[index] = name;
    setCustomRowNames(newNames);
  };

  const resetLayout = () => {
    const newLayout = generateLayout();
    setLayout(newLayout);
    onSeatingChange({ layout: newLayout, totalSeats: newLayout.length });
  };

  const getSeatColor = (seat: SeatConfig) => {
    if (seat.type === 'vip') return 'bg-yellow-400 hover:bg-yellow-500';
    if (seat.type === 'disabled') return 'bg-gray-400';
    return 'bg-blue-400 hover:bg-blue-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Layout Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rows">Number of Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="seatsPerRow">Seats per Row</Label>
              <Input
                id="seatsPerRow"
                type="number"
                min="1"
                max="30"
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(parseInt(e.target.value) || 1)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={resetLayout}
                disabled={disabled}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Layout
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Row Names (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Array.from({ length: rows }, (_, i) => (
                <Input
                  key={i}
                  placeholder={`Row ${String.fromCharCode(65 + i)}`}
                  value={customRowNames[i] || ''}
                  onChange={(e) => handleRowNameChange(i, e.target.value)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seating Layout Preview
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span>Regular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Disabled</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: rows }, (_, rowIndex) => {
              const rowSeats = layout.filter(seat => seat.row === (customRowNames[rowIndex] || String.fromCharCode(65 + rowIndex)));
              return (
                <div key={rowIndex} className="flex items-center gap-2">
                  <Badge variant="outline" className="min-w-[40px] justify-center">
                    {customRowNames[rowIndex] || String.fromCharCode(65 + rowIndex)}
                  </Badge>
                  <div className="flex gap-1 flex-wrap">
                    {rowSeats.map(seat => (
                      <Button
                        key={seat.id}
                        variant="outline"
                        size="sm"
                        className={`w-8 h-8 p-0 ${getSeatColor(seat)} ${selectedSeat === seat.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedSeat(selectedSeat === seat.id ? null : seat.id)}
                        disabled={disabled}
                      >
                        {seat.number}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSeat && (
            <div className="mt-4 p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Configure Seat: {selectedSeat}</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={layout.find(s => s.id === selectedSeat)?.type === 'regular' ? 'default' : 'outline'}
                  onClick={() => handleSeatTypeChange(selectedSeat, 'regular')}
                  disabled={disabled}
                >
                  Regular
                </Button>
                <Button
                  size="sm"
                  variant={layout.find(s => s.id === selectedSeat)?.type === 'vip' ? 'default' : 'outline'}
                  onClick={() => handleSeatTypeChange(selectedSeat, 'vip')}
                  disabled={disabled}
                >
                  VIP
                </Button>
                <Button
                  size="sm"
                  variant={layout.find(s => s.id === selectedSeat)?.type === 'disabled' ? 'default' : 'outline'}
                  onClick={() => handleSeatTypeChange(selectedSeat, 'disabled')}
                  disabled={disabled}
                >
                  Disabled
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Total Seats: {layout.length} | Regular: {layout.filter(s => s.type === 'regular').length} | VIP: {layout.filter(s => s.type === 'vip').length} | Disabled: {layout.filter(s => s.type === 'disabled').length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}