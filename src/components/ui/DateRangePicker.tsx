import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
  className?: string;
  align?: "start" | "center" | "end";
  presets?: Array<{ label: string; range: () => DateRange | undefined }>;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  align = "start",
  presets,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const label = React.useMemo(() => {
    if (value?.from && value?.to) {
      return `${format(value.from, "PP")} - ${format(value.to, "PP")}`;
    }
    if (value?.from) return format(value.from, "PP");
    return placeholder;
  }, [value, placeholder]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal min-w-[240px]",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-col md:flex-row">
            <Calendar
              mode="range"
              selected={value as any}
              onSelect={(range: any) => onChange?.(range)}
              initialFocus
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </div>
        </PopoverContent>
      </Popover>

      {presets && presets.length > 0 && (
        <div className="hidden md:flex items-center gap-1">
          {presets.map((p) => (
            <Button
              key={p.label}
              variant="ghost"
              size="sm"
              onClick={() => onChange?.(p.range())}
            >
              {p.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
