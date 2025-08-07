import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface CabinAvailabilityBadgeProps {
  status: 'available' | 'booked' | 'maintenance' | 'expiring-soon';
  bookedUntil?: string;
  daysRemaining?: number;
  size?: 'sm' | 'default';
}

export function CabinAvailabilityBadge({ 
  status, 
  bookedUntil, 
  daysRemaining,
  size = 'default' 
}: CabinAvailabilityBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          variant: 'outline' as const,
          className: 'text-green-600 border-green-200 bg-green-50',
          icon: CheckCircle,
          text: 'Available'
        };
      case 'booked':
        return {
          variant: 'outline' as const,
          className: 'text-orange-600 border-orange-200 bg-orange-50',
          icon: Calendar,
          text: bookedUntil 
            ? `Booked until ${new Date(bookedUntil).toLocaleDateString()}`
            : 'Booked'
        };
      case 'expiring-soon':
        return {
          variant: 'outline' as const,
          className: 'text-yellow-600 border-yellow-200 bg-yellow-50',
          icon: Clock,
          text: `Expires in ${daysRemaining} days`
        };
      case 'maintenance':
        return {
          variant: 'outline' as const,
          className: 'text-red-600 border-red-200 bg-red-50',
          icon: AlertTriangle,
          text: 'Under Maintenance'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'text-gray-600 border-gray-200 bg-gray-50',
          icon: Clock,
          text: 'Unknown Status'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} gap-1 ${size === 'sm' ? 'px-2 py-1 text-xs' : ''}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {config.text}
    </Badge>
  );
}