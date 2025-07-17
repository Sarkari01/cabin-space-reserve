import { Button } from "@/components/ui/button";

interface StudyHall {
  id: string;
  name: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names: string[];
  layout_mode?: string;
  row_seat_config?: any;
}

interface Seat {
  id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

interface PublicSeatLayoutProps {
  studyHall: StudyHall;
  seats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  selectedSeatId?: string;
}

export function PublicSeatLayout({ studyHall, seats, onSeatSelect, selectedSeatId }: PublicSeatLayoutProps) {
  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row_name]) {
      acc[seat.row_name] = [];
    }
    acc[seat.row_name].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows alphabetically
  const sortedRows = Object.keys(seatsByRow).sort();

  const getSeatButtonVariant = (seat: Seat) => {
    if (selectedSeatId === seat.id) return "default";
    if (!seat.is_available) return "secondary";
    return "outline";
  };

  const getSeatButtonClassName = (seat: Seat) => {
    const baseClasses = "h-12 w-12 p-0 font-medium text-xs transition-all hover:scale-105";
    
    if (selectedSeatId === seat.id) {
      return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white border-blue-600`;
    }
    
    if (!seat.is_available) {
      return `${baseClasses} bg-red-100 hover:bg-red-200 text-red-700 border-red-300 cursor-not-allowed`;
    }
    
    return `${baseClasses} bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 hover:border-emerald-400`;
  };

  return (
    <div className="space-y-6">
      {/* Fixed Layout */}
      {(!studyHall.layout_mode || studyHall.layout_mode === "fixed") && (
        <div className="space-y-4">
          {sortedRows.map((rowName) => {
            const rowSeats = seatsByRow[rowName];
            // Sort seats by seat number
            rowSeats.sort((a, b) => a.seat_number - b.seat_number);
            
            return (
              <div key={rowName} className="flex items-center justify-center gap-2">
                {/* Row Label */}
                <div className="w-8 flex justify-center items-center font-medium text-muted-foreground">
                  {rowName}
                </div>
                
                {/* Seats */}
                <div className="flex gap-2">
                  {rowSeats.map((seat) => (
                    <Button
                      key={seat.id}
                      variant={getSeatButtonVariant(seat)}
                      className={getSeatButtonClassName(seat)}
                      onClick={() => onSeatSelect(seat)}
                      disabled={!seat.is_available}
                    >
                      {seat.seat_number}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Layout */}
      {studyHall.layout_mode === "custom" && studyHall.row_seat_config && (
        <div className="space-y-4">
          {Object.entries(studyHall.row_seat_config).map(([rowName, config]: [string, any]) => {
            const rowSeats = seatsByRow[rowName] || [];
            rowSeats.sort((a, b) => a.seat_number - b.seat_number);
            
            return (
              <div key={rowName} className="flex items-center justify-center gap-2">
                {/* Row Label */}
                <div className="w-8 flex justify-center items-center font-medium text-muted-foreground">
                  {rowName}
                </div>
                
                {/* Seats */}
                <div className="flex gap-2">
                  {rowSeats.map((seat) => (
                    <Button
                      key={seat.id}
                      variant={getSeatButtonVariant(seat)}
                      className={getSeatButtonClassName(seat)}
                      onClick={() => onSeatSelect(seat)}
                      disabled={!seat.is_available}
                    >
                      {seat.seat_number}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {sortedRows.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No seats available in this study hall.</p>
        </div>
      )}
    </div>
  );
}