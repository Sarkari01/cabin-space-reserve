import { Button } from "@/components/ui/button";

interface SeatLayoutPreviewProps {
  layoutMode: "fixed" | "custom";
  rows: number;
  seatsPerRow: number;
  customRowNames: string[];
  rowSeatConfig?: Record<string, { seats: number }>;
}

export function SeatLayoutPreview({ 
  layoutMode, 
  rows, 
  seatsPerRow, 
  customRowNames,
  rowSeatConfig 
}: SeatLayoutPreviewProps) {
  const renderFixedLayout = () => {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, rowIndex) => {
          const rowName = customRowNames[rowIndex] || String.fromCharCode(65 + rowIndex);
          return (
            <div key={rowIndex} className="flex items-center justify-center gap-2">
              <div className="w-8 flex justify-center items-center font-medium text-muted-foreground">
                {rowName}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: seatsPerRow }, (_, seatIndex) => (
                  <Button
                    key={seatIndex}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                    disabled
                  >
                    {seatIndex + 1}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCustomLayout = () => {
    if (!rowSeatConfig) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p>Configure custom rows to see preview</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(rowSeatConfig).map(([rowName, config]) => (
          <div key={rowName} className="flex items-center justify-center gap-2">
            <div className="w-8 flex justify-center items-center font-medium text-muted-foreground">
              {rowName}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: config.seats }, (_, seatIndex) => (
                <Button
                  key={seatIndex}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                  disabled
                >
                  {seatIndex + 1}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totalSeats = layoutMode === "custom" 
    ? Object.values(rowSeatConfig || {}).reduce((sum, row) => sum + row.seats, 0)
    : rows * seatsPerRow;

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Seat Layout Preview</h4>
        <div className="bg-white p-4 rounded border">
          {layoutMode === "fixed" ? renderFixedLayout() : renderCustomLayout()}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Total Seats: <span className="font-medium">{totalSeats}</span>
        </div>
      </div>
    </div>
  );
}