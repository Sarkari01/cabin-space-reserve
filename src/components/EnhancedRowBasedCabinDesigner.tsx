import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CabinLayoutData } from '@/types/PrivateHall';
interface RowConfig {
  name: string;
  cabins: number;
  priceOverride?: number;
  depositOverride?: number;
}
interface CabinAvailability {
  [cabinId: string]: {
    status: 'available' | 'occupied' | 'maintenance';
    bookings?: number;
  };
}
interface EnhancedRowBasedCabinDesignerProps {
  layout: CabinLayoutData;
  onChange: (layout: CabinLayoutData) => void;
  basePrice: number;
  baseDeposit?: number;
  privateHallId?: string;
  showAvailability?: boolean;
  readOnly?: boolean;
  onCabinSelect?: (cabinId: string) => void;
}
export const EnhancedRowBasedCabinDesigner: React.FC<EnhancedRowBasedCabinDesignerProps> = ({
  layout,
  onChange,
  basePrice,
  baseDeposit = 0,
  privateHallId,
  showAvailability = false,
  readOnly = false,
  onCabinSelect
}) => {
  const [rows, setRows] = useState<RowConfig[]>([{
    name: 'A',
    cabins: 5
  }, {
    name: 'B',
    cabins: 5
  }]);
  const [availability, setAvailability] = useState<CabinAvailability>({});
  const [loading, setLoading] = useState(false);

  // Fetch real-time availability data
  const fetchAvailability = async () => {
    if (!privateHallId || !showAvailability) return;
    try {
      setLoading(true);

      // Fetch cabins first
      const { data: cabins, error: cabinsError } = await supabase
        .from('cabins')
        .select('*')
        .eq('private_hall_id', privateHallId);

      if (cabinsError) {
        console.error('Error fetching cabins:', cabinsError);
        return;
      }

      // Then fetch bookings separately to avoid JOIN issues
      const cabinIds = cabins?.map(cabin => cabin.id) || [];
      let bookings: any[] = [];
      
      if (cabinIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('cabin_bookings')
          .select('*')
          .in('cabin_id', cabinIds)
          .in('status', ['active', 'pending'])
          .eq('payment_status', 'paid');

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
        } else {
          bookings = bookingsData || [];
        }
      }
      const availabilityMap: CabinAvailability = {};
      cabins?.forEach(cabin => {
        const activeBookings = bookings.filter(booking => 
          booking.cabin_id === cabin.id && 
          booking.status === 'active' && 
          booking.payment_status === 'paid'
        );
        
        availabilityMap[cabin.id] = {
          status: activeBookings.length > 0 ? 'occupied' : 'available',
          bookings: activeBookings.length
        };
      });
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (showAvailability && privateHallId) {
      fetchAvailability();

      // Set up real-time subscription
      const channel = supabase.channel('cabin-bookings-changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cabin_bookings',
        filter: `private_hall_id=eq.${privateHallId}`
      }, () => {
        fetchAvailability();
      }).subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [privateHallId, showAvailability]);
  const addRow = () => {
    const nextLetter = String.fromCharCode(65 + rows.length);
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
    const rowHeight = 90;
    const cabinWidth = 70;
    const cabinHeight = 60;
    const rowSpacing = 25;
    const cabinSpacing = 15;
    currentRows.forEach((row, rowIndex) => {
      for (let cabinIndex = 0; cabinIndex < row.cabins; cabinIndex++) {
        const cabinName = `${row.name}${cabinIndex + 1}`;
        const uniqueId = `cabin-${cabinId}`;
          cabins.push({
          id: uniqueId,
          name: cabinName,
          x: 30 + cabinIndex * (cabinWidth + cabinSpacing),
          y: 30 + rowIndex * (rowHeight + rowSpacing),
          width: cabinWidth,
          height: cabinHeight,
          monthly_price: row.priceOverride || basePrice,
          refundable_deposit: row.depositOverride ?? baseDeposit,
          amenities: [],
          status: availability[uniqueId]?.status || 'available'
        });
        cabinId++;
      }
    });
    const maxCabinsPerRow = Math.max(...currentRows.map(r => r.cabins));
    const totalWidth = Math.max(700, 60 + maxCabinsPerRow * (cabinWidth + cabinSpacing));
    const totalHeight = Math.max(500, 60 + currentRows.length * (rowHeight + rowSpacing));
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
  useEffect(() => {
    updateLayout(rows);
  }, [availability]);
  const getCabinStatusInfo = (cabin: any) => {
    const cabinAvailability = availability[cabin.id];
    if (!cabinAvailability) return {
      status: 'available',
      color: 'bg-green-100 border-green-400',
      textColor: 'text-green-700'
    };
    switch (cabinAvailability.status) {
      case 'occupied':
        return {
          status: 'Occupied',
          color: 'bg-red-100 border-red-400',
          textColor: 'text-red-700'
        };
      case 'maintenance':
        return {
          status: 'Maintenance',
          color: 'bg-yellow-100 border-yellow-400',
          textColor: 'text-yellow-700'
        };
      default:
        return {
          status: 'Available',
          color: 'bg-green-100 border-green-400',
          textColor: 'text-green-700'
        };
    }
  };
  const totalCabins = rows.reduce((sum, row) => sum + row.cabins, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.cabins * (row.priceOverride || basePrice), 0);
  const occupiedCabins = Object.values(availability).filter(a => a.status === 'occupied').length;
  const availableCabins = totalCabins - occupiedCabins;
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{readOnly ? "Cabin Layout" : "Enhanced Theater-Style Layout"}</h3>
          {showAvailability && <p className="text-sm text-muted-foreground">
              Real-time availability • {loading ? 'Updating...' : 'Live data'}
            </p>}
        </div>
        {!readOnly && (
          <Button onClick={addRow} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        )}
      </div>

      {/* Real-time stats */}
      {showAvailability && <div className="grid grid-cols-3 gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium">Available: {availableCabins}</span>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm font-medium">Occupied: {occupiedCabins}</span>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total: {totalCabins}</span>
            </div>
          </Card>
        </div>}

      {/* Row Configuration - Hidden in read-only mode */}
      {!readOnly && (
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
                  <Label htmlFor={`row-deposit-${index}`}>Refundable Deposit (Optional)</Label>
                  <Input id={`row-deposit-${index}`} type="number" value={row.depositOverride ?? ''} onChange={e => updateRow(index, {
                depositOverride: e.target.value ? parseFloat(e.target.value) : undefined
              })} placeholder={`Default: ₹${baseDeposit}`} />
                </div>

                <div className="flex gap-2">
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
      )}

      {/* Enhanced Layout Preview */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Layout Preview</Label>
        <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-dashed border-border rounded-lg overflow-auto" style={{
        width: '100%',
        height: '500px'
      }}>
          <div className="relative" style={{
          width: layout.layout.width,
          height: layout.layout.height,
          minWidth: '100%',
          minHeight: '100%'
        }}>
            {layout.cabins.map(cabin => {
            const statusInfo = getCabinStatusInfo(cabin);
            return <div 
              key={cabin.id} 
              className={`absolute border-2 rounded-lg text-xs flex flex-col justify-center items-center transition-all ${
                readOnly && statusInfo.status === 'Available' ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-primary' : 
                !readOnly ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-not-allowed'
              } ${statusInfo.color}`} 
              style={{
                left: cabin.x,
                top: cabin.y,
                width: cabin.width,
                height: cabin.height
              }} 
              title={`${cabin.name} - ${statusInfo.status} - ₹${cabin.monthly_price}/month`}
              onClick={() => {
                if (readOnly && statusInfo.status === 'Available' && onCabinSelect) {
                  onCabinSelect(cabin.id);
                }
              }}
            >
              <div className="font-bold text-center text-sm">{cabin.name}</div>
              <div className={`text-[10px] font-medium ${statusInfo.textColor}`}>
                {statusInfo.status}
              </div>
              <div className="text-[9px] text-gray-600 flex items-center">
                <DollarSign className="h-2 w-2 mr-1" />
                ₹{cabin.monthly_price}
                {cabin.refundable_deposit > 0 && (
                  <span className="text-[8px] ml-1">+₹{cabin.refundable_deposit} dep</span>
                )}
              </div>
            </div>;
          })}
            
            {/* Entrance/Stage Indicator */}
            
            
            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
              <h4 className="text-xs font-semibold mb-2">Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-400 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-400 rounded"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded"></div>
                  <span>Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Summary - Only show in edit mode or if showing availability */}
      {(!readOnly || showAvailability) && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <Label className="text-base font-medium mb-3 block">
            {readOnly ? "Cabin Information" : "Summary & Analytics"}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Rows:</span>
              <div className="font-bold text-lg">{rows.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Cabins:</span>
              <div className="font-bold text-lg">{totalCabins}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Occupancy Rate:</span>
              <div className="font-bold text-lg">
                {totalCabins > 0 ? Math.round(occupiedCabins / totalCabins * 100) : 0}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Monthly Revenue Potential:</span>
              <div className="font-bold text-lg text-green-600">₹{totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      )}
    </div>;
};