import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCabinVacate } from '@/hooks/useCabinVacate';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

interface CabinVacateButtonProps {
  bookingId: string;
  onVacated?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function CabinVacateButton({ 
  bookingId, 
  onVacated, 
  disabled = false,
  size = 'default',
  variant = 'outline'
}: CabinVacateButtonProps) {
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { vacateCabinBooking, loading } = useCabinVacate();
  const { userRole } = useAuth();

  // Only show button for admins and merchants
  if (!userRole || !['admin', 'merchant'].includes(userRole)) {
    return null;
  }

  const handleVacate = async () => {
    try {
      await vacateCabinBooking(bookingId, reason || undefined);
      setIsOpen(false);
      setReason('');
      onVacated?.();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={disabled}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Mark as Vacated
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vacate Cabin Booking</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the cabin booking as vacated and make the cabin immediately available for new bookings.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for vacation (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for vacating this booking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleVacate}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Vacating...' : 'Vacate Cabin'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}