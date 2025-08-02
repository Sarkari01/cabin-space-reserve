import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { CabinLayoutData } from '@/types/PrivateHall';

interface CabinLayoutDesignerProps {
  layout: CabinLayoutData;
  onChange: (layout: CabinLayoutData) => void;
  basePrice: number;
}

export const CabinLayoutDesigner: React.FC<CabinLayoutDesignerProps> = ({
  layout,
  onChange,
  basePrice,
}) => {
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);
  const [isAddingCabin, setIsAddingCabin] = useState(false);
  const [newCabinName, setNewCabinName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const addCabin = () => {
    if (!newCabinName.trim()) {
      toast.error('Please enter a cabin name');
      return;
    }

    const newCabin = {
      id: `cabin-${Date.now()}`,
      name: newCabinName.trim(),
      x: 50,
      y: 50,
      width: 80,
      height: 60,
      monthly_price: basePrice,
      amenities: [],
    };

    onChange({
      ...layout,
      cabins: [...layout.cabins, newCabin],
    });

    setNewCabinName('');
    setIsAddingCabin(false);
    toast.success('Cabin added successfully');
  };

  const updateCabin = (cabinId: string, updates: Partial<typeof layout.cabins[0]>) => {
    const updatedCabins = layout.cabins.map(cabin =>
      cabin.id === cabinId ? { ...cabin, ...updates } : cabin
    );

    onChange({
      ...layout,
      cabins: updatedCabins,
    });
  };

  const deleteCabin = (cabinId: string) => {
    const updatedCabins = layout.cabins.filter(cabin => cabin.id !== cabinId);
    onChange({
      ...layout,
      cabins: updatedCabins,
    });
    setSelectedCabin(null);
    toast.success('Cabin deleted');
  };

  const handleCabinClick = (cabinId: string) => {
    setSelectedCabin(selectedCabin === cabinId ? null : cabinId);
  };

  const selectedCabinData = layout.cabins.find(cabin => cabin.id === selectedCabin);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cabin Layout Designer</h3>
        <Button
          onClick={() => setIsAddingCabin(true)}
          disabled={isAddingCabin}
        >
          Add Cabin
        </Button>
      </div>

      {isAddingCabin && (
        <Card className="p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="cabin-name">Cabin Name</Label>
              <Input
                id="cabin-name"
                value={newCabinName}
                onChange={(e) => setNewCabinName(e.target.value)}
                placeholder="Enter cabin name"
              />
            </div>
            <Button onClick={addCabin}>Add</Button>
            <Button variant="outline" onClick={() => setIsAddingCabin(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div
              ref={canvasRef}
              className="relative bg-muted/20 border-2 border-dashed border-border rounded-lg overflow-hidden"
              style={{ 
                width: layout.layout.width, 
                height: layout.layout.height,
                minHeight: '400px',
              }}
            >
              {layout.cabins.map((cabin) => (
                <div
                  key={cabin.id}
                  className={`absolute bg-primary/20 border-2 rounded cursor-pointer transition-all hover:bg-primary/30 ${
                    selectedCabin === cabin.id 
                      ? 'border-primary bg-primary/40' 
                      : 'border-primary/50'
                  }`}
                  style={{
                    left: cabin.x,
                    top: cabin.y,
                    width: cabin.width,
                    height: cabin.height,
                  }}
                  onClick={() => handleCabinClick(cabin.id)}
                >
                  <div className="p-2 text-xs font-medium text-center">
                    {cabin.name}
                  </div>
                  <div className="absolute bottom-1 left-1 text-xs text-muted-foreground">
                    ₹{cabin.monthly_price || basePrice}
                  </div>
                </div>
              ))}
              
              {layout.cabins.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Click "Add Cabin" to start designing your layout
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Properties Panel */}
        <div>
          <Card className="p-4">
            <h4 className="font-semibold mb-4">
              {selectedCabin ? 'Cabin Properties' : 'Layout Properties'}
            </h4>
            
            {selectedCabinData ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cabin-name-edit">Cabin Name</Label>
                  <Input
                    id="cabin-name-edit"
                    value={selectedCabinData.name}
                    onChange={(e) => updateCabin(selectedCabin!, { name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="cabin-price">Monthly Price</Label>
                  <Input
                    id="cabin-price"
                    type="number"
                    value={selectedCabinData.monthly_price || basePrice}
                    onChange={(e) => updateCabin(selectedCabin!, { monthly_price: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cabin-x">X Position</Label>
                    <Input
                      id="cabin-x"
                      type="number"
                      value={selectedCabinData.x}
                      onChange={(e) => updateCabin(selectedCabin!, { x: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cabin-y">Y Position</Label>
                    <Input
                      id="cabin-y"
                      type="number"
                      value={selectedCabinData.y}
                      onChange={(e) => updateCabin(selectedCabin!, { y: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cabin-width">Width</Label>
                    <Input
                      id="cabin-width"
                      type="number"
                      value={selectedCabinData.width}
                      onChange={(e) => updateCabin(selectedCabin!, { width: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cabin-height">Height</Label>
                    <Input
                      id="cabin-height"
                      type="number"
                      value={selectedCabinData.height}
                      onChange={(e) => updateCabin(selectedCabin!, { height: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => deleteCabin(selectedCabin!)}
                  className="w-full"
                >
                  Delete Cabin
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Total Cabins</Label>
                  <p className="text-sm text-muted-foreground">{layout.cabins.length}</p>
                </div>
                
                <div>
                  <Label>Canvas Size</Label>
                  <p className="text-sm text-muted-foreground">
                    {layout.layout.width} × {layout.layout.height}
                  </p>
                </div>

                <div>
                  <Label>Base Price</Label>
                  <p className="text-sm text-muted-foreground">₹{basePrice}/month</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};