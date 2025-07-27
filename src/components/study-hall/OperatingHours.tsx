import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, X } from "lucide-react";

interface OperatingHour {
  day: string;
  enabled: boolean;
  openTime: string;
  closeTime: string;
  is24Hours: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  recurring: boolean;
}

interface OperatingHoursProps {
  onHoursChange: (hours: OperatingHour[], holidays: Holiday[]) => void;
  disabled?: boolean;
  initialHours?: OperatingHour[];
  initialHolidays?: Holiday[];
}

const defaultHours: OperatingHour[] = [
  { day: 'Monday', enabled: true, openTime: '09:00', closeTime: '18:00', is24Hours: false },
  { day: 'Tuesday', enabled: true, openTime: '09:00', closeTime: '18:00', is24Hours: false },
  { day: 'Wednesday', enabled: true, openTime: '09:00', closeTime: '18:00', is24Hours: false },
  { day: 'Thursday', enabled: true, openTime: '09:00', closeTime: '18:00', is24Hours: false },
  { day: 'Friday', enabled: true, openTime: '09:00', closeTime: '18:00', is24Hours: false },
  { day: 'Saturday', enabled: true, openTime: '10:00', closeTime: '16:00', is24Hours: false },
  { day: 'Sunday', enabled: false, openTime: '10:00', closeTime: '16:00', is24Hours: false },
];

export function OperatingHours({ 
  onHoursChange, 
  disabled = false,
  initialHours = defaultHours,
  initialHolidays = []
}: OperatingHoursProps) {
  const [hours, setHours] = useState<OperatingHour[]>(initialHours);
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', recurring: false });

  useEffect(() => {
    onHoursChange(hours, holidays);
  }, [hours, holidays]);

  const updateHour = (index: number, field: keyof OperatingHour, value: any) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  const addHoliday = () => {
    if (newHoliday.name && newHoliday.date) {
      const holiday: Holiday = {
        id: Date.now().toString(),
        ...newHoliday
      };
      setHolidays([...holidays, holiday]);
      setNewHoliday({ name: '', date: '', recurring: false });
    }
  };

  const removeHoliday = (id: string) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  const applyToAll = (field: 'openTime' | 'closeTime', value: string) => {
    const newHours = hours.map(hour => ({
      ...hour,
      [field]: value
    }));
    setHours(newHours);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyToAll('openTime', '09:00')}
              disabled={disabled}
            >
              Set All Open: 9:00 AM
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyToAll('closeTime', '18:00')}
              disabled={disabled}
            >
              Set All Close: 6:00 PM
            </Button>
          </div>

          <div className="space-y-3">
            {hours.map((hour, index) => (
              <div key={hour.day} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-20">
                  <Badge variant={hour.enabled ? "default" : "secondary"}>
                    {hour.day.slice(0, 3)}
                  </Badge>
                </div>
                
                <Switch
                  checked={hour.enabled}
                  onCheckedChange={(checked) => updateHour(index, 'enabled', checked)}
                  disabled={disabled}
                />

                {hour.enabled && (
                  <>
                    <Switch
                      checked={hour.is24Hours}
                      onCheckedChange={(checked) => updateHour(index, 'is24Hours', checked)}
                      disabled={disabled}
                    />
                    <span className="text-sm text-muted-foreground">24/7</span>

                    {!hour.is24Hours && (
                      <>
                        <Input
                          type="time"
                          value={hour.openTime}
                          onChange={(e) => updateHour(index, 'openTime', e.target.value)}
                          disabled={disabled}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={hour.closeTime}
                          onChange={(e) => updateHour(index, 'closeTime', e.target.value)}
                          disabled={disabled}
                          className="w-32"
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Holidays & Closures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="Holiday name"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              disabled={disabled}
            />
            <Input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              disabled={disabled}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={newHoliday.recurring}
                onCheckedChange={(checked) => setNewHoliday({ ...newHoliday, recurring: checked })}
                disabled={disabled}
              />
              <span className="text-sm">Recurring</span>
            </div>
            <Button onClick={addHoliday} disabled={disabled || !newHoliday.name || !newHoliday.date}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {holidays.length > 0 && (
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{holiday.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">{holiday.date}</span>
                    {holiday.recurring && (
                      <Badge variant="outline" className="ml-2">Recurring</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHoliday(holiday.id)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}