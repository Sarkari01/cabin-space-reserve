import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Minus } from 'lucide-react';
import type { CabinLayoutData } from '@/types/PrivateHall';
interface RowConfig {
  name: string;
  cabins: number;
  priceOverride?: number;
  depositOverride?: number;
}
interface RowBasedCabinDesignerProps {
  layout: CabinLayoutData;
  onChange: (layout: CabinLayoutData) => void;
  basePrice: number;
  baseDeposit?: number;
}
export const RowBasedCabinDesigner: React.FC<RowBasedCabinDesignerProps> = ({
  layout,
  onChange,
  basePrice,
  baseDeposit = 0
}) => {
  const [rows, setRows] = useState<RowConfig[]>([{
    name: 'A',
    cabins: 5
  }, {
    name: 'B',
    cabins: 5
  }]);
  const addRow = () => {
    const nextLetter = String.fromCharCode(65 + rows.length); // A, B, C, etc.
    setRows([...rows, {
      name: nextLetter,
      cabins: 5
    }]);
  };
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
      updateLayout(newRows);
    }
  };
  const updateRow = (index: number, updates: Partial<RowConfig>) => {
    const newRows = rows.map((row, i) => i === index ? {
      ...row,
      ...updates
    } : row);
    setRows(newRows);
    updateLayout(newRows);
  };
  const updateLayout = (currentRows: RowConfig[]) => {
    const cabins = [];
    let cabinId = 1;
    const rowHeight = 80;
    const cabinWidth = 60;
    const cabinHeight = 50;
    const rowSpacing = 20;
    currentRows.forEach((row, rowIndex) => {
      for (let cabinIndex = 0; cabinIndex < row.cabins; cabinIndex++) {
        const cabinName = `${row.name}${cabinIndex + 1}`;
        cabins.push({
          id: `cabin-${cabinId}`,
          name: cabinName,
          x: 20 + cabinIndex * (cabinWidth + 10),
          y: 20 + rowIndex * (rowHeight + rowSpacing),
          width: cabinWidth,
          height: cabinHeight,
          monthly_price: row.priceOverride || basePrice,
          refundable_deposit: row.depositOverride || baseDeposit,
          amenities: []
        });
        cabinId++;
      }
    });
    const maxCabinsPerRow = Math.max(...currentRows.map(r => r.cabins));
    const totalWidth = Math.max(600, 40 + maxCabinsPerRow * (cabinWidth + 10));
    const totalHeight = Math.max(400, 40 + currentRows.length * (rowHeight + rowSpacing));
    const newLayout: CabinLayoutData = {
      cabins,
      layout: {
        width: totalWidth,
        height: totalHeight,
        scale: 1
      }
    };
    onChange(newLayout);
  };

  // Initial layout update
  React.useEffect(() => {
    updateLayout(rows);
  }, []);
  const totalCabins = rows.reduce((sum, row) => sum + row.cabins, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.cabins * (row.priceOverride || basePrice), 0);
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Theater-Style Cabin Layout</h3>
        <Button onClick={addRow} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>

      {/* Row Configuration */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Row Configuration</Label>
        {rows.map((row, index) => <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label htmlFor={`row-name-${index}`}>Row Name</Label>
                <Input id={`row-name-${index}`} value={row.name} onChange={e => updateRow(index, {
              name: e.target.value
            })} placeholder="Row name" />
              </div>

              <div>
                <Label htmlFor={`row-cabins-${index}`}>Number of Cabins</Label>
                <Input id={`row-cabins-${index}`} type="number" min="1" max="20" value={row.cabins} onChange={e => updateRow(index, {
              cabins: parseInt(e.target.value) || 1
            })} />
              </div>

              <div>
                <Label htmlFor={`row-price-${index}`}>Price Override (Optional)</Label>
                <Input id={`row-price-${index}`} type="number" value={row.priceOverride || ''} onChange={e => updateRow(index, {
              priceOverride: e.target.value ? parseInt(e.target.value) : undefined
            })} placeholder={`Default: ₹${basePrice}`} />
              </div>

              <div>
                <Label htmlFor={`row-deposit-${index}`}>Deposit Override (Optional)</Label>
                <Input 
                  id={`row-deposit-${index}`} 
                  type="number" 
                  min="0"
                  value={row.depositOverride || ''} 
                  onChange={e => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    if (value === undefined || value >= 0) {
                      updateRow(index, { depositOverride: value });
                    } else {
                      toast.error('Deposit amount cannot be negative');
                    }
                  }} 
                  placeholder={`Default: ₹${baseDeposit}`} 
                />
              </div>

              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="text-xs">
                  {row.cabins} cabins
                </Badge>
                {rows.length > 1 && <Button variant="destructive" size="sm" onClick={() => removeRow(index)}>
                    <Minus className="h-4 w-4" />
                  </Button>}
              </div>
            </div>
          </Card>)}
      </div>

      {/* Layout Preview */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Layout Preview</Label>
        <div className="relative bg-muted/10 border-2 border-dashed border-border rounded-lg overflow-auto" style={{
        width: '100%',
        height: '400px'
      }}>
          <div className="relative" style={{
          width: layout.layout.width,
          height: layout.layout.height,
          minWidth: '100%',
          minHeight: '100%'
        }}>
      {layout.cabins.map(cabin => {
            const rowName = cabin.name.charAt(0);
            const cabinNumber = cabin.name.slice(1);
            const isAvailable = true; // Default to available in designer mode

            return <div key={cabin.id} className={`absolute border-2 rounded-lg text-xs flex flex-col justify-center items-center transition-all cursor-pointer hover:shadow-lg ${isAvailable ? 'bg-green-100 border-green-400 hover:bg-green-200' : 'bg-red-100 border-red-400'}`} style={{
              left: cabin.x,
              top: cabin.y,
              width: cabin.width,
              height: cabin.height
            }} title={`${cabin.name} - ${isAvailable ? 'Available' : 'Occupied'} - ₹${cabin.monthly_price}/month`}>
            <div className="font-bold text-center">{cabin.name}</div>
            <div className={`text-[9px] font-medium ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
              {isAvailable ? 'Available' : 'Occupied'}
            </div>
            <div className="text-[8px] text-gray-600">₹{cabin.monthly_price}</div>
          </div>;
          })}
            
            {/* Stage/Front Indicator */}
            
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Summary</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Rows:</span>
            <div className="font-semibold">{rows.length}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Cabins:</span>
            <div className="font-semibold">{totalCabins}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Base Price:</span>
            <div className="font-semibold">₹{basePrice}/month</div>
          </div>
          <div>
            <span className="text-muted-foreground">Max Monthly Revenue:</span>
            <div className="font-semibold">₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </Card>
    </div>;
};