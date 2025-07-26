import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface CustomLayoutEditorProps {
  rowSeatConfig: Record<string, { seats: number }>;
  onConfigChange: (config: Record<string, { seats: number }>) => void;
}

export function CustomLayoutEditor({ rowSeatConfig, onConfigChange }: CustomLayoutEditorProps) {
  const [newRowName, setNewRowName] = useState("");

  const addRow = () => {
    if (!newRowName.trim()) return;
    if (rowSeatConfig[newRowName]) return; // Row already exists
    
    const updatedConfig = {
      ...rowSeatConfig,
      [newRowName]: { seats: 5 }
    };
    onConfigChange(updatedConfig);
    setNewRowName("");
  };

  const removeRow = (rowName: string) => {
    const updatedConfig = { ...rowSeatConfig };
    delete updatedConfig[rowName];
    onConfigChange(updatedConfig);
  };

  const updateRowSeats = (rowName: string, seats: number) => {
    if (seats < 1) return;
    const updatedConfig = {
      ...rowSeatConfig,
      [rowName]: { seats }
    };
    onConfigChange(updatedConfig);
  };

  const rows = Object.entries(rowSeatConfig);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Row Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="newRowName">Add Row</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="newRowName"
                  value={newRowName}
                  onChange={(e) => setNewRowName(e.target.value.toUpperCase())}
                  placeholder="Row name (e.g., A, B, VIP)"
                  className="flex-1"
                  maxLength={10}
                />
                <Button 
                  type="button"
                  onClick={addRow} 
                  disabled={!newRowName.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Existing rows */}
          <div className="space-y-3">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No rows configured. Add a row to get started.
              </p>
            ) : (
              rows.map(([rowName, config]) => (
                <div key={rowName} className="flex items-center gap-3 p-3 border rounded">
                  <div className="flex-1">
                    <Label className="font-medium">Row {rowName}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`seats-${rowName}`} className="text-sm">
                      Seats:
                    </Label>
                    <Input
                      id={`seats-${rowName}`}
                      type="number"
                      value={config.seats}
                      onChange={(e) => updateRowSeats(rowName, Number(e.target.value))}
                      min="1"
                      max="30"
                      className="w-16"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRow(rowName)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {rows.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Total rows: {rows.length} | 
              Total seats: {Object.values(rowSeatConfig).reduce((sum, row) => sum + row.seats, 0)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
