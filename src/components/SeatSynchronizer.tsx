import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SeatSynchronizerProps {
  onSeatUpdate?: () => void;
}

export function SeatSynchronizer({ onSeatUpdate }: SeatSynchronizerProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for real-time changes to seats table
    const seatChannel = supabase
      .channel('seat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats'
        },
        (payload) => {
          console.log('Real-time seat update:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('New seats created for study hall');
          } else if (payload.eventType === 'DELETE') {
            console.log('Seats removed from study hall');
          }
          
          // Trigger callback to refresh data
          onSeatUpdate?.();
        }
      )
      .subscribe();

    // Listen for study hall changes that might affect seats
    const studyHallChannel = supabase
      .channel('study-hall-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'study_halls'
        },
        (payload) => {
          console.log('Study hall updated:', payload);
          
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Check if layout-affecting fields changed
          const layoutChanged = 
            oldRecord?.rows !== newRecord?.rows ||
            oldRecord?.seats_per_row !== newRecord?.seats_per_row ||
            JSON.stringify(oldRecord?.custom_row_names) !== JSON.stringify(newRecord?.custom_row_names);
          
          if (layoutChanged) {
            toast({
              title: "Seat Layout Updated",
              description: `Study hall "${newRecord?.name}" seat layout has been updated.`,
            });
            
            // Trigger callback to refresh data
            onSeatUpdate?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(seatChannel);
      supabase.removeChannel(studyHallChannel);
    };
  }, [onSeatUpdate, toast]);

  return null; // This component doesn't render anything
}