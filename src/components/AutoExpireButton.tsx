import { Button } from '@/components/ui/button';
import { useCabinVacate } from '@/hooks/useCabinVacate';
import { useAuth } from '@/hooks/useAuth';
import { RotateCcw } from 'lucide-react';

interface AutoExpireButtonProps {
  onCompleted?: () => void;
}

export function AutoExpireButton({ onCompleted }: AutoExpireButtonProps) {
  const { autoExpireCabinBookings, loading } = useCabinVacate();
  const { userRole } = useAuth();

  // Only show for admins
  if (userRole !== 'admin') {
    return null;
  }

  const handleAutoExpire = async () => {
    try {
      await autoExpireCabinBookings();
      onCompleted?.();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleAutoExpire}
      disabled={loading}
      className="gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      {loading ? 'Processing...' : 'Auto-Expire Bookings'}
    </Button>
  );
}